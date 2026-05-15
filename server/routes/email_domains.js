/**
 * server/routes/email_domains.js
 * Per-client sending domain management via MailerSend.
 *
 * GET    /api/email-domains?environment_id=X  — list domains for env
 * POST   /api/email-domains                   — add domain (registers with MailerSend)
 * GET    /api/email-domains/account           — MailerSend account status
 * POST   /api/email-domains/setup-inbound     — create inbound reply route (one-time)
 * GET    /api/email-domains/:id/dns           — get DNS records to add
 * POST   /api/email-domains/:id/verify        — trigger verification check
 * PATCH  /api/email-domains/:id              — update (e.g. set_default)
 * DELETE /api/email-domains/:id              — remove domain
 */

const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, insert, update, remove, getStore, saveStore } = require('../db/init');
const ms = require('../services/mailersend');

const router = express.Router();

function ensureCollection() {
  const store = getStore();
  if (!store.email_domains) { store.email_domains = []; saveStore(store); }
}

// ─── Account status ───────────────────────────────────────────────────────────
router.get('/account', async (req, res) => {
  const info = await ms.getAccountInfo();
  res.json({ configured: ms.isConfigured(), ...info });
});

// ─── One-time inbound route setup ────────────────────────────────────────────
router.post('/setup-inbound', async (req, res) => {
  if (!ms.isConfigured()) {
    return res.json({ simulated: true,
      message: 'Simulation mode — add MAILERSEND_API_KEY to create real inbound route' });
  }
  try {
    const existing = await ms.listInboundRoutes();
    if (existing.length > 0) return res.json({ ok: true, message: 'Inbound route already exists', routes: existing });
    const route = await ms.createInboundRoute();
    res.json({ ok: true, route });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ─── List domains for an environment ─────────────────────────────────────────
router.get('/', async (req, res) => {
  const { environment_id } = req.query;
  ensureCollection();
  let domains = query('email_domains', () => true);
  if (environment_id) domains = domains.filter(d => d.environment_id === environment_id);

  // Enrich with live MailerSend status if configured
  if (ms.isConfigured() && domains.length) {
    try {
      const msDomains = await ms.listDomains();
      const msMap = {};
      for (const d of msDomains) msMap[d.id] = d;
      domains = domains.map(d => {
        const live = d.ms_domain_id ? msMap[d.ms_domain_id] : null;
        if (live) return { ...d, verified: live.is_verified || false, spf_verified: !!live.spf, dkim_verified: !!live.dkim };
        return d;
      });
    } catch (e) { console.warn('[email-domains] MailerSend enrich failed:', e.message); }
  }
  res.json({ data: domains });
});

// ─── Add a domain ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { domain, environment_id, is_default } = req.body;
  if (!domain)         return res.status(400).json({ error: 'domain required' });
  if (!environment_id) return res.status(400).json({ error: 'environment_id required' });
  ensureCollection();

  const existing = query('email_domains', d => d.environment_id === environment_id && d.domain === domain);
  if (existing.length) return res.status(409).json({ error: 'Domain already added for this environment' });

  let msDomainId = null;
  let dnsRecords = null;
  let simulated  = false;
  try {
    const result = await ms.addDomain(domain);
    msDomainId = result.id || null;
    dnsRecords = result.dns || null;
    simulated  = result.simulated || false;
  } catch (e) { return res.status(502).json({ error: `MailerSend: ${e.message}` }); }

  // Auto-default if first domain for this environment
  const hasDefault = query('email_domains', d => d.environment_id === environment_id && d.is_default).length > 0;
  const makeDefault = is_default || !hasDefault;
  if (makeDefault) {
    const store = getStore();
    store.email_domains = (store.email_domains || []).map(d =>
      d.environment_id === environment_id ? { ...d, is_default: false } : d);
    saveStore(store);
  }

  const record = {
    id: uuidv4(), environment_id, domain, ms_domain_id: msDomainId,
    dns_records: dnsRecords, verified: false, spf_verified: false, dkim_verified: false,
    is_default: makeDefault, simulated,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  insert('email_domains', record);
  res.status(201).json(record);
});

// ─── Get DNS records ──────────────────────────────────────────────────────────
router.get('/:id/dns', async (req, res) => {
  ensureCollection();
  const domain = query('email_domains', d => d.id === req.params.id)[0];
  if (!domain) return res.status(404).json({ error: 'Not found' });
  if (domain.dns_records) return res.json({ domain, dns_records: domain.dns_records, simulated: domain.simulated });
  if (!domain.ms_domain_id || !ms.isConfigured()) return res.json({ domain, dns_records: null, simulated: true });
  try {
    const dns = await ms.getDomainDns(domain.ms_domain_id);
    update('email_domains', domain.id, { dns_records: dns, updated_at: new Date().toISOString() });
    res.json({ domain, dns_records: dns });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

// ─── Verify domain ────────────────────────────────────────────────────────────
router.post('/:id/verify', async (req, res) => {
  ensureCollection();
  const domain = query('email_domains', d => d.id === req.params.id)[0];
  if (!domain) return res.status(404).json({ error: 'Not found' });
  if (!domain.ms_domain_id || !ms.isConfigured()) {
    return res.json({ verified: false, simulated: true, message: 'Simulation mode' });
  }
  try {
    const result   = await ms.verifyDomain(domain.ms_domain_id);
    const verified = result?.verified || false;
    const spf      = result?.spf      || false;
    const dkim     = result?.dkim     || false;
    update('email_domains', domain.id, { verified, spf_verified: spf, dkim_verified: dkim,
      updated_at: new Date().toISOString() });
    res.json({ ...result, verified, spf_verified: spf, dkim_verified: dkim });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

// ─── Update domain (set_default etc) ─────────────────────────────────────────
router.patch('/:id', (req, res) => {
  ensureCollection();
  const domain = query('email_domains', d => d.id === req.params.id)[0];
  if (!domain) return res.status(404).json({ error: 'Not found' });
  if (req.body.is_default) {
    const store = getStore();
    store.email_domains = (store.email_domains || []).map(d =>
      d.environment_id === domain.environment_id ? { ...d, is_default: false } : d);
    saveStore(store);
  }
  const updated = update('email_domains', domain.id, { ...req.body, updated_at: new Date().toISOString() });
  res.json(updated);
});

// ─── Delete domain ────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  ensureCollection();
  const domain = query('email_domains', d => d.id === req.params.id)[0];
  if (!domain) return res.status(404).json({ error: 'Not found' });
  if (domain.ms_domain_id && ms.isConfigured() && !domain.simulated) {
    try { await ms.deleteDomain(domain.ms_domain_id); }
    catch (e) { console.warn('[email-domains] MailerSend delete failed:', e.message); }
  }
  remove('email_domains', d => d.id === req.params.id);
  res.json({ ok: true });
});

module.exports = router;

/**
 * Integrations route — stores provider credentials securely
 * Credentials are stored in the DB but masked on GET (show last 4 chars only)
 * Only super_admin role should be able to call these endpoints
 */
const express = require('express');
const router  = express.Router();
const { getStore, saveStore } = require('../db/init');

// Mask a credential value for display
function mask(val) {
  if (!val || val.startsWith('YOUR_')) return '';
  if (val.length <= 8) return '••••••••';
  return '••••••••' + val.slice(-4);
}

// GET /api/integrations — return all integration configs (credentials masked)
router.get('/', (req, res) => {
  const store = getStore();
  const configs = store.integrations || {};
  // Return structure with masked values
  const safe = {};
  for (const [provider, fields] of Object.entries(configs)) {
    safe[provider] = {};
    for (const [k, v] of Object.entries(fields)) {
      safe[provider][k] = { masked: mask(v), set: !!(v && !v.startsWith('YOUR_')) };
    }
  }
  res.json(safe);
});

// GET /api/integrations/status — same as messaging service status endpoint
router.get('/status', (req, res) => {
  const { getProviderStatus } = require('../services/messaging');
  res.json(getProviderStatus());
});

// PUT /api/integrations/:provider — save credentials for a provider
router.put('/:provider', (req, res) => {
  const { provider } = req.params;
  const updates = req.body; // { TWILIO_ACCOUNT_SID: "ACxxx", ... }

  const ALLOWED_PROVIDERS = {
    twilio:    ['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_SMS_NUMBER','TWILIO_WA_NUMBER'],
    sendgrid:  ['SENDGRID_API_KEY','SENDGRID_FROM_EMAIL','SENDGRID_FROM_NAME'],
    webhook:   ['WEBHOOK_BASE_URL'],
  };

  const allowed = ALLOWED_PROVIDERS[provider];
  if (!allowed) return res.status(400).json({ error: `Unknown provider: ${provider}` });

  const store = getStore();
  if (!store.integrations) store.integrations = {};
  if (!store.integrations[provider]) store.integrations[provider] = {};

  // Only store allowed keys, filter blanks (don't overwrite with empty)
  for (const key of allowed) {
    if (updates[key] !== undefined && updates[key] !== '') {
      store.integrations[provider][key] = updates[key];
    }
  }

  saveStore();

  // Apply to process.env so messaging service picks them up immediately
  for (const key of allowed) {
    if (store.integrations[provider][key]) {
      process.env[key] = store.integrations[provider][key];
    }
  }

  res.json({ ok: true, provider });
});

// DELETE /api/integrations/:provider/:key — clear a single credential
router.delete('/:provider/:key', (req, res) => {
  const { provider, key } = req.params;
  const store = getStore();
  if (store.integrations?.[provider]?.[key]) {
    store.integrations[provider][key] = '';
    delete process.env[key];
    saveStore();
  }
  res.json({ ok: true });
});

module.exports = router;

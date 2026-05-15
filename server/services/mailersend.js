/**
 * Vercentic — MailerSend Email Service
 *
 * Covers:
 *  - Sending emails (with per-client from domain + reply-to tracking token)
 *  - Domain management (add / verify / list / delete per-client domains)
 *  - Inbound routing (receive replies at replies.vercentic.com → webhook)
 *
 * ENV vars needed in server/.env (or Railway Variables):
 *   MAILERSEND_API_KEY=mlsn.xxxxxxxxxxxxx
 *   MAILERSEND_INBOUND_DOMAIN=replies.vercentic.com
 *   MAILERSEND_DEFAULT_FROM=noreply@vercentic.com
 *   MAILERSEND_FROM_NAME=Vercentic
 *   APP_URL=https://talentos-production-4045.up.railway.app
 *
 * Without MAILERSEND_API_KEY all calls run in SIMULATION mode.
 */

const MAILERSEND_BASE = 'https://api.mailersend.com/v1';

const MS_CONFIGURED = !!(
  process.env.MAILERSEND_API_KEY &&
  !process.env.MAILERSEND_API_KEY.startsWith('YOUR_') &&
  !process.env.MAILERSEND_API_KEY.startsWith('mlsn.YOUR')
);

if (MS_CONFIGURED) {
  console.log('[mailersend] LIVE — key configured');
} else {
  console.log('[mailersend] SIMULATION — no API key');
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function msRequest(method, path, body) {
  const res = await fetch(`${MAILERSEND_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.MAILERSEND_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return { ok: true };

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = data?.message || data?.error || text;
    throw new Error(`MailerSend ${method} ${path} → ${res.status}: ${msg}`);
  }
  return data;
}

// ─── Send email ───────────────────────────────────────────────────────────────
async function sendEmail({ to, toName, from, fromName, replyTo, subject, text, html, tags }) {
  const textBody = text || '';
  const htmlBody = html || textBody.replace(/\n/g, '<br>');

  if (!MS_CONFIGURED) {
    console.log(`[mailersend-sim] To: ${to} | Subject: ${subject} | ReplyTo: ${replyTo || 'none'}`);
    return { simulated: true, messageId: `sim_${Date.now()}`, status: 'simulated' };
  }

  const fromEmail = from     || process.env.MAILERSEND_DEFAULT_FROM || 'noreply@vercentic.com';
  const fromLabel = fromName || process.env.MAILERSEND_FROM_NAME    || 'Vercentic';

  const payload = {
    from: { email: fromEmail, name: fromLabel },
    to:   [{ email: to, name: toName || to }],
    subject,
    text: textBody,
    html: htmlBody,
  };

  if (replyTo) payload.reply_to = { email: replyTo, name: fromLabel };
  if (tags && tags.length) payload.tags = tags;

  // MailerSend returns 202 Accepted — message-id is in X-Message-Id header
  // The fetch wrapper returns parsed body (may be empty on 202)
  const data = await msRequest('POST', '/email', payload);
  return {
    messageId: data?.id || data?.message_id || `ms_${Date.now()}`,
    status: 'sent',
    provider: 'mailersend',
  };
}

// ─── Reply-tracking tokens ────────────────────────────────────────────────────
/**
 * Build:  reply+BASE64(JSON)@INBOUND_DOMAIN
 * Format: { r: recordId, t: threadId, e: environmentId }
 */
function buildReplyToAddress(recordId, threadId, environmentId) {
  const inboundDomain = process.env.MAILERSEND_INBOUND_DOMAIN || 'replies.vercentic.com';
  const payload = JSON.stringify({ r: recordId, t: threadId, e: environmentId });
  const token   = Buffer.from(payload).toString('base64url');
  return `reply+${token}@${inboundDomain}`;
}

/** Parse reply+TOKEN@domain → { recordId, threadId, environmentId } | null */
function parseReplyToken(toAddress) {
  try {
    const match = toAddress.match(/reply\+([^@]+)@/);
    if (!match) return null;
    const { r, t, e } = JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8'));
    return { recordId: r, threadId: t, environmentId: e };
  } catch {
    return null;
  }
}

// ─── Domain management ────────────────────────────────────────────────────────
async function listDomains() {
  if (!MS_CONFIGURED) return [];
  const res = await msRequest('GET', '/domains?limit=100');
  return res.data || [];
}

async function addDomain(domainName) {
  if (!MS_CONFIGURED) {
    return {
      simulated: true,
      id: `sim_${Date.now()}`,
      name: domainName,
      dns: {
        spf:   { type: 'TXT', host: domainName,                     value: 'v=spf1 include:mailersend.net ~all' },
        dkim:  { type: 'TXT', host: `ms._domainkey.${domainName}`,  value: 'SIMULATED_DKIM_VALUE (add real key once MailerSend configured)' },
        dmarc: { type: 'TXT', host: `_dmarc.${domainName}`,         value: 'v=DMARC1; p=none; rua=mailto:dmarc@vercentic.com' },
      },
    };
  }
  const data = await msRequest('POST', '/domains', { name: domainName });
  return data?.data || data;
}

async function getDomainDns(domainId) {
  if (!MS_CONFIGURED) return null;
  const data = await msRequest('GET', `/domains/${domainId}/dns-records`);
  return data?.data || data;
}

async function verifyDomain(domainId) {
  if (!MS_CONFIGURED) return { simulated: true, verified: false };
  return await msRequest('GET', `/domains/${domainId}/verify`);
}

async function deleteDomain(domainId) {
  if (!MS_CONFIGURED) return { simulated: true };
  await msRequest('DELETE', `/domains/${domainId}`);
  return { ok: true };
}

async function updateDomain(domainId, settings) {
  if (!MS_CONFIGURED) return { simulated: true };
  const data = await msRequest('PUT', `/domains/${domainId}`, settings);
  return data?.data || data;
}

// ─── Inbound routing ──────────────────────────────────────────────────────────
async function listInboundRoutes() {
  if (!MS_CONFIGURED) return [];
  const data = await msRequest('GET', '/inbound');
  return data?.data || [];
}

async function createInboundRoute() {
  if (!MS_CONFIGURED) return { simulated: true };
  const appUrl        = process.env.APP_URL || 'https://talentos-production-4045.up.railway.app';
  const inboundDomain = process.env.MAILERSEND_INBOUND_DOMAIN || 'replies.vercentic.com';
  const payload = {
    name: 'Vercentic Reply Tracking',
    domain_enabled: true,
    inbound_domain: inboundDomain,
    catch_filter:  { type: 'catch_all' },
    match_filter:  { type: 'match_all' },
    forwards: [{ type: 'webhook', value: `${appUrl}/api/comms/webhook/email` }],
  };
  const data = await msRequest('POST', '/inbound', payload);
  return data?.data || data;
}

// ─── Account info ─────────────────────────────────────────────────────────────
async function getAccountInfo() {
  if (!MS_CONFIGURED) return { simulated: true, configured: false };
  try {
    const data = await msRequest('GET', '/me');
    return { configured: true, ...(data?.data || data) };
  } catch {
    return { configured: true, error: 'Could not fetch account info' };
  }
}

function isConfigured() { return MS_CONFIGURED; }

module.exports = {
  sendEmail,
  buildReplyToAddress,
  parseReplyToken,
  listDomains,
  addDomain,
  getDomainDns,
  verifyDomain,
  deleteDomain,
  updateDomain,
  listInboundRoutes,
  createInboundRoute,
  getAccountInfo,
  isConfigured,
};

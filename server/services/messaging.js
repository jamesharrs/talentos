/**
 * TalentOS Messaging Service
 * Handles SMS, WhatsApp, and Email dispatch via Twilio (SMS/WA) and SendGrid (Email).
 *
 * SETUP — add these to server/.env:
 *
 *   # Twilio (SMS + WhatsApp)
 *   TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN
 *   TWILIO_SMS_NUMBER=+14155552671
 *   TWILIO_WA_NUMBER=whatsapp:+14155552671
 *
 *   # SendGrid (Email)
 *   SENDGRID_API_KEY=YOUR_SENDGRID_KEY
 *   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
 *   SENDGRID_FROM_NAME=TalentOS
 *
 *   # Twilio Webhook (inbound messages)
 *   WEBHOOK_BASE_URL=https://your-railway-url.up.railway.app
 *
 * Until credentials are configured the service runs in SIMULATION mode —
 * messages are saved to the DB but not actually dispatched.
 */

const TWILIO_CONFIGURED = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID !== 'YOUR_ACCOUNT_SID'
);

const SENDGRID_CONFIGURED = !!(
  process.env.SENDGRID_API_KEY &&
  process.env.SENDGRID_API_KEY !== 'YOUR_SENDGRID_KEY'
);

let twilioClient = null;
if (TWILIO_CONFIGURED) {
  try {
    twilioClient = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('[messaging] Twilio: LIVE');
  } catch (e) {
    console.warn('[messaging] Twilio init failed:', e.message);
  }
} else {
  console.log('[messaging] Twilio: SIMULATION (no credentials)');
}

if (SENDGRID_CONFIGURED) {
  console.log('[messaging] SendGrid: LIVE');
} else {
  console.log('[messaging] SendGrid: SIMULATION (no credentials)');
}

// ─── SMS ─────────────────────────────────────────────────────────────────────
async function sendSMS({ to, body }) {
  if (!twilioClient) {
    return { simulated: true, sid: `sim_${Date.now()}`, status: 'simulated' };
  }
  const msg = await twilioClient.messages.create({
    body,
    from: process.env.TWILIO_SMS_NUMBER,
    to,
    statusCallback: process.env.WEBHOOK_BASE_URL
      ? `${process.env.WEBHOOK_BASE_URL}/api/comms/webhook/sms-status`
      : undefined,
  });
  return { sid: msg.sid, status: msg.status };
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
async function sendWhatsApp({ to, body }) {
  if (!twilioClient) {
    return { simulated: true, sid: `sim_${Date.now()}`, status: 'simulated' };
  }
  // Twilio WhatsApp requires whatsapp: prefix on both sides
  const from = process.env.TWILIO_WA_NUMBER || `whatsapp:${process.env.TWILIO_SMS_NUMBER}`;
  const toWA = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const msg = await twilioClient.messages.create({
    body,
    from,
    to: toWA,
    statusCallback: process.env.WEBHOOK_BASE_URL
      ? `${process.env.WEBHOOK_BASE_URL}/api/comms/webhook/wa-status`
      : undefined,
  });
  return { sid: msg.sid, status: msg.status };
}

// ─── Email (SendGrid) ─────────────────────────────────────────────────────────
async function sendEmail({ to, toName, subject, body, htmlBody }) {
  if (!SENDGRID_CONFIGURED) {
    return { simulated: true, messageId: `sim_${Date.now()}`, status: 'simulated' };
  }
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const [response] = await sgMail.send({
    to: toName ? { email: to, name: toName } : to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@talentos.io',
      name:  process.env.SENDGRID_FROM_NAME  || 'TalentOS',
    },
    subject,
    text: body,
    html: htmlBody || body.replace(/\n/g, '<br>'),
  });
  return { messageId: response.headers['x-message-id'], status: 'sent' };
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function getProviderStatus() {
  return {
    sms:       TWILIO_CONFIGURED   ? 'live' : 'simulation',
    whatsapp:  TWILIO_CONFIGURED   ? 'live' : 'simulation',
    email:     SENDGRID_CONFIGURED ? 'live' : 'simulation',
  };
}

module.exports = { sendSMS, sendWhatsApp, sendEmail, getProviderStatus };

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const dotenv  = require('dotenv');

const ENV_PATH = path.join(__dirname, '../.env');
const SA_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'talentos-internal-2026';

// ── Auth check ────────────────────────────────────────────────────────────────
router.post('/auth', (req, res) => {
  const { password } = req.body;
  if (password === SA_PASSWORD) {
    res.json({ ok: true, token: Buffer.from(`sa:${Date.now()}`).toString('base64') });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// ── Read .env ─────────────────────────────────────────────────────────────────
router.get('/env', (req, res) => {
  try {
    const raw = fs.readFileSync(ENV_PATH, 'utf8');
    const lines = raw.split('\n');
    const vars = [];
    let currentComment = '';

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ─')) {
        currentComment = trimmed.replace(/^#\s*─+\s*/, '').replace(/\s*─+\s*$/, '').trim();
      } else if (trimmed.startsWith('#')) {
        // inline comment — skip
      } else if (trimmed.includes('=')) {
        const eqIdx = trimmed.indexOf('=');
        const key   = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        vars.push({ key, value, group: currentComment || 'General', line: i });
      }
    });

    res.json({ vars, raw });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Write .env ────────────────────────────────────────────────────────────────
router.patch('/env', (req, res) => {
  try {
    const { updates } = req.body; // [{ key, value }]
    let raw = fs.readFileSync(ENV_PATH, 'utf8');

    updates.forEach(({ key, value }) => {
      const regex = new RegExp(`^(${key}=).*$`, 'm');
      if (regex.test(raw)) {
        raw = raw.replace(regex, `$1${value}`);
      } else {
        raw += `\n${key}=${value}`;
      }
    });

    fs.writeFileSync(ENV_PATH, raw, 'utf8');

    // Hot-reload into process.env
    updates.forEach(({ key, value }) => { process.env[key] = value; });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── System info ───────────────────────────────────────────────────────────────
router.get('/system', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    node:    process.version,
    uptime:  Math.floor(process.uptime()),
    memory:  { rss: mem.rss, heap: mem.heapUsed, heapTotal: mem.heapTotal },
    env:     process.env.NODE_ENV || 'development',
    pid:     process.pid,
    platform: process.platform,
  });
});

// POST /api/superadmin/restore — replace entire data store
router.post("/restore", (req, res) => {
  const { saveStore } = require("../db/init");
  const incoming = req.body.data;
  if (!incoming || typeof incoming !== "object") return res.status(400).json({ error: "No data provided" });
  const store = require("../db/init").getStore();
  Object.assign(store, incoming);
  saveStore();
  const counts = Object.fromEntries(Object.entries(incoming).map(([k,v]) => [k, Array.isArray(v) ? v.length : 0]));
  res.json({ ok: true, counts });
});

module.exports = router;

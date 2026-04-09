// server/tests/helpers.js
// Shared test utilities — spins up Express app in-process (no port needed).
'use strict';

const request = require('supertest');

// Boot the Express app without starting the HTTP server
let _app;
function getApp() {
  if (!_app) {
    // Prevent index.js from calling app.listen() during tests
    process.env.NODE_ENV = 'test';
    // Load the app — index.js exports `app` at the bottom
    _app = require('../index');
  }
  return _app;
}

// Convenience wrappers
const api = {
  get:    (path, headers = {}) => request(getApp()).get(path).set(headers),
  post:   (path, body, headers = {}) => request(getApp()).post(path).set(headers).send(body),
  patch:  (path, body, headers = {}) => request(getApp()).patch(path).set(headers).send(body),
  delete: (path, headers = {}) => request(getApp()).delete(path).set(headers),
};

// Login and return headers with X-User-Id set
async function loginAs(email = 'admin@talentos.io', password = 'Admin1234!') {
  const res = await api.post('/api/users/login', { email, password });
  if (!res.body?.id) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  return { 'X-User-Id': res.body.id };
}

// Get the first environment id from the store
function getDefaultEnvId() {
  const { getStore } = require('../db/init');
  const store = getStore();
  const env = (store.environments || []).find(e => e.is_default) || (store.environments || [])[0];
  if (!env) throw new Error('No environment found in store');
  return env.id;
}

// Get an object id by slug
function getObjectId(slug) {
  const { getStore } = require('../db/init');
  const store = getStore();
  const obj = (store.objects || []).find(o => o.slug === slug);
  if (!obj) throw new Error(`Object not found: ${slug}`);
  return obj.id;
}

module.exports = { api, loginAs, getDefaultEnvId, getObjectId };

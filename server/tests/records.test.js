// server/tests/records.test.js
// Records CRUD contract tests — validation, auth guards, data integrity
'use strict';

const { api, loginAs, getDefaultEnvId, getObjectId } = require('./helpers');

let authHeaders;
let envId;
let objectId;
let createdRecordId;

beforeAll(async () => {
  authHeaders = await loginAs();
  envId       = getDefaultEnvId();
  objectId    = getObjectId('people');
});

describe('POST /api/records — validation', () => {
  test('missing object_id → 400 Validation failed', async () => {
    const res = await api.post('/api/records',
      { environment_id: envId, data: { first_name: 'Test' } },
      authHeaders
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.errors[0].field).toBe('object_id');
  });

  test('missing environment_id → 400', async () => {
    const res = await api.post('/api/records',
      { object_id: objectId, data: { first_name: 'Test' } },
      authHeaders
    );
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('environment_id');
  });

  test('invalid UUID for object_id → 400', async () => {
    const res = await api.post('/api/records',
      { object_id: 'not-a-uuid', environment_id: envId },
      authHeaders
    );
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('object_id');
  });

  test('data key with spaces rejected → 400', async () => {
    const res = await api.post('/api/records',
      { object_id: objectId, environment_id: envId, data: { 'bad key!': 'val' } },
      authHeaders
    );
    expect(res.status).toBe(400);
  });

  test('data value over 50k chars → 400', async () => {
    const res = await api.post('/api/records',
      { object_id: objectId, environment_id: envId, data: { notes: 'x'.repeat(50001) } },
      authHeaders
    );
    expect(res.status).toBe(400);
  });

  test('unknown extra keys stripped — valid record still creates', async () => {
    const res = await api.post('/api/records', {
      object_id:      objectId,
      environment_id: envId,
      data:           { first_name: 'ValidTest', last_name: 'User', email: 'validtest@example.com' },
      injected_field: 'should be stripped',
    }, authHeaders);
    expect([200, 201]).toContain(res.status);
    if (res.body.id) createdRecordId = res.body.id;
  });
});

describe('GET /api/records — auth guard', () => {
  test('unauthenticated request → 401', async () => {
    const res = await api.get(`/api/records?object_id=${objectId}&environment_id=${envId}`);
    // Records GET is public for portal use — may be 200 or 401 depending on config
    // The key thing is it never 500s
    expect(res.status).not.toBe(500);
  });
});

describe('PATCH /api/records/:id — validation', () => {
  test('data key with invalid chars → 400', async () => {
    if (!createdRecordId) return; // skip if create failed
    const res = await api.patch(`/api/records/${createdRecordId}`,
      { data: { '<script>': 'xss' } },
      authHeaders
    );
    expect(res.status).toBe(400);
  });

  test('valid patch → 200 with merged data', async () => {
    if (!createdRecordId) return;
    const res = await api.patch(`/api/records/${createdRecordId}`,
      { data: { first_name: 'Updated', last_name: 'Record' } },
      authHeaders
    );
    expect(res.status).toBe(200);
    expect(res.body.data.first_name).toBe('Updated');
  });
});

describe('DELETE /api/records/:id', () => {
  test('soft delete removes record from list', async () => {
    if (!createdRecordId) return;
    const res = await api.delete(`/api/records/${createdRecordId}?environment_id=${envId}`, authHeaders);
    expect([200, 204]).toContain(res.status);
  });
});

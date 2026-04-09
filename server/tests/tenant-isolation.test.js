// server/tests/tenant-isolation.test.js
// Verify that records created in one tenant are invisible to another.
// This is the most critical security property of the platform.
'use strict';

const { api, loginAs, getDefaultEnvId, getObjectId } = require('./helpers');

let adminHeaders;
let envId;
let objectId;
let recordId; // created in master tenant

beforeAll(async () => {
  adminHeaders = await loginAs();
  envId        = getDefaultEnvId();
  objectId     = getObjectId('people');
});

describe('Tenant isolation — cross-tenant data access', () => {
  test('record created in master tenant is readable by master admin', async () => {
    const create = await api.post('/api/records', {
      object_id:      objectId,
      environment_id: envId,
      data:           { first_name: 'TenantTest', last_name: 'Secret', email: 'tenanttest@example.com' },
    }, adminHeaders);
    expect([200, 201]).toContain(create.status);
    recordId = create.body.id;
    expect(recordId).toBeDefined();

    const read = await api.get(
      `/api/records/${recordId}`,
      adminHeaders
    );
    expect(read.status).toBe(200);
    expect(read.body.data.first_name).toBe('TenantTest');
  });

  test('same record is NOT accessible via a fake tenant slug header', async () => {
    if (!recordId) return;
    // Inject a different tenant slug — should return 404 or 401, not the master record
    const res = await api.get(
      `/api/records/${recordId}`,
      { ...adminHeaders, 'X-Tenant-Slug': 'fake-tenant-xyz' }
    );
    // Either not found in the fake tenant's store, or auth fails
    // It must NOT return the master tenant's record
    if (res.status === 200) {
      // If it 200s, the record must not belong to the fake tenant
      expect(res.body.data?.first_name).not.toBe('TenantTest');
    } else {
      expect([401, 403, 404]).toContain(res.status);
    }
  });

  test('records list for a fake tenant returns empty, not master data', async () => {
    const res = await api.get(
      `/api/records?object_id=${objectId}&environment_id=${envId}`,
      { 'X-Tenant-Slug': 'fake-tenant-xyz' }
    );
    // Either empty result set or auth error — never the master tenant's records
    if (res.status === 200) {
      const records = res.body.records || res.body;
      const leaked = Array.isArray(records)
        ? records.filter(r => r.data?.first_name === 'TenantTest')
        : [];
      expect(leaked).toHaveLength(0);
    }
  });

  test('environment_id from another tenant cannot be used to read records', async () => {
    // Use a valid-format UUID that doesn't belong to master tenant
    const fakeEnvId = '00000000-0000-0000-0000-000000000000';
    const res = await api.get(
      `/api/records?object_id=${objectId}&environment_id=${fakeEnvId}`,
      adminHeaders
    );
    if (res.status === 200) {
      const records = res.body.records || res.body;
      expect(Array.isArray(records) ? records : []).toHaveLength(0);
    } else {
      expect([400, 401, 403, 404]).toContain(res.status);
    }
  });
});

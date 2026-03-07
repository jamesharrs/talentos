const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, findOne, insert, update, remove } = require('../db/init');

// GET all roles with user counts
router.get('/', (req, res) => {
  const roles = query('roles').map(role => ({
    ...role,
    user_count: query('users', u => u.role_id === role.id && u.status !== 'deactivated').length,
    permissions: query('permissions', p => p.role_id === role.id)
  }));
  res.json(roles);
});

// GET single role
router.get('/:id', (req, res) => {
  const role = findOne('roles', r => r.id === req.params.id);
  if (!role) return res.status(404).json({ error: 'Not found' });
  const permissions = query('permissions', p => p.role_id === req.params.id);
  const users = query('users', u => u.role_id === req.params.id).map(u => ({ ...u, password_hash: undefined }));
  res.json({ ...role, permissions, users });
});

// POST create custom role
router.post('/', (req, res) => {
  const { name, description, color, clone_from_role_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const id = uuidv4();
  const role = insert('roles', { id, name, slug, description: description||'', color: color||'#3b5bdb', is_system: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });

  // Clone permissions from another role if specified
  if (clone_from_role_id) {
    const sourcePerms = query('permissions', p => p.role_id === clone_from_role_id);
    for (const perm of sourcePerms) {
      insert('permissions', { ...perm, id: uuidv4(), role_id: id, created_at: new Date().toISOString() });
    }
  }
  res.status(201).json(role);
});

// PATCH update role
router.patch('/:id', (req, res) => {
  const role = findOne('roles', r => r.id === req.params.id);
  if (!role) return res.status(404).json({ error: 'Not found' });
  if (role.is_system) return res.status(403).json({ error: 'Cannot modify system roles' });
  const updated = update('roles', r => r.id === req.params.id, req.body);
  res.json(updated);
});

// DELETE role (custom only)
router.delete('/:id', (req, res) => {
  const role = findOne('roles', r => r.id === req.params.id);
  if (!role) return res.status(404).json({ error: 'Not found' });
  if (role.is_system) return res.status(403).json({ error: 'Cannot delete system roles' });
  remove('roles', r => r.id === req.params.id);
  remove('permissions', p => p.role_id === req.params.id);
  res.json({ deleted: true });
});

// GET permissions for a role
router.get('/:id/permissions', (req, res) => {
  res.json(query('permissions', p => p.role_id === req.params.id));
});

// PUT update permissions for a role (bulk replace)
router.put('/:id/permissions', (req, res) => {
  const { permissions } = req.body; // [{ object_slug, action, allowed }]
  if (!Array.isArray(permissions)) return res.status(400).json({ error: 'permissions array required' });
  for (const perm of permissions) {
    const existing = findOne('permissions', p => p.role_id === req.params.id && p.object_slug === perm.object_slug && p.action === perm.action);
    if (existing) update('permissions', p => p.id === existing.id, { allowed: perm.allowed ? 1 : 0 });
    else insert('permissions', { id:uuidv4(), role_id:req.params.id, object_slug:perm.object_slug, action:perm.action, allowed:perm.allowed?1:0, created_at:new Date().toISOString() });
  }
  res.json(query('permissions', p => p.role_id === req.params.id));
});

module.exports = router;

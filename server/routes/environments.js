const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, findOne, insert, update } = require('../db/init');

router.get('/', (req, res) => {
  // Scope environments to the requesting user:
  //  - Super admins see all non-client environments
  //  - Regular users only see their own environment
  const userId = req.headers['x-user-id'];
  const user = userId ? require('../db/init').findOne('users', u => u.id === userId) : null;
  const isSuperAdmin = user?.role_id && (() => {
    const role = require('../db/init').findOne('roles', r => r.id === user.role_id);
    return role?.slug === 'super_admin' || role?.slug === 'admin';
  })();

  if (!isSuperAdmin && user?.environment_id) {
    // Regular user — only return their own environment
    const env = require('../db/init').findOne('environments', e => e.id === user.environment_id);
    return res.json(env ? [env] : []);
  }

  // Only return environments that are NOT owned by a provisioned client.
  // Client environments live in their own tenant store and should never
  // bleed through to the master environment list.
  const envs = query('environments', e => !e.client_id)
    .sort((a, b) => b.is_default - a.is_default);
  res.json(envs);
});
router.get('/:id', (req, res) => { const e = findOne('environments', x=>x.id===req.params.id); e ? res.json(e) : res.status(404).json({error:'Not found'}); });
router.post('/', (req, res) => {
  const { name, slug, description, color } = req.body;
  if (!name||!slug) return res.status(400).json({error:'name and slug required'});
  if (findOne('environments', x=>x.slug===slug)) return res.status(409).json({error:'Slug already exists'});
  res.status(201).json(insert('environments', {id:uuidv4(),name,slug,description:description||null,color:color||'#3b5bdb',is_default:0,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}));
});
router.patch('/:id', (req, res) => { const e = update('environments', x=>x.id===req.params.id, req.body); e ? res.json(e) : res.status(404).json({error:'Not found'}); });
module.exports = router;

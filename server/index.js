require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB, getStore } = require('./db/init');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/environments', require('./routes/environments'));
app.use('/api/objects',      require('./routes/objects'));
app.use('/api/fields',       require('./routes/fields'));
app.use('/api/records',      require('./routes/records'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/roles',        require('./routes/roles'));
app.use('/api/security',     require('./routes/security'));
app.use('/api/notes',        require('./routes/notes'));
app.use('/api/attachments',  require('./routes/attachments'));

app.use('/api/ai', require('./routes/ai-proxy'));
app.use('/api/csv', require('./routes/csv'));
app.use('/api/workflows', require('./routes/workflows'));
app.use('/api/portals',   require('./routes/portals'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.1.0' }));

initDB().then(() => {
  // Ensure new tables exist
  const store = getStore();
  const fs = require('fs'), path = require('path');
  let dirty = false;
  if (!store.notes)       { store.notes = []; dirty = true; }
  if (!store.attachments) { store.attachments = []; dirty = true; }
  if (!store.portals)     { store.portals = []; dirty = true; }
  if (dirty) fs.writeFileSync(path.join(__dirname, '../data/talentos.json'), JSON.stringify(store, null, 2));
  app.listen(3001, () => console.log('TalentOS API → http://localhost:3001'));
}).catch(err => { console.error(err); process.exit(1); });

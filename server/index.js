const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/init');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/environments', require('./routes/environments'));
app.use('/api/objects',      require('./routes/objects'));
app.use('/api/fields',       require('./routes/fields'));
app.use('/api/records',      require('./routes/records'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/roles',        require('./routes/roles'));
app.use('/api/security',     require('./routes/security'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

initDB().then(() => {
  app.listen(3001, () => console.log('TalentOS API → http://localhost:3001'));
}).catch(err => { console.error(err); process.exit(1); });

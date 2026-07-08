try { require('dotenv').config({ path: require('path').join(__dirname, '../.env') }); } catch {}
const express      = require('express');
const session      = require('express-session');
const pgSession    = require('connect-pg-simple')(session);
const cors         = require('cors');
const path         = require('path');
const pool         = require('./db');
const migrate      = require('./migrate');

const app = express();

// ---- Middleware ----
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.use(session({
  store: new pgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET || 'dnd-chronicles-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

// ---- API Routes ----
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api/campaigns',  require('./routes/campaigns'));

// ---- Static Frontend ----
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ---- Start ----
const PORT = process.env.PORT || 3000;
migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🐉 DnD Chronicles running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
  });

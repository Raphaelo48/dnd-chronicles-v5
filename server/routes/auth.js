const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool   = require('../db');

// Helper — what we expose to the client
function safeUser(row) {
  return { id: row.id, name: row.name, email: row.email, isDM: row.is_dm };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Заполните все поля.' });
  if (name.length > 10)
    return res.status(400).json({ error: 'Имя не может быть длиннее 10 символов.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Пароль слишком короткий (минимум 6 символов).' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users(name, email, password) VALUES($1,$2,$3) RETURNING *',
      [name.trim(), email.trim().toLowerCase(), hash]
    );
    const user = rows[0];
    req.session.userId = user.id;
    req.session.save(() => res.json({ user: safeUser(user) }));
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Этот email уже зарегистрирован.' });
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Заполните все поля.' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль.' });

    req.session.userId = user.id;
    req.session.save(() => res.json({ user: safeUser(user) }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/me  — restore session on page reload
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.session.userId]
    );
    if (!rows[0]) return res.json({ user: null });
    res.json({ user: safeUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.json({ user: null });
  }
});

module.exports = router;

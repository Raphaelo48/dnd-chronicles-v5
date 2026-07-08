const router  = require('express').Router();
const pool    = require('../db');

// Auth guard middleware
function auth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Не авторизован.' });
  next();
}

// GET /api/characters  — all characters of current user
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, data, created_at, updated_at
       FROM characters WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.session.userId]
    );
    // Embed DB id into data object so client can reference it
    const characters = rows.map(r => ({ ...r.data, id: r.id }));
    res.json({ characters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// POST /api/characters  — create new character
router.post('/', auth, async (req, res) => {
  const { character } = req.body;
  if (!character) return res.status(400).json({ error: 'Нет данных персонажа.' });

  try {
    // Make sure the character is owned by current user
    character.ownerId = req.session.userId;

    const { rows } = await pool.query(
      `INSERT INTO characters(user_id, data)
       VALUES($1, $2) RETURNING id, data`,
      [req.session.userId, JSON.stringify(character)]
    );
    res.json({ character: { ...rows[0].data, id: rows[0].id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// PATCH /api/characters/:id  — update character (HP, inventory, etc.)
router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { character } = req.body;
  if (!character) return res.status(400).json({ error: 'Нет данных.' });

  try {
    // Verify ownership
    const { rows: existing } = await pool.query(
      'SELECT id FROM characters WHERE id=$1 AND user_id=$2',
      [id, req.session.userId]
    );
    if (!existing.length) return res.status(403).json({ error: 'Нет доступа.' });

    const { rows } = await pool.query(
      `UPDATE characters
       SET data = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, data`,
      [JSON.stringify(character), id]
    );
    res.json({ character: { ...rows[0].data, id: rows[0].id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// DELETE /api/characters/:id
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'DELETE FROM characters WHERE id=$1 AND user_id=$2',
      [id, req.session.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

module.exports = router;

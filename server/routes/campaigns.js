const router = require('express').Router();
const pool   = require('../db');

function auth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Не авторизован.' });
  next();
}

function formatCampaign(row, userId) {
  const members = row.members || [];
  const isOwner  = row.dm_id === userId;
  const isMember = members.some(m => m.userId === userId);
  return {
    id:       row.id,
    name:     row.name,
    desc:     row.description,
    dm:       row.dm_name,
    dmId:     row.dm_id,
    level:    row.level,
    status:   row.status,
    sessions: row.sessions,
    members,
    log:      row.log || [],
    isOwner,
    isMember,
  };
}

// GET /api/campaigns  — list all campaigns
router.get('/', async (req, res) => {
  try {
    const userId = req.session.userId || null;
    const { rows } = await pool.query(`
      SELECT c.*, u.name AS dm_name
      FROM campaigns c
      JOIN users u ON u.id = c.dm_id
      ORDER BY c.created_at DESC
    `);
    res.json({ campaigns: rows.map(r => formatCampaign(r, userId)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// GET /api/campaigns/:id
router.get('/:id', async (req, res) => {
  try {
    const userId = req.session.userId || null;
    const { rows } = await pool.query(`
      SELECT c.*, u.name AS dm_name
      FROM campaigns c
      JOIN users u ON u.id = c.dm_id
      WHERE c.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Кампания не найдена.' });
    res.json({ campaign: formatCampaign(rows[0], userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// POST /api/campaigns  — create
router.post('/', auth, async (req, res) => {
  const { name, description, level, status } = req.body;
  if (!name || !description) return res.status(400).json({ error: 'Название и описание обязательны.' });

  try {
    // Promote user to DM
    await pool.query('UPDATE users SET is_dm = true WHERE id = $1', [req.session.userId]);

    const { rows } = await pool.query(`
      INSERT INTO campaigns(dm_id, name, description, level, status)
      VALUES($1,$2,$3,$4,$5)
      RETURNING id
    `, [req.session.userId, name, description, level || '1-5', status || 'active']);

    const campId = rows[0].id;
    const { rows: full } = await pool.query(`
      SELECT c.*, u.name AS dm_name
      FROM campaigns c JOIN users u ON u.id = c.dm_id
      WHERE c.id = $1
    `, [campId]);

    res.json({ campaign: formatCampaign(full[0], req.session.userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// POST /api/campaigns/:id/join
router.post('/:id/join', auth, async (req, res) => {
  const campId = req.params.id;
  const userId = req.session.userId;

  try {
    const { rows } = await pool.query('SELECT * FROM campaigns WHERE id=$1', [campId]);
    if (!rows[0]) return res.status(404).json({ error: 'Кампания не найдена.' });

    const camp = rows[0];
    if (camp.dm_id === userId)
      return res.status(400).json({ error: 'Вы уже ДМ этой кампании.' });

    const members = camp.members || [];
    if (members.some(m => m.userId === userId))
      return res.status(400).json({ error: 'Вы уже в этой кампании.' });

    // Get user name
    const { rows: uRows } = await pool.query('SELECT name FROM users WHERE id=$1', [userId]);
    members.push({ userId, name: uRows[0].name });

    await pool.query(
      'UPDATE campaigns SET members=$1, updated_at=NOW() WHERE id=$2',
      [JSON.stringify(members), campId]
    );

    // Add log entry
    const logEntry = { type: 'join', userId, userName: uRows[0].name, text: `${uRows[0].name} присоединился к кампании`, date: new Date().toISOString() };
    const log = [...(camp.log || []), logEntry];
    await pool.query('UPDATE campaigns SET log=$1 WHERE id=$2', [JSON.stringify(log), campId]);

    const { rows: full } = await pool.query(`
      SELECT c.*, u.name AS dm_name FROM campaigns c
      JOIN users u ON u.id = c.dm_id WHERE c.id=$1
    `, [campId]);
    res.json({ campaign: formatCampaign(full[0], userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// POST /api/campaigns/:id/leave
router.post('/:id/leave', auth, async (req, res) => {
  const campId = req.params.id;
  const userId = req.session.userId;

  try {
    const { rows } = await pool.query('SELECT * FROM campaigns WHERE id=$1', [campId]);
    if (!rows[0]) return res.status(404).json({ error: 'Кампания не найдена.' });

    const camp = rows[0];
    const members = (camp.members || []).filter(m => m.userId !== userId);
    await pool.query(
      'UPDATE campaigns SET members=$1, updated_at=NOW() WHERE id=$2',
      [JSON.stringify(members), campId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// POST /api/campaigns/:id/log  — add a log entry (DM only)
router.post('/:id/log', auth, async (req, res) => {
  const campId = req.params.id;
  const userId = req.session.userId;
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Текст записи обязателен.' });

  try {
    const { rows } = await pool.query('SELECT * FROM campaigns WHERE id=$1', [campId]);
    if (!rows[0]) return res.status(404).json({ error: 'Кампания не найдена.' });
    if (rows[0].dm_id !== userId) return res.status(403).json({ error: 'Только ДМ может добавлять записи.' });

    const { rows: uRows } = await pool.query('SELECT name FROM users WHERE id=$1', [userId]);
    const entry = {
      id: Date.now(),
      type: 'session',
      userId,
      userName: uRows[0].name,
      text,
      date: new Date().toISOString(),
    };
    const log = [...(rows[0].log || []), entry];
    await pool.query('UPDATE campaigns SET log=$1, sessions=sessions+1, updated_at=NOW() WHERE id=$2',
      [JSON.stringify(log), campId]);

    res.json({ entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// PATCH /api/campaigns/:id  — update (DM only)
router.patch('/:id', auth, async (req, res) => {
  const campId = req.params.id;
  const userId = req.session.userId;
  const { name, description, level, status } = req.body;

  try {
    const { rows } = await pool.query('SELECT * FROM campaigns WHERE id=$1', [campId]);
    if (!rows[0]) return res.status(404).json({ error: 'Кампания не найдена.' });
    if (rows[0].dm_id !== userId) return res.status(403).json({ error: 'Только ДМ может редактировать.' });

    await pool.query(`
      UPDATE campaigns
      SET name=COALESCE($1, name),
          description=COALESCE($2, description),
          level=COALESCE($3, level),
          status=COALESCE($4, status),
          updated_at=NOW()
      WHERE id=$5
    `, [name, description, level, status, campId]);

    const { rows: full } = await pool.query(`
      SELECT c.*, u.name AS dm_name FROM campaigns c
      JOIN users u ON u.id = c.dm_id WHERE c.id=$1
    `, [campId]);
    res.json({ campaign: formatCampaign(full[0], userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

// DELETE /api/campaigns/:id  (DM only)
router.delete('/:id', auth, async (req, res) => {
  const campId = req.params.id;
  const userId = req.session.userId;
  try {
    const { rows } = await pool.query('SELECT dm_id FROM campaigns WHERE id=$1', [campId]);
    if (!rows[0]) return res.status(404).json({ error: 'Кампания не найдена.' });
    if (rows[0].dm_id !== userId) return res.status(403).json({ error: 'Только ДМ может удалить кампанию.' });
    await pool.query('DELETE FROM campaigns WHERE id=$1', [campId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

module.exports = router;

// POST /api/campaigns/:id/kick  (DM only)
router.post('/:id/kick', auth, async (req, res) => {
  const campId = req.params.id;
  const userId = req.session.userId;
  const { userId: targetId } = req.body;

  try {
    const { rows } = await pool.query('SELECT * FROM campaigns WHERE id=$1', [campId]);
    if (!rows[0]) return res.status(404).json({ error: 'Кампания не найдена.' });
    if (rows[0].dm_id !== userId) return res.status(403).json({ error: 'Только ДМ может исключать.' });

    const members = (rows[0].members || []).filter(m => String(m.userId) !== String(targetId));
    await pool.query('UPDATE campaigns SET members=$1, updated_at=NOW() WHERE id=$2',
      [JSON.stringify(members), campId]);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

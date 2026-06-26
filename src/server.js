require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');
const { startPoller, pollActiveTrackers } = require('./poller');

const app = express();
app.use(cors());
app.use(express.json());

const APP_SECRET = process.env.APP_SECRET || '';

function checkSecret(req, res, next) {
  if (!APP_SECRET) return next();
  const provided = req.headers['x-app-secret'] || req.body.secret;
  if (provided !== APP_SECRET) {
    return res.status(401).json({ error: 'Invalid or missing secret.' });
  }
  next();
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'spidey-tracker-backend' });
});

app.post('/api/start', checkSecret, async (req, res) => {
  const { platform, token, postId } = req.body;
  if (!platform || !token) {
    return res.status(400).json({ error: 'platform and token are required.' });
  }
  try {
    await pool.query('UPDATE trackers SET is_active = 0 WHERE platform = ?', [platform]);
    const [result] = await pool.query(
      'INSERT INTO trackers (platform, token, post_id, is_active) VALUES (?, ?, ?, 1)',
      [platform, token, postId || null]
    );
    pollActiveTrackers();
    res.json({ trackerId: result.insertId, status: 'started' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start tracker.' });
  }
});

app.post('/api/stop', checkSecret, async (req, res) => {
  const { trackerId } = req.body;
  if (!trackerId) return res.status(400).json({ error: 'trackerId is required.' });
  try {
    await pool.query('UPDATE trackers SET is_active = 0 WHERE id = ?', [trackerId]);
    res.json({ status: 'stopped' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to stop tracker.' });
  }
});

app.get('/api/data/:trackerId', async (req, res) => {
  const { trackerId } = req.params;
  const limit = parseInt(req.query.limit) || 60;
  try {
    const [rows] = await pool.query(
      'SELECT views, likes, comments, captured_at FROM snapshots WHERE tracker_id = ? ORDER BY captured_at DESC LIMIT ?',
      [trackerId, limit]
    );
    rows.reverse();
    res.json({ snapshots: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data.' });
  }
});

app.get('/api/trackers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, platform, post_id, is_active, created_at FROM trackers ORDER BY created_at DESC LIMIT 20');
    res.json({ trackers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trackers.' });
  }
});

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    startPoller(parseInt(process.env.POLL_INTERVAL_SECONDS) || 60);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

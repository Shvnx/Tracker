const { pool } = require('./db');
const { fetchSnapshot } = require('./platforms');

let isPolling = false;

async function pollActiveTrackers() {
  if (isPolling) return;
  isPolling = true;
  try {
    const [trackers] = await pool.query('SELECT * FROM trackers WHERE is_active = 1');
    for (const t of trackers) {
      try {
        const data = await fetchSnapshot(t.platform, t.token, t.post_id);
        await pool.query(
          'INSERT INTO snapshots (tracker_id, views, likes, comments) VALUES (?, ?, ?, ?)',
          [t.id, data.views, data.likes, data.comments || 0]
        );
        console.log(`[poll] tracker ${t.id} (${t.platform}): views=${data.views} likes=${data.likes}`);
      } catch (err) {
        console.error(`[poll] tracker ${t.id} failed:`, err.message);
      }
    }
  } catch (err) {
    console.error('[poll] failed to load trackers:', err.message);
  } finally {
    isPolling = false;
  }
}

function startPoller(intervalSeconds) {
  pollActiveTrackers();
  setInterval(pollActiveTrackers, intervalSeconds * 1000);
  console.log(`Poller started, running every ${intervalSeconds}s.`);
}

module.exports = { startPoller, pollActiveTrackers };

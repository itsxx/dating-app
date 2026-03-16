const { Pool } = require('pg');

// Use environment variable or fallback to local development settings
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

let initialized = false;

async function initDatabase() {
  if (initialized) {
    return;
  }

  try {
    const client = await pool.connect();
    console.log('PostgreSQL database connected');
    client.release();
    initialized = true;
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    throw err;
  }
}

function getDb() {
  return pool;
}

async function query(text, params = []) {
  if (!initialized) {
    await initDatabase();
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('Query executed', { text, duration, rows: result.rowCount });
    }

    return { rows: result.rows, lastID: result.insertId };
  } catch (err) {
    console.error('Database query error:', { text, error: err.message });
    throw err;
  }
}

module.exports = {
  initDatabase,
  getDb,
  query
};

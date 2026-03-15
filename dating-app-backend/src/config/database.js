const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../dating_app.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  console.log('SQLite database initialized');

  // Auto-save on close
  process.on('exit', () => {
    if (db) {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    }
  });

  return db;
}

function getDb() {
  return db;
}

// Helper to convert parameterized query from PostgreSQL ($1, $2) to SQLite (?, ?)
function convertQuery(text) {
  return text.replace(/\$[0-9]+/g, '?');
}

function query(text, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const convertedText = convertQuery(text);
  const stmt = db.prepare(convertedText);

  // Bind parameters
  if (params && params.length > 0) {
    stmt.bind(params);
  }

  // Check if it's an INSERT/UPDATE/DELETE
  const isWriteQuery = /^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(text.trim());

  if (isWriteQuery) {
    while (stmt.step()) {}
    stmt.free();

    // Get last insert rowid
    const lastRowResult = db.exec('SELECT last_insert_rowid() as id');
    const lastId = lastRowResult.length > 0 ? lastRowResult[0].values[0][0] : null;

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    return Promise.resolve({
      rows: [],
      lastID: lastId
    });
  }

  // SELECT query
  const columns = stmt.getColumnNames();
  const rows = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    rows.push(row);
  }

  stmt.free();

  return Promise.resolve({ rows });
}

module.exports = {
  initDatabase,
  getDb,
  query
};

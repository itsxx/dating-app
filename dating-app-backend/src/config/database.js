const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Use /tmp for Vercel serverless, otherwise use local path
const DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../dating_app.db');

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
    // Extract table name from query
    const tableMatch = text.match(/(?:INTO|FROM)\s+["']?(\w+)["']?/i);
    const tableName = tableMatch ? tableMatch[1] : null;

    // For INSERT ... RETURNING queries, we need to handle them differently
    // SQLite doesn't support RETURNING clause natively
    const isInsertReturning = text.toUpperCase().includes('INSERT') && text.toUpperCase().includes('RETURNING');

    let returnRows = [];
    if (isInsertReturning && tableName) {
      // Extract the ID value from the INSERT statement values
      // Pattern: INSERT INTO table (id, ...) VALUES (?, ?, ...) RETURNING *
      const idValueMatch = text.match(/VALUES\s*\(\s*(\?|[^,)]+)/i);

      while (stmt.step()) {}
      stmt.free();

      // If the first value is a parameter, use it from params array
      if (idValueMatch && idValueMatch[1] === '?' && params && params.length > 0) {
        const insertedId = params[0];
        const returnResult = db.exec(`SELECT * FROM "${tableName}" WHERE id = '${insertedId}'`);
        if (returnResult.length > 0) {
          const columns = returnResult[0].columns;
          returnRows = returnResult[0].values.map(values => {
            const row = {};
            columns.forEach((col, i) => {
              row[col] = values[i];
            });
            return row;
          });
        }
      } else if (idValueMatch && idValueMatch[1] !== '?') {
        // Direct value in SQL
        const insertedId = idValueMatch[1].replace(/['"]/g, '');
        const returnResult = db.exec(`SELECT * FROM "${tableName}" WHERE id = '${insertedId}'`);
        if (returnResult.length > 0) {
          const columns = returnResult[0].columns;
          returnRows = returnResult[0].values.map(values => {
            const row = {};
            columns.forEach((col, i) => {
              row[col] = values[i];
            });
            return row;
          });
        }
      }
    } else {
      // Regular write query (not RETURNING)
      while (stmt.step()) {}
      stmt.free();
    }

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    // Get last insert rowid for non-RETURNING queries
    const lastRowResult = db.exec('SELECT last_insert_rowid() as id');
    const lastId = lastRowResult.length > 0 ? lastRowResult[0].values[0][0] : null;

    return Promise.resolve({
      rows: returnRows,
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

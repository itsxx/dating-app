// 自动检测：如果有 DATABASE_URL 则使用 PostgreSQL，否则使用 SQLite
const usePostgreSQL = !!process.env.DATABASE_URL;

// SQL 语法转换函数
function convertSqliteToPostgres(sql) {
  return sql
    // datetime('now') -> NOW()
    .replace(/datetime\('now'\)/g, 'NOW()')
    // julianday() -> EXTRACT(EPOCH FROM ...)
    .replace(/julianday\(([^)]+)\)/g, 'EXTRACT(EPOCH FROM $1)')
    // INTEGER BOOLEAN -> BOOLEAN
    .replace(/INTEGER DEFAULT 0/g, 'BOOLEAN DEFAULT FALSE');
}

// PostgreSQL 转换查询参数 $1, $2 -> ?
function convertPostgresToSqlite(text) {
  return text.replace(/\$([0-9]+)/g, '?');
}

if (usePostgreSQL) {
  // PostgreSQL 模式（用于 Vercel 生产环境）
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  let initialized = false;

  async function initDatabase() {
    if (initialized) return;

    try {
      const client = await pool.connect();
      console.log('PostgreSQL database initialized');
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

    try {
      // 转换 SQLite 语法到 PostgreSQL
      const convertedText = convertSqliteToPostgres(text);
      const result = await pool.query(convertedText, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount
      };
    } catch (err) {
      console.error('Database query error:', err.message);
      throw err;
    }
  }

  module.exports = {
    initDatabase,
    getDb,
    query,
    isPostgreSQL: true
  };
} else {
  // SQLite 模式（用于本地开发）
  const initSqlJs = require('sql.js');
  const fs = require('fs');
  const path = require('path');

  const DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../dating_app.db');
  let db = null;

  async function initDatabase() {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    console.log('SQLite database initialized');

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

  function convertQuery(text) {
    return text.replace(/\$[0-9]+/g, '?');
  }

  function query(text, params = []) {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const convertedText = convertQuery(text);
    const stmt = db.prepare(convertedText);

    if (params && params.length > 0) {
      stmt.bind(params);
    }

    const isWriteQuery = /^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(text.trim());

    if (isWriteQuery) {
      const tableMatch = text.match(/(?:INTO|FROM)\s+["']?(\w+)["']?/i);
      const tableName = tableMatch ? tableMatch[1] : null;
      const isInsertReturning = text.toUpperCase().includes('INSERT') && text.toUpperCase().includes('RETURNING');

      let returnRows = [];
      if (isInsertReturning && tableName) {
        const idValueMatch = text.match(/VALUES\s*\(\s*(\?|[^,)]+)/i);

        while (stmt.step()) {}
        stmt.free();

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
        while (stmt.step()) {}
        stmt.free();
      }

      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);

      const lastRowResult = db.exec('SELECT last_insert_rowid() as id');
      const lastId = lastRowResult.length > 0 ? lastRowResult[0].values[0][0] : null;

      return Promise.resolve({
        rows: returnRows,
        lastID: lastId
      });
    }

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
    query,
    isPostgreSQL: false
  };
}

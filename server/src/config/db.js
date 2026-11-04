const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

let mysql = null;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  // mysql2 optional if running pure pg
}

const dialect = (process.env.DB_DIALECT || 'auto').toLowerCase();

// PostgreSQL Pool
const pgPool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'blacksite_armory',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2500,
});

// MySQL Pool (XAMPP defaults: port 3306, user 'root', password '')
let mysqlPool = null;
if (mysql) {
  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'blacksite_armory',
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : '',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    connectTimeout: 2500,
  });
}

let activeEngine = 'postgres'; // 'postgres' or 'mysql'

let dbStatus = {
  connected: false,
  engine: 'postgres',
  lastChecked: null,
  database: process.env.PGDATABASE || 'blacksite_armory',
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || '5432',
  version: null,
  error: null,
};

async function checkConnection() {
  dbStatus.lastChecked = new Date().toISOString();

  // 1. If explicitly set to mysql or auto-probing
  if (dialect === 'mysql' && mysqlPool) {
    return await probeMySQL();
  }

  // 2. Try PostgreSQL first
  if (dialect === 'postgres' || dialect === 'auto') {
    try {
      const res = await pgPool.query('SELECT current_database() AS db, version() AS ver, NOW() AS now');
      dbStatus.connected = true;
      dbStatus.engine = 'postgres';
      activeEngine = 'postgres';
      dbStatus.version = res.rows[0].ver;
      dbStatus.database = res.rows[0].db;
      dbStatus.host = process.env.PGHOST || 'localhost';
      dbStatus.port = process.env.PGPORT || '5432';
      dbStatus.error = null;
      return dbStatus;
    } catch (pgErr) {
      // If auto-probing, try MySQL (XAMPP) fallback
      if (dialect === 'auto' && mysqlPool) {
        try {
          return await probeMySQL();
        } catch (myErr) {
          // Both failed
          dbStatus.connected = false;
          dbStatus.error = `PostgreSQL: ${pgErr.message} | XAMPP MySQL: ${myErr.message}`;
          return dbStatus;
        }
      } else {
        dbStatus.connected = false;
        dbStatus.engine = 'postgres';
        dbStatus.error = pgErr.message || 'Unable to establish TCP connection with PostgreSQL server.';
        return dbStatus;
      }
    }
  }

  return dbStatus;
}

async function probeMySQL() {
  const [rows] = await mysqlPool.query('SELECT DATABASE() AS db, VERSION() AS ver, NOW() AS now');
  dbStatus.connected = true;
  dbStatus.engine = 'mysql (XAMPP)';
  activeEngine = 'mysql';
  dbStatus.version = rows[0]?.ver || 'MySQL / MariaDB';
  dbStatus.database = rows[0]?.db || 'blacksite_armory';
  dbStatus.host = process.env.MYSQL_HOST || 'localhost';
  dbStatus.port = process.env.MYSQL_PORT || '3306';
  dbStatus.error = null;
  return dbStatus;
}

// Convert PostgreSQL parameterized query ($1, $2, ...) to MySQL format (?)
function adaptQueryForMySQL(sql, params = []) {
  const newParams = [];
  let adaptedSql = sql
    // Map $1, $2 to ? and replicate parameter in newParams array
    .replace(/\$(\d+)/g, (match, num) => {
      const idx = parseInt(num, 10) - 1;
      newParams.push(params[idx] !== undefined ? params[idx] : null);
      return '?';
    })
    // Replace ILIKE with LIKE (MySQL LIKE is case-insensitive by default)
    .replace(/\bILIKE\b/gi, 'LIKE')
    // Remove Postgres table lock qualifiers e.g. "FOR UPDATE OF so" -> "FOR UPDATE"
    .replace(/FOR UPDATE OF \w+/gi, 'FOR UPDATE')
    // Replace ANY($1::int[]) with IN (?)
    .replace(/=\s*ANY\(\?::int\[\]\)/gi, 'IN (?)')
    // Convert boolean literals
    .replace(/\bTRUE\b/gi, '1')
    .replace(/\bFALSE\b/gi, '0');

  return { sql: adaptedSql, params: newParams };
}

async function query(text, params = []) {
  if (activeEngine === 'mysql' && mysqlPool) {
    const { sql: adaptedSql, params: adaptedParams } = adaptQueryForMySQL(text, params);
    const [rows, fields] = await mysqlPool.query(adaptedSql, adaptedParams);

    // Format output identical to pg response
    const isSelect = Array.isArray(rows);
    return {
      rows: isSelect ? rows : [],
      rowCount: isSelect ? rows.length : (rows.affectedRows || 0),
      insertId: rows.insertId,
      fields: fields ? fields.map(f => ({ name: f.name, dataTypeID: f.columnType })) : [],
    };
  } else {
    return await pgPool.query(text, params);
  }
}

async function getClient() {
  if (activeEngine === 'mysql' && mysqlPool) {
    const conn = await mysqlPool.getConnection();
    return {
      query: async (text, params = []) => {
        const { sql: adaptedSql, params: adaptedParams } = adaptQueryForMySQL(text, params);
        if (adaptedSql.trim().toUpperCase() === 'BEGIN') {
          await conn.beginTransaction();
          return { rows: [], rowCount: 0 };
        } else if (adaptedSql.trim().toUpperCase() === 'COMMIT') {
          await conn.commit();
          return { rows: [], rowCount: 0 };
        } else if (adaptedSql.trim().toUpperCase() === 'ROLLBACK') {
          await conn.rollback();
          return { rows: [], rowCount: 0 };
        }
        const [rows, fields] = await conn.query(adaptedSql, adaptedParams);
        const isSelect = Array.isArray(rows);
        return {
          rows: isSelect ? rows : [],
          rowCount: isSelect ? rows.length : (rows.affectedRows || 0),
          insertId: rows.insertId,
          fields: fields ? fields.map(f => ({ name: f.name, dataTypeID: f.columnType })) : [],
        };
      },
      release: () => conn.release(),
    };
  } else {
    return await pgPool.connect();
  }
}

// Initial probe
checkConnection().catch(() => {});

// Recheck periodically every 15 seconds
setInterval(() => {
  checkConnection().catch(() => {});
}, 15000);

module.exports = {
  pool: pgPool,
  mysqlPool,
  query,
  getClient,
  checkConnection,
  getDbStatus: () => ({ ...dbStatus }),
  getActiveEngine: () => activeEngine,
};

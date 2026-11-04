const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
};

const targetDatabase = process.env.PGDATABASE || 'blacksite_armory';
const sqlDir = path.join(__dirname, '../../../database');

async function createDatabaseIfNotExists() {
  console.log(`[BLACKSITE DB] Connecting to PostgreSQL maintenance database at ${config.host}:${config.port}...`);
  const client = new Client({ ...config, database: 'postgres' });
  try {
    await client.connect();
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDatabase]
    );
    if (checkDb.rowCount === 0) {
      console.log(`[BLACKSITE DB] Database "${targetDatabase}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`[BLACKSITE DB] Database "${targetDatabase}" created successfully.`);
    } else {
      console.log(`[BLACKSITE DB] Database "${targetDatabase}" exists.`);
    }
  } catch (err) {
    console.error(`[BLACKSITE DB] Error checking/creating database:`, err.message);
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

async function runSqlFiles() {
  const client = new Client({ ...config, database: targetDatabase });
  try {
    await client.connect();
    console.log(`[BLACKSITE DB] Connected to "${targetDatabase}". Executing setup pipeline...`);

    const files = [
      'schema.sql',
      'indexes.sql',
      'views.sql',
      'functions.sql',
      'procedures.sql',
      'triggers.sql',
      'seed.sql',
    ];

    for (const file of files) {
      const filePath = path.join(sqlDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`[BLACKSITE DB] Warning: File not found: ${filePath}`);
        continue;
      }
      console.log(`[BLACKSITE DB] -> Executing: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`[BLACKSITE DB] [OK] ${file} applied successfully.`);
    }

    // Verify row counts
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM players) AS players_count,
        (SELECT COUNT(*) FROM currencies) AS currencies_count,
        (SELECT COUNT(*) FROM wallets) AS wallets_count,
        (SELECT COUNT(*) FROM item_catalog) AS catalog_count,
        (SELECT COUNT(*) FROM inventories) AS inventory_count,
        (SELECT COUNT(*) FROM store_offers) AS offers_count,
        (SELECT COUNT(*) FROM market_listings) AS listings_count,
        (SELECT COUNT(*) FROM trades) AS trades_count,
        (SELECT COUNT(*) FROM audit_logs) AS audit_count;
    `);

    console.log('\n[BLACKSITE DB] ========================================');
    console.log('[BLACKSITE DB] DATABASE SETUP & SEED VERIFIED:');
    console.table(summary.rows[0]);
    console.log('[BLACKSITE DB] ========================================\n');
  } catch (err) {
    console.error(`[BLACKSITE DB] Execution failed:`, err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  try {
    await createDatabaseIfNotExists();
    await runSqlFiles();
  } catch (err) {
    console.error(`[BLACKSITE DB] Setup terminated with error.`);
    process.exit(1);
  }
}

main();

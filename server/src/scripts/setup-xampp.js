const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const host = process.env.MYSQL_HOST || 'localhost';
const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
const user = process.env.MYSQL_USER || 'root';
const password = process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : '';

const sqlDir = path.join(__dirname, '../../../database');

async function main() {
  console.log(`\n======================================================`);
  console.log(`[BLACKSITE XAMPP] Initializing XAMPP MySQL Setup`);
  console.log(`[BLACKSITE XAMPP] Target: ${user}@${host}:${port}`);
  console.log(`======================================================\n`);

  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });
    console.log('[BLACKSITE XAMPP] Link established with XAMPP MySQL daemon.');

    // 1. Execute Schema
    const schemaPath = path.join(sqlDir, 'xampp-mysql-schema.sql');
    console.log(`[BLACKSITE XAMPP] Applying Schema (${schemaPath})...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(schemaSql);
    console.log('[BLACKSITE XAMPP] [OK] Schema created successfully.');

    // 2. Execute Seed Data
    const seedPath = path.join(sqlDir, 'xampp-mysql-seed.sql');
    console.log(`[BLACKSITE XAMPP] Applying Seed Dataset (${seedPath})...`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await conn.query(seedSql);
    console.log('[BLACKSITE XAMPP] [OK] 128+ Seed Records Populated.');

    // 3. Verify Row Counts
    await conn.query('USE blacksite_armory;');
    const [counts] = await conn.query(`
      SELECT 
        (SELECT COUNT(*) FROM players) AS players,
        (SELECT COUNT(*) FROM currencies) AS currencies,
        (SELECT COUNT(*) FROM wallets) AS wallets,
        (SELECT COUNT(*) FROM item_catalog) AS catalog_items,
        (SELECT COUNT(*) FROM inventories) AS inventory_instances,
        (SELECT COUNT(*) FROM store_offers) AS store_offers,
        (SELECT COUNT(*) FROM market_listings) AS market_listings,
        (SELECT COUNT(*) FROM trades) AS trades,
        (SELECT COUNT(*) FROM wheel_rewards) AS wheel_rewards,
        (SELECT COUNT(*) FROM audit_logs) AS audit_logs;
    `);

    console.log('\n[BLACKSITE XAMPP] ========================================');
    console.log('[BLACKSITE XAMPP] XAMPP DATABASE SETUP & SEED VERIFIED:');
    console.table(counts[0]);
    console.log('[BLACKSITE XAMPP] ========================================\n');
    console.log('You can now open phpMyAdmin at http://localhost/phpmyadmin to inspect database `blacksite_armory`!');
  } catch (err) {
    console.error('\n[BLACKSITE XAMPP ERROR]:', err.message);
    console.log('\nPLEASE CHECK:');
    console.log('1. Did you open XAMPP Control Panel and click "Start" next to MySQL?');
    console.log('2. Is MySQL running on port 3306?');
    process.exit(1);
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

main();

const mysql = require('../../../server/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

// Helper to format query results as a clean ASCII table
function formatAsciiTable(rows) {
  if (!rows || rows.length === 0) {
    return '    +----------------------------------+\n    | (No rows returned / Empty set)   |\n    +----------------------------------+';
  }

  const columns = Object.keys(rows[0]);
  const colWidths = {};

  columns.forEach((col) => {
    colWidths[col] = col.length;
    rows.forEach((row) => {
      const val = row[col] === null ? 'NULL' : String(row[col]);
      if (val.length > colWidths[col]) {
        colWidths[col] = Math.min(val.length, 45); // cap width for readability
      }
    });
  });

  // Border line
  let border = '    +';
  columns.forEach((col) => {
    border += '-'.repeat(colWidths[col] + 2) + '+';
  });

  // Header line
  let header = '    |';
  columns.forEach((col) => {
    header += ' ' + col.padEnd(colWidths[col]) + ' |';
  });

  // Data rows
  const dataLines = rows.map((row) => {
    let line = '    |';
    columns.forEach((col) => {
      let val = row[col] === null ? 'NULL' : String(row[col]);
      if (val.length > 45) val = val.substring(0, 42) + '...';
      line += ' ' + val.padEnd(colWidths[col]) + ' |';
    });
    return line;
  });

  return [border, header, border, ...dataLines, border].join('\n');
}

async function main() {
  console.log('[RUNNER] Connecting to XAMPP MySQL...');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'blacksite_armory',
  });

  console.log('[RUNNER] Connected! Executing 20 test queries and capturing output...');

  // The 20 Queries Specification
  const queries = [
    {
      id: 1,
      title: 'Query 1: Simple SELECT with Filtering & Ordering (Basic Selection & Projection)',
      plainText:
        'Plain Text: Retrieve all registered tactical operators who have an "active" account status, displaying their player ID, username, email address, and registration timestamp, ordered alphabetically by username.',
      sql: `SELECT player_id, username, email, status, created_at
FROM players
WHERE status = 'active'
ORDER BY username ASC;`,
    },
    {
      id: 2,
      title: 'Query 2: Multi-Criteria Filtering with Logical Operators (AND, OR, NOT)',
      plainText:
        'Plain Text: Find all tactical item blueprints from the catalog that are either of "Mythic" or "Legendary" rarity AND have a base durability of at least 95, excluding items that are designated as non-tradable.',
      sql: `SELECT item_type_id, item_name, rarity, category, base_durability, is_tradable
FROM item_catalog
WHERE (rarity = 'Mythic' OR rarity = 'Legendary')
  AND base_durability >= 95
  AND is_tradable = 1
ORDER BY base_durability DESC, rarity ASC;`,
    },
    {
      id: 3,
      title: 'Query 3: Pattern Matching & Wildcards (LIKE with % and _)',
      plainText:
        'Plain Text: Retrieve all weapons and tactical equipment whose name starts with "Phantom" or contains the word "Viper" anywhere in the item name.',
      sql: `SELECT item_type_id, item_name, category, rarity, asset_key
FROM item_catalog
WHERE item_name LIKE 'Phantom%' OR item_name LIKE '%Viper%'
ORDER BY item_name ASC;`,
    },
    {
      id: 4,
      title: 'Query 4: Range Checking & Ordering (BETWEEN ... AND ...)',
      plainText:
        'Plain Text: Retrieve all physical inventory item instances whose current durability falls between 80% and 95% inclusive, displaying the instance ID, owner player ID, item type ID, and current durability, sorted from highest to lowest durability.',
      sql: `SELECT item_instance_id, player_id, item_type_id, durability, is_equipped, acquired_at
FROM inventories
WHERE durability BETWEEN 80 AND 95
ORDER BY durability DESC;`,
    },
    {
      id: 5,
      title: 'Query 5: Discrete Set Membership (IN and NOT IN)',
      plainText:
        'Plain Text: Find all Armory Store offers whose featured item belongs to defensive equipment categories ("Combat Helmet", "Tactical Vest", "Tactical Gear") and whose price is NOT denominated in currency #4 (Crypto-Scrip).',
      sql: `SELECT so.offer_id, c.item_name, c.category, c.rarity, so.price, so.currency_id, so.status
FROM store_offers so
JOIN item_catalog c ON so.item_type_id = c.item_type_id
WHERE c.category IN ('Combat Helmet', 'Tactical Vest', 'Tactical Gear')
  AND so.currency_id NOT IN (4)
ORDER BY so.price ASC;`,
    },
    {
      id: 6,
      title: 'Query 6: NULL Value Handling & Coalescing (IS NULL / COALESCE)',
      plainText:
        'Plain Text: List all bilateral trades in the system, showing trade ID, initiator ID, receiver ID, status, and the resolution timestamp, displaying "STILL_PENDING" if the trade has not yet been resolved.',
      sql: `SELECT trade_id, initiator_id, receiver_id, status, created_at,
       COALESCE(CAST(resolved_at AS CHAR), 'STILL_PENDING') AS resolution_status
FROM trades
ORDER BY trade_id ASC;`,
    },
    {
      id: 7,
      title: 'Query 7: Basic Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)',
      plainText:
        'Plain Text: Calculate system-wide summary metrics for all physical inventory items: total count of instantiated items, average durability, lowest durability, and peak durability across all player inventories.',
      sql: `SELECT 
    COUNT(*) AS total_inventory_items,
    ROUND(AVG(durability), 2) AS avg_fleet_durability,
    MIN(durability) AS lowest_durability,
    MAX(durability) AS peak_durability,
    SUM(CASE WHEN is_equipped = 1 THEN 1 ELSE 0 END) AS total_equipped_items
FROM inventories;`,
    },
    {
      id: 8,
      title: 'Query 8: Grouping Data with Single & Multiple Aggregates (GROUP BY)',
      plainText:
        'Plain Text: Group all catalog items by their equipment category and determine the number of blueprints in each category, along with the average base durability and the highest durability in that category.',
      sql: `SELECT 
    category,
    COUNT(*) AS total_blueprints,
    ROUND(AVG(base_durability), 1) AS avg_base_durability,
    MAX(base_durability) AS max_base_durability
FROM item_catalog
GROUP BY category
ORDER BY total_blueprints DESC, category ASC;`,
    },
    {
      id: 9,
      title: 'Query 9: Aggregated Filtering with Conditions on Groups (GROUP BY with HAVING)',
      plainText:
        'Plain Text: Find all item rarity tiers that have at least 2 distinct physical item instances instantiated in player inventories AND have an average durability strictly greater than 85%.',
      sql: `SELECT 
    c.rarity,
    COUNT(i.item_instance_id) AS total_instances,
    ROUND(AVG(i.durability), 2) AS avg_durability,
    MIN(i.durability) AS min_durability
FROM inventories i
JOIN item_catalog c ON i.item_type_id = c.item_type_id
GROUP BY c.rarity
HAVING COUNT(i.item_instance_id) >= 2 AND AVG(i.durability) > 85.00
ORDER BY total_instances DESC;`,
    },
    {
      id: 10,
      title: 'Query 10: Multi-Table Inner Join (3-Table INNER JOIN)',
      plainText:
        'Plain Text: Display a complete inspection of all currently equipped loadout items, joining players, physical inventories, and item blueprints to show the operator username, blueprint name, rarity, category, and instance durability.',
      sql: `SELECT 
    p.player_id,
    p.username AS operator_handle,
    c.item_name,
    c.rarity,
    c.category,
    i.durability AS current_durability,
    i.acquired_at
FROM inventories i
INNER JOIN players p ON i.player_id = p.player_id
INNER JOIN item_catalog c ON i.item_type_id = c.item_type_id
WHERE i.is_equipped = 1
ORDER BY p.player_id ASC, c.rarity DESC;`,
    },
    {
      id: 11,
      title: 'Query 11: Left Outer Join (LEFT JOIN with NULL Detection)',
      plainText:
        'Plain Text: Retrieve all registered operators and their active market listings, including operators who currently have zero active listings on the Black Market (showing NULL for listing columns).',
      sql: `SELECT 
    p.player_id,
    p.username,
    p.status AS account_status,
    ml.listing_id,
    ml.price AS asking_price,
    ml.status AS listing_status
FROM players p
LEFT JOIN market_listings ml ON p.player_id = ml.seller_id AND ml.status = 'active'
ORDER BY p.player_id ASC;`,
    },
    {
      id: 12,
      title: 'Query 12: Right Outer Join (RIGHT JOIN)',
      plainText:
        'Plain Text: Show all item blueprint types defined in the catalog and any store offers currently offering that item type, ensuring blueprint archetypes that are not featured in the store are still preserved.',
      sql: `SELECT 
    so.offer_id,
    c.item_type_id,
    c.item_name,
    c.category,
    c.rarity,
    so.price,
    so.status AS offer_status
FROM store_offers so
RIGHT JOIN item_catalog c ON so.item_type_id = c.item_type_id
ORDER BY c.item_type_id ASC
LIMIT 12;`,
    },
    {
      id: 13,
      title: 'Query 13: Self Join (Comparing Records Within the Same Table)',
      plainText:
        'Plain Text: Compare active market listings selling the same currency denomination to identify price spreads where Listing A is priced lower than Listing B.',
      sql: `SELECT 
    m1.listing_id AS listing_cheaper_id,
    m1.seller_id AS seller_a,
    m1.price AS cheaper_price,
    m2.listing_id AS listing_expensive_id,
    m2.seller_id AS seller_b,
    m2.price AS expensive_price,
    (m2.price - m1.price) AS price_difference,
    m1.currency_id
FROM market_listings m1
JOIN market_listings m2 ON m1.currency_id = m2.currency_id 
  AND m1.price < m2.price 
  AND m1.status = 'active' 
  AND m2.status = 'active'
ORDER BY price_difference DESC
LIMIT 5;`,
    },
    {
      id: 14,
      title: 'Query 14: Scalar Subquery in WHERE Clause',
      plainText:
        'Plain Text: Retrieve all physical inventory item instances whose current durability is strictly greater than the overall average durability of all inventory items in the system.',
      sql: `SELECT 
    i.item_instance_id,
    i.player_id,
    c.item_name,
    c.rarity,
    i.durability,
    ROUND((SELECT AVG(durability) FROM inventories), 2) AS system_avg_durability
FROM inventories i
JOIN item_catalog c ON i.item_type_id = c.item_type_id
WHERE i.durability > (SELECT AVG(durability) FROM inventories)
ORDER BY i.durability DESC;`,
    },
    {
      id: 15,
      title: 'Query 15: Correlated Subquery with Outer Query Reference',
      plainText:
        'Plain Text: Retrieve all operators who possess a Combat Credits (currency #1) wallet balance that is greater than the average Combat Credits balance across all operators in the database.',
      sql: `SELECT 
    p.player_id,
    p.username,
    w.balance AS combat_credits_balance,
    (SELECT ROUND(AVG(w_sub.balance), 2) FROM wallets w_sub WHERE w_sub.currency_id = 1) AS avg_credits_all_players
FROM players p
JOIN wallets w ON p.player_id = w.player_id
WHERE w.currency_id = 1
  AND w.balance > (
      SELECT AVG(w2.balance) 
      FROM wallets w2 
      WHERE w2.currency_id = 1
  )
ORDER BY w.balance DESC;`,
    },
    {
      id: 16,
      title: 'Query 16: Existence Testing Subquery (EXISTS and NOT EXISTS)',
      plainText:
        'Plain Text: Identify all operators who have NEVER created a market listing on the Black Market, using the NOT EXISTS clause.',
      sql: `SELECT p.player_id, p.username, p.email, p.status
FROM players p
WHERE NOT EXISTS (
    SELECT 1 
    FROM market_listings ml 
    WHERE ml.seller_id = p.player_id
)
ORDER BY p.player_id ASC;`,
    },
    {
      id: 17,
      title: 'Query 17: Multi-Row Subquery with ANY / ALL Operators',
      plainText:
        'Plain Text: Find all store offers priced in Combat Credits (currency #1) whose price is cheaper than ANY active marketplace listing denominated in Combat Credits.',
      sql: `SELECT 
    so.offer_id,
    c.item_name,
    c.rarity,
    so.price AS store_price,
    so.stock_limit - so.stock_sold AS stock_left
FROM store_offers so
JOIN item_catalog c ON so.item_type_id = c.item_type_id
WHERE so.currency_id = 1 
  AND so.price < ANY (
      SELECT ml.price 
      FROM market_listings ml 
      WHERE ml.currency_id = 1 AND ml.status = 'active'
  )
ORDER BY so.price ASC;`,
    },
    {
      id: 18,
      title: 'Query 18: Set Operations (UNION and UNION ALL)',
      plainText:
        'Plain Text: Construct a consolidated operational log of all economic touchpoints in the system by taking the UNION of all sellers on the Black Market and all initiators of bilateral trades.',
      sql: `SELECT seller_id AS operator_id, 'MARKET_SELLER' AS activity_role, created_at AS event_timestamp
FROM market_listings
UNION
SELECT initiator_id AS operator_id, 'TRADE_INITIATOR' AS activity_role, created_at AS event_timestamp
FROM trades
ORDER BY event_timestamp DESC
LIMIT 8;`,
    },
    {
      id: 19,
      title: 'Query 19: Advanced Analytical Query with CASE Expressions & Scarcity Calculations',
      plainText:
        'Plain Text: Inspect the real-time status of all rewards on the Luck Royale wheel, evaluating their remaining supply and classifying each drop into a scarcity classification ("EXCLUSIVE SCARCE DROP", "SOLD OUT", or "UNLIMITED POOL"), and calculating their effective drop percentage.',
      sql: `SELECT 
    wr.reward_id,
    c.item_name,
    c.rarity,
    CONCAT(ROUND(wr.base_probability * 100, 2), '%') AS base_chance,
    wr.max_supply,
    wr.awarded_count,
    CASE 
        WHEN wr.max_supply IS NOT NULL AND wr.awarded_count >= wr.max_supply THEN 'SOLD OUT'
        WHEN wr.max_supply IS NOT NULL THEN CONCAT('LIMITED SUPPLY: ', (wr.max_supply - wr.awarded_count), ' LEFT')
        ELSE 'UNLIMITED POOL'
    END AS scarcity_status,
    CASE 
        WHEN wr.is_active = 1 THEN 'ACTIVE ON WHEEL'
        ELSE 'DISABLED'
    END AS operational_state
FROM wheel_rewards wr
JOIN item_catalog c ON wr.item_type_id = c.item_type_id
ORDER BY wr.display_order ASC;`,
    },
    {
      id: 20,
      title: 'Query 20: Complex Data Modification & Conditional Maintenance (DML UPDATE with Subquery)',
      plainText:
        'Plain Text: Perform armor and equipment maintenance by boosting the durability of all equipped weapons and tactical armor by +5 points (capped at 100%) for operators who have an "active" status, followed by verification.',
      sql: `-- Subquery-driven condition & mathematical expression:
UPDATE inventories
SET durability = LEAST(100, durability + 5)
WHERE is_equipped = 1
  AND player_id IN (SELECT player_id FROM players WHERE status = 'active');

-- Verification Query to display results of updated loadouts:
SELECT 
    i.item_instance_id,
    p.username,
    c.item_name,
    c.category,
    i.durability AS updated_durability,
    i.is_equipped
FROM inventories i
JOIN players p ON i.player_id = p.player_id
JOIN item_catalog c ON i.item_type_id = c.item_type_id
WHERE i.is_equipped = 1
ORDER BY i.item_instance_id ASC
LIMIT 6;`,
    },
  ];

  const results = [];

  for (const q of queries) {
    console.log(`Executing ${q.title}...`);
    try {
      // Split if multiple statements (like in Query 20)
      const statements = q.sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      let lastRows = null;
      for (const stmt of statements) {
        const [rows] = await conn.query(stmt);
        lastRows = rows;
      }

      const asciiOutput = formatAsciiTable(lastRows);
      results.push({
        ...q,
        output: asciiOutput,
      });
      console.log(`[OK] ${q.title} returned ${Array.isArray(lastRows) ? lastRows.length : 'OK'} rows`);
    } catch (err) {
      console.error(`[ERR] ${q.title} failed:`, err.message);
      results.push({
        ...q,
        output: `    ERROR: ${err.message}`,
      });
    }
  }

  await conn.end();

  // Read full DDL schema from xampp-mysql-schema.sql
  const ddlPath = path.resolve(__dirname, '../../../database/xampp-mysql-schema.sql');
  const ddlContent = fs.readFileSync(ddlPath, 'utf8');

  // Build the unified SQL file
  let finalSql = `-- ============================================================================
-- BLACKSITE // OPERATOR ARMORY
-- ACADEMIC DBMS PROJECT SUBMISSION SCRIPT
-- ============================================================================
-- Course: Database Management Systems (DBMS)
-- Project: 3D Tactical Game Inventory, P2P Marketplace & Scarcity Economy System
-- Target Database: MySQL 8.0+ / MariaDB 10.4+ (XAMPP Environment)
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
--
-- This file contains:
--   PART 1: Complete DDL Script (Tables, Keys, Constraints, Views)
--   PART 2: Total 20 SQL Queries of All Types
--           (Each query includes Plain Text description, SQL, and Executed Output)
-- ============================================================================


-- ============================================================================
-- PART 1: DDL SCRIPT (DATA DEFINITION LANGUAGE)
-- ============================================================================
-- The following DDL statements define the complete database structure for
-- BLACKSITE // OPERATOR ARMORY, comprising 14 normalized tables and views.
-- ============================================================================

${ddlContent.trim()}


-- ============================================================================
-- PART 2: TOTAL 20 SQL QUERIES OF ALL TYPES
-- ============================================================================
-- Below are 20 queries covering the full spectrum of relational database
-- querying techniques required for DBMS academic evaluation:
--
--   1. Simple Selection & Projection (WHERE, ORDER BY)
--   2. Logical Operators (AND, OR, NOT)
--   3. Pattern Matching (LIKE with % and _)
--   4. Range Searching (BETWEEN ... AND ...)
--   5. Set Membership (IN, NOT IN)
--   6. NULL Value Handling (IS NULL, COALESCE)
--   7. Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)
--   8. Grouping with Aggregates (GROUP BY)
--   9. Group Filtering (GROUP BY with HAVING)
--  10. Multi-Table Inner Join (3-Table INNER JOIN)
--  11. Left Outer Join (LEFT OUTER JOIN with NULL detection)
--  12. Right Outer Join (RIGHT OUTER JOIN)
--  13. Self Join (Comparing rows in the same table)
--  14. Scalar Subquery in WHERE Clause
--  15. Correlated Subquery
--  16. Existence Testing (NOT EXISTS)
--  17. Multi-Row Subquery with ANY Operator
--  18. Set Operations (UNION of distinct activity touchpoints)
--  19. Advanced Analytical Query with CASE & Scarcity Calculations
--  20. Data Modification with Subquery & Mathematical Constraints (DML UPDATE)
-- ============================================================================

`;

  results.forEach((q) => {
    finalSql += `
-- ============================================================================
-- ${q.title}
-- ============================================================================
-- ${q.plainText}
--
-- [SQL QUERY]:
${q.sql}

-- [EXECUTED QUERY OUTPUT]:
/*
${q.output}
*/

`;
  });

  // Save to database/DDL_AND_20_SQL_QUERIES.sql
  const outPath1 = path.resolve(__dirname, '../../../database/DDL_AND_20_SQL_QUERIES.sql');
  fs.writeFileSync(outPath1, finalSql, 'utf8');
  console.log(`[SUCCESS] Generated: ${outPath1} (${finalSql.length} bytes)`);

  // Also save a copy directly in root folder so user sees it right away
  const outPath2 = path.resolve(__dirname, '../../../DDL_AND_20_SQL_QUERIES.sql');
  fs.writeFileSync(outPath2, finalSql, 'utf8');
  console.log(`[SUCCESS] Generated: ${outPath2} (${finalSql.length} bytes)`);
}

main().catch(console.error);

const { query, getClient } = require('../config/db');

// Approved Academic Query Registry
const LAB_CATEGORIES = [
  {
    id: 'ddl',
    name: '1. DDL (Data Definition Language)',
    description: 'Schema architecture statements: CREATE, ALTER, DROP, TRUNCATE, and RENAME.',
    queries: [
      {
        id: 'ddl-create-verify',
        title: 'Inspect Primary Key & Referential Constraints',
        description: 'Examines PostgreSQL information_schema to verify table constraints and foreign key linkages.',
        sql: `SELECT 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name IN ('inventories', 'market_listings', 'trades')
ORDER BY tc.table_name, tc.constraint_type;`,
        executable: true,
      },
      {
        id: 'ddl-syntax-demo',
        title: 'Documented DDL: CREATE, ALTER, RENAME, TRUNCATE, DROP',
        description: 'Reference lifecycle statements implemented in database/dbms-lab.sql for weapon attachment tables.',
        sql: `-- 1. CREATE TABLE with Domain and Check Constraints
CREATE TABLE weapon_attachments (
    attachment_id SERIAL PRIMARY KEY,
    attachment_name VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(30) CHECK (category IN ('Optic', 'Muzzle', 'Underbarrel', 'Laser')),
    zoom_level NUMERIC(3, 1) DEFAULT 1.0 CHECK (zoom_level >= 1.0)
);

-- 2. ALTER TABLE: Add column & enforce NOT NULL
ALTER TABLE weapon_attachments ADD COLUMN weight_grams INT DEFAULT 250;
ALTER TABLE weapon_attachments ALTER COLUMN weight_grams SET NOT NULL;

-- 3. RENAME COLUMN
ALTER TABLE weapon_attachments RENAME COLUMN weight_grams TO mass_grams;

-- 4. TRUNCATE TABLE
TRUNCATE TABLE weapon_attachments;

-- 5. DROP TABLE
DROP TABLE IF EXISTS weapon_attachments;`,
        executable: false,
        note: 'Documented demonstration. Destructive live execution restricted to prevent accidental schema drop.',
      }
    ]
  },
  {
    id: 'dml',
    name: '2. DML (Data Manipulation Language)',
    description: 'Data modification operations: INSERT, UPDATE, and DELETE with cascading effects.',
    queries: [
      {
        id: 'dml-insert-audit',
        title: 'INSERT with RETURNING Clause',
        description: 'Appends a tactical telemetry log and retrieves the auto-generated surrogate key and timestamp.',
        sql: `INSERT INTO audit_logs (player_id, action_type, details)
VALUES (1, 'LAB_VERIFY_EXEC', 'Academic DBMS DML demonstration executed.')
RETURNING log_id, player_id, action_type, details, created_at;`,
        executable: true,
      },
      {
        id: 'dml-update-durability',
        title: 'UPDATE with Controlled Conditional Bounds',
        description: 'Restores durability for damaged gear without exceeding the 100% check constraint.',
        sql: `UPDATE inventories 
SET durability = LEAST(100, durability + 1)
WHERE player_id = 1 AND durability < 100
RETURNING item_instance_id, player_id, durability, is_equipped;`,
        executable: true,
      },
      {
        id: 'dml-cascade-analysis',
        title: 'Foreign Key Cascade Analysis',
        description: 'Demonstrates cascading deletion rules defined on child relations (wallets, inventories, trade_items).',
        sql: `SELECT 
    conrelid::regclass AS child_table,
    confrelid::regclass AS parent_table,
    conname AS constraint_name,
    CASE confdeltype
        WHEN 'c' THEN 'CASCADE (Deletes child rows)'
        WHEN 'r' THEN 'RESTRICT (Blocks parent deletion)'
        WHEN 'n' THEN 'SET NULL'
        ELSE confdeltype::text
    END AS delete_rule
FROM pg_constraint
WHERE confrelid IN ('players'::regclass, 'item_catalog'::regclass, 'trades'::regclass)
ORDER BY parent_table, child_table;`,
        executable: true,
      }
    ]
  },
  {
    id: 'dcl',
    name: '3. DCL (Data Control Language)',
    description: 'Privilege delegation and security administration: GRANT and REVOKE.',
    queries: [
      {
        id: 'dcl-grant-revoke',
        title: 'Role-Based Access Control Architecture',
        description: 'Inspects active PostgreSQL database roles and their granted table privileges.',
        sql: `SELECT 
    grantee, 
    table_schema, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'audit_logs'
LIMIT 10;`,
        executable: true,
      },
      {
        id: 'dcl-syntax-doc',
        title: 'Documented DCL: Role Provisioning & Revocation',
        description: 'Standard DBA scripts for creating auditor role and applying principle of least privilege.',
        sql: `-- 1. Provision Auditor Role
CREATE ROLE armory_analyst WITH LOGIN PASSWORD 'secure_token';

-- 2. Grant Connection and Read-Only Privileges
GRANT CONNECT ON DATABASE blacksite_armory TO armory_analyst;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO armory_analyst;

-- 3. Revoke Access to Sensitive Financial Records
REVOKE SELECT ON wallets FROM armory_analyst;`,
        executable: false,
        note: 'Requires superuser execution outside standard web context.',
      }
    ]
  },
  {
    id: 'tcl',
    name: '4. TCL (Transaction Control Language)',
    description: 'Transaction consistency and isolation: BEGIN, COMMIT, SAVEPOINT, and ROLLBACK.',
    queries: [
      {
        id: 'tcl-active-locks',
        title: 'Inspect Current Active Locks & Concurrency',
        description: 'Queries pg_locks and pg_stat_activity to demonstrate multi-version concurrency control (MVCC).',
        sql: `SELECT 
    l.locktype, 
    l.relation::regclass AS relation_name, 
    l.mode, 
    l.granted, 
    a.query, 
    a.state 
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE a.datname = current_database() AND a.pid <> pg_backend_pid()
LIMIT 10;`,
        executable: true,
      },
      {
        id: 'tcl-savepoint-doc',
        title: 'Documented TCL: Savepoint & Partial Rollback',
        description: 'Atomic credit allocation rolled back upon constraint violation.',
        sql: `BEGIN;
-- Step 1: Credit bonus
UPDATE wallets SET balance = balance + 500 WHERE player_id = 1 AND currency_id = 1;

-- Step 2: Set recovery milestone
SAVEPOINT bonus_allocated;

-- Step 3: Attempt overdraw
UPDATE wallets SET balance = balance - 999999 WHERE player_id = 1 AND currency_id = 1;

-- Step 4: Revert faulty overdraw while retaining milestone
ROLLBACK TO SAVEPOINT bonus_allocated;

-- Step 5: Finalize
COMMIT;`,
        executable: false,
      }
    ]
  },
  {
    id: 'dql-aggregates',
    name: '5. DQL: SELECT with WHERE & Aggregates',
    description: 'Data query language with conditional filtering, COUNT, SUM, AVG, MIN, and MAX.',
    queries: [
      {
        id: 'dql-fleet-aggregates',
        title: 'Fleet-wide Durability & Inventory Statistics',
        description: 'Calculates total instances, mean durability, minimum and maximum wear across armory assets.',
        sql: `SELECT 
    COUNT(i.item_instance_id) AS total_armory_items,
    ROUND(AVG(i.durability), 2) AS mean_durability_pct,
    MIN(i.durability) AS lowest_durability,
    MAX(i.durability) AS peak_durability,
    COUNT(CASE WHEN i.is_equipped THEN 1 END) AS active_equipped_items
FROM inventories i;`,
        executable: true,
      },
      {
        id: 'dql-where-filtering',
        title: 'Filtering Catalog by Tradability & Base Durability',
        description: 'Retrieves all tradable blueprints with base durability of at least 90%.',
        sql: `SELECT 
    item_type_id,
    item_name,
    rarity,
    category,
    base_durability
FROM item_catalog
WHERE is_tradable = TRUE AND base_durability >= 90
ORDER BY base_durability DESC, item_name ASC;`,
        executable: true,
      }
    ]
  },
  {
    id: 'dql-clauses',
    name: '6. IN, LIKE, DISTINCT, ORDER BY, LIMIT & OFFSET',
    description: 'Advanced pattern matching, deduplication, sorting, and pagination.',
    queries: [
      {
        id: 'dql-in-like-distinct',
        title: 'DISTINCT with LIKE Pattern & IN Tuple Filtering',
        description: 'Finds distinct gear categories matching tactical keywords or specific gear archetypes.',
        sql: `SELECT DISTINCT 
    category, 
    rarity, 
    item_name 
FROM item_catalog 
WHERE (item_name ILIKE '%Spectre%' OR item_name ILIKE '%Vector%' OR item_name ILIKE '%Circuit%')
   OR category IN ('Combat Helmet', 'Tactical Vest')
ORDER BY rarity DESC, item_name ASC;`,
        executable: true,
      },
      {
        id: 'dql-pagination',
        title: 'Deterministic Pagination (ORDER BY, LIMIT, OFFSET)',
        description: 'Simulates paginated armory catalog browsing (Page 2: 5 items).',
        sql: `SELECT 
    item_type_id,
    item_name,
    rarity,
    category,
    base_durability
FROM item_catalog
ORDER BY item_type_id ASC
LIMIT 5 OFFSET 5;`,
        executable: true,
      }
    ]
  },
  {
    id: 'groupby-having',
    name: '7. GROUP BY & HAVING Clauses',
    description: 'Aggregating grouped tuples and applying post-aggregation thresholds.',
    queries: [
      {
        id: 'group-rarity-breakdown',
        title: 'Armory Inventory Grouped by Rarity with HAVING Threshold',
        description: 'Groups owned instances by catalog rarity and filters groups with at least 3 items.',
        sql: `SELECT 
    c.rarity,
    COUNT(i.item_instance_id) AS total_items,
    ROUND(AVG(i.durability), 1) AS avg_durability,
    MIN(i.durability) AS min_durability,
    MAX(i.durability) AS max_durability
FROM inventories i
JOIN item_catalog c ON i.item_type_id = c.item_type_id
GROUP BY c.rarity
HAVING COUNT(i.item_instance_id) >= 2
ORDER BY total_items DESC;`,
        executable: true,
      },
      {
        id: 'group-wallet-distribution',
        title: 'Player Wealth Distribution by Currency',
        description: 'Groups wallet records by currency type and identifies high-value accounts.',
        sql: `SELECT 
    cur.currency_name,
    cur.symbol,
    cur.is_premium,
    COUNT(w.wallet_id) AS total_accounts,
    ROUND(AVG(w.balance), 2) AS average_balance,
    MAX(w.balance) AS peak_balance
FROM wallets w
JOIN currencies cur ON w.currency_id = cur.currency_id
GROUP BY cur.currency_name, cur.symbol, cur.is_premium
ORDER BY average_balance DESC;`,
        executable: true,
      }
    ]
  },
  {
    id: 'joins',
    name: '8. JOIN Operations (All 6 Types)',
    description: 'Demonstrations of INNER, LEFT, RIGHT, FULL OUTER, CROSS, and SELF JOIN.',
    queries: [
      {
        id: 'join-inner',
        title: 'INNER JOIN: Item Instances, Owners & Catalog',
        description: 'Combines only matching tuples across player ownership and item definitions.',
        sql: `SELECT 
    i.item_instance_id,
    p.username AS operator_callsign,
    c.item_name,
    c.rarity,
    c.category,
    i.durability
FROM inventories i
INNER JOIN players p ON i.player_id = p.player_id
INNER JOIN item_catalog c ON i.item_type_id = c.item_type_id
ORDER BY i.item_instance_id ASC
LIMIT 8;`,
        executable: true,
      },
      {
        id: 'join-left',
        title: 'LEFT OUTER JOIN: All Players & Active Listings',
        description: 'Includes every registered operator, showing NULL for players with no active marketplace listings.',
        sql: `SELECT 
    p.player_id,
    p.username,
    p.status AS account_status,
    ml.listing_id,
    ml.price,
    ml.status AS listing_status
FROM players p
LEFT OUTER JOIN market_listings ml ON p.player_id = ml.seller_id AND ml.status = 'active'
ORDER BY p.player_id ASC;`,
        executable: true,
      },
      {
        id: 'join-right',
        title: 'RIGHT OUTER JOIN: Store Catalog Demand Mapping',
        description: 'Ensures all catalog blueprints are queried against existing store offers.',
        sql: `SELECT 
    c.item_type_id,
    c.item_name,
    c.rarity,
    so.offer_id,
    so.price,
    so.stock_sold,
    so.stock_limit
FROM store_offers so
RIGHT OUTER JOIN item_catalog c ON so.item_type_id = c.item_type_id
ORDER BY so.offer_id NULLS LAST
LIMIT 10;`,
        executable: true,
      },
      {
        id: 'join-full',
        title: 'FULL OUTER JOIN: Players & Bilateral Trades',
        description: 'Preserves unmatched tuples from both players and trade records.',
        sql: `SELECT 
    p.username,
    t.trade_id,
    t.status AS trade_status,
    t.created_at
FROM players p
FULL OUTER JOIN trades t ON p.player_id = t.initiator_id OR p.player_id = t.receiver_id
ORDER BY t.trade_id NULLS LAST
LIMIT 10;`,
        executable: true,
      },
      {
        id: 'join-cross',
        title: 'CROSS JOIN: Cartesian Matrix (Operators x Currencies)',
        description: 'Generates Cartesian product pairing elite operators against all available currency denominations.',
        sql: `SELECT 
    p.username,
    cur.currency_name,
    cur.symbol,
    cur.is_premium
FROM (SELECT username, player_id FROM players WHERE player_id <= 3) p
CROSS JOIN currencies cur
ORDER BY p.player_id, cur.currency_id;`,
        executable: true,
      },
      {
        id: 'join-self',
        title: 'SELF JOIN: Comparing Price Variances on the Same Item Type',
        description: 'Joins market_listings against itself to contrast asking prices between different sellers for identical blueprints.',
        sql: `SELECT 
    m1.listing_id AS listing_a,
    p1.username AS seller_a,
    m1.price AS price_a,
    m2.listing_id AS listing_b,
    p2.username AS seller_b,
    m2.price AS price_b,
    c.item_name,
    (m2.price - m1.price) AS price_delta
FROM market_listings m1
JOIN market_listings m2 ON m1.currency_id = m2.currency_id AND m1.listing_id < m2.listing_id
JOIN inventories i1 ON m1.item_instance_id = i1.item_instance_id
JOIN inventories i2 ON m2.item_instance_id = i2.item_instance_id
JOIN item_catalog c ON i1.item_type_id = c.item_type_id AND i2.item_type_id = c.item_type_id
JOIN players p1 ON m1.seller_id = p1.player_id
JOIN players p2 ON m2.seller_id = p2.player_id;`,
        executable: true,
      }
    ]
  },
  {
    id: 'set-ops',
    name: '9. Set Operations (UNION, INTERSECT, EXCEPT)',
    description: 'Relational algebra set operations demonstrating tuple combinations, commonalities, and differences.',
    queries: [
      {
        id: 'set-union',
        title: 'UNION: Distinct Players Engaged in Commerce or Trading',
        description: 'Combines sellers from marketplace and initiators from trades with deduplication.',
        sql: `SELECT seller_id AS operator_id, p.username, 'MARKET_SELLER' AS engagement_type
FROM market_listings ml
JOIN players p ON ml.seller_id = p.player_id
UNION
SELECT initiator_id AS operator_id, p.username, 'TRADE_INITIATOR' AS engagement_type
FROM trades t
JOIN players p ON t.initiator_id = p.player_id
ORDER BY operator_id;`,
        executable: true,
      },
      {
        id: 'set-union-all',
        title: 'UNION ALL: Complete Economic Touchpoints (Preserves Multiplicities)',
        description: 'Aggregates all market listings and trades without removing duplicates to reflect transaction density.',
        sql: `SELECT seller_id AS operator_id, 'MARKET_LISTING' AS event_source FROM market_listings
UNION ALL
SELECT initiator_id AS operator_id, 'TRADE_PROPOSAL' AS event_source FROM trades
ORDER BY operator_id;`,
        executable: true,
      },
      {
        id: 'set-intersect',
        title: 'INTERSECT: Players Active in Both Marketplace and Bilateral Trades',
        description: 'Computes set intersection of players who have both listed items for sale and proposed trades.',
        sql: `SELECT seller_id AS active_dual_operator_id FROM market_listings
INTERSECT
SELECT initiator_id FROM trades;`,
        executable: true,
      },
      {
        id: 'set-except',
        title: 'EXCEPT: Operators Who Have Listed Items But Never Initiated a Trade',
        description: 'Computes set difference (Market Sellers - Trade Initiators).',
        sql: `SELECT seller_id AS market_only_seller_id FROM market_listings
EXCEPT
SELECT initiator_id FROM trades;`,
        executable: true,
      }
    ]
  },
  {
    id: 'subqueries',
    name: '10. Subqueries (Scalar, Correlated, ANY/ALL)',
    description: 'Nested SQL queries demonstrating scalar subqueries, correlated lookups, and quantifier predicates.',
    queries: [
      {
        id: 'subquery-scalar',
        title: 'Scalar Subquery: Items with Above-Average Durability',
        description: 'Compares individual item durability against fleet-wide scalar mean.',
        sql: `SELECT 
    i.item_instance_id,
    c.item_name,
    c.rarity,
    i.durability,
    ROUND((SELECT AVG(durability) FROM inventories), 2) AS fleet_average
FROM inventories i
JOIN item_catalog c ON i.item_type_id = c.item_type_id
WHERE i.durability > (SELECT AVG(durability) FROM inventories)
ORDER BY i.durability DESC;`,
        executable: true,
      },
      {
        id: 'subquery-correlated',
        title: 'Correlated Subquery: High-Wealth Operators Exceeding Group Mean',
        description: 'Correlated subquery executing per-currency mean comparison for each player wallet.',
        sql: `SELECT 
    p.username,
    cur.currency_name,
    w.balance
FROM players p
JOIN wallets w ON p.player_id = w.player_id
JOIN currencies cur ON w.currency_id = cur.currency_id
WHERE w.balance > (
    SELECT AVG(w2.balance)
    FROM wallets w2
    WHERE w2.currency_id = w.currency_id
)
ORDER BY cur.currency_name, w.balance DESC;`,
        executable: true,
      },
      {
        id: 'subquery-any',
        title: 'ANY Subquery: Store Offers Priced Cheaper than Any Market Listing',
        description: 'Evaluates quantifier predicate WHERE price < ANY (SELECT price FROM market_listings).',
        sql: `SELECT 
    so.offer_id,
    c.item_name,
    so.price AS depot_price,
    cur.symbol AS currency
FROM store_offers so
JOIN item_catalog c ON so.item_type_id = c.item_type_id
JOIN currencies cur ON so.currency_id = cur.currency_id
WHERE so.currency_id = 1 
  AND so.price < ANY (
      SELECT price FROM market_listings WHERE currency_id = 1 AND status = 'active'
  );`,
        executable: true,
      },
      {
        id: 'subquery-all',
        title: 'ALL Subquery: Offers Priced Higher than All Inactive or Low-Cost Listings',
        description: 'Evaluates quantifier predicate WHERE price > ALL (...).',
        sql: `SELECT 
    so.offer_id,
    c.item_name,
    so.price,
    cur.symbol
FROM store_offers so
JOIN item_catalog c ON so.item_type_id = c.item_type_id
JOIN currencies cur ON so.currency_id = cur.currency_id
WHERE so.currency_id = 1 
  AND so.price > ALL (
      SELECT price FROM market_listings WHERE currency_id = 1 AND price < 5000
  );`,
        executable: true,
      }
    ]
  },
  {
    id: 'views',
    name: '11. Views & Materialized Views',
    description: 'Relational abstractions and precomputed materialized views with refresh mechanics.',
    queries: [
      {
        id: 'view-inventory',
        title: 'Query View: v_player_inventory_details',
        description: 'Queries abstraction layer joining instances, catalog specifications, and trade/listing statuses.',
        sql: `SELECT 
    item_instance_id,
    owner_username,
    item_name,
    rarity,
    category,
    durability,
    is_equipped,
    availability_status,
    listing_price
FROM v_player_inventory_details
WHERE player_id = 1
ORDER BY is_equipped DESC;`,
        executable: true,
      },
      {
        id: 'view-materialized-summary',
        title: 'Query Materialized View: mv_market_economy_summary',
        description: 'Reads cached physical table computing aggregate pricing trends and listing density.',
        sql: `SELECT 
    rarity,
    category,
    total_listings,
    total_sold,
    avg_listing_price,
    min_price,
    max_price,
    snapshot_time
FROM mv_market_economy_summary
ORDER BY total_listings DESC;`,
        executable: true,
      },
      {
        id: 'view-refresh-materialized',
        title: 'Refresh Materialized View (Live Execution)',
        description: 'Executes REFRESH MATERIALIZED VIEW to synchronize the physical snapshot with latest mutations.',
        sql: `REFRESH MATERIALIZED VIEW mv_market_economy_summary;
SELECT 'Materialized view synchronized successfully.' AS status, CURRENT_TIMESTAMP AS refreshed_at;`,
        executable: true,
      }
    ]
  },
  {
    id: 'procs-triggers',
    name: '12. Stored Procedures, Functions & Triggers',
    description: 'Procedural SQL (PL/pgSQL), automated trigger audits, and encapsulated business routines.',
    queries: [
      {
        id: 'func-eligibility',
        title: 'Execute Stored Function: fn_check_item_eligibility',
        description: 'Tests PL/pgSQL function validating item durability, tradability, and market availability.',
        sql: `SELECT 
    i.item_instance_id,
    c.item_name,
    c.is_tradable,
    i.durability,
    fn_check_item_eligibility(i.item_instance_id) AS is_eligible_for_trading_or_market
FROM inventories i
JOIN item_catalog c ON i.item_type_id = c.item_type_id
WHERE i.player_id = 1
ORDER BY i.item_instance_id ASC;`,
        executable: true,
      },
      {
        id: 'trigger-audit-verify',
        title: 'Verify Trigger Automated Execution in Audit Trail',
        description: 'Examines audit_logs rows generated automatically by database triggers on wallet or inventory events.',
        sql: `SELECT 
    log_id,
    player_id,
    action_type,
    details,
    created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 8;`,
        executable: true,
      }
    ]
  }
];

// Get categories and query metadata
function getLabCategories(req, res) {
  res.json({
    success: true,
    data: LAB_CATEGORIES,
  });
}

// Execute preconfigured approved query
async function executeLabQuery(req, res) {
  const { queryId } = req.body;

  if (!queryId) {
    return res.status(400).json({ success: false, error: 'queryId is required.' });
  }

  // Find approved query template
  let approvedQuery = null;
  for (const cat of LAB_CATEGORIES) {
    const match = cat.queries.find(q => q.id === queryId);
    if (match) {
      approvedQuery = match;
      break;
    }
  }

  if (!approvedQuery) {
    return res.status(404).json({ success: false, error: 'Query template not found in approved registry.' });
  }

  if (!approvedQuery.executable) {
    return res.status(400).json({
      success: false,
      error: 'This query is marked as documented-only for academic safety and cannot be executed directly.',
      note: approvedQuery.note,
    });
  }

  const startTime = Date.now();
  try {
    const result = await query(approvedQuery.sql);
    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      queryId: approvedQuery.id,
      title: approvedQuery.title,
      sql: approvedQuery.sql,
      executionTimeMs: durationMs,
      rowCount: result.rowCount || (Array.isArray(result) ? result[result.length - 1].rowCount : 0),
      fields: (result.fields || (Array.isArray(result) ? result[result.length - 1].fields : []) || []).map(f => ({
        name: f.name,
        dataTypeID: f.dataTypeID,
      })),
      rows: Array.isArray(result) ? result[result.length - 1].rows : result.rows,
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      queryId: approvedQuery.id,
      title: approvedQuery.title,
      sql: approvedQuery.sql,
      executionTimeMs: durationMs,
      error: err.message,
    });
  }
}

module.exports = {
  getLabCategories,
  executeLabQuery,
};

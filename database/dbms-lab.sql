-- ============================================================================
-- BLACKSITE // OPERATOR ARMORY - ACADEMIC DBMS DEMONSTRATION SUITE
-- Module: Complete Verification Queries Covering Syllabus Requirements
-- ============================================================================

-- ============================================================================
-- 1. DDL QUERIES (Data Definition Language)
-- ============================================================================

-- 1.1 CREATE TABLE with integrity constraints (e.g. temporary weapon attachments)
CREATE TABLE IF NOT EXISTS weapon_attachments (
    attachment_id SERIAL PRIMARY KEY,
    attachment_name VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(30) CHECK (category IN ('Optic', 'Muzzle', 'Underbarrel', 'Laser')),
    zoom_level NUMERIC(3, 1) DEFAULT 1.0 CHECK (zoom_level >= 1.0)
);

-- 1.2 ALTER TABLE: Add column, modify constraint
ALTER TABLE weapon_attachments ADD COLUMN IF NOT EXISTS weight_grams INT DEFAULT 250;
ALTER TABLE weapon_attachments ALTER COLUMN weight_grams SET NOT NULL;

-- 1.3 RENAME: Rename column
ALTER TABLE weapon_attachments RENAME COLUMN weight_grams TO mass_grams;

-- 1.4 TRUNCATE: Clear table
TRUNCATE TABLE weapon_attachments;

-- 1.5 DROP: Remove table
DROP TABLE IF EXISTS weapon_attachments;


-- ============================================================================
-- 2. DML QUERIES (Data Manipulation Language)
-- ============================================================================

-- 2.1 INSERT with returning
INSERT INTO audit_logs (player_id, action_type, details)
VALUES (1, 'LAB_TEST_INSERT', 'DML demonstration insert executed.')
RETURNING log_id, player_id, action_type, created_at;

-- 2.2 UPDATE with WHERE clause
UPDATE inventories 
SET durability = LEAST(100, durability + 5)
WHERE player_id = 1 AND durability < 100;

-- 2.3 DELETE with cascading / non-cascading verification
-- Non-cascading safe delete
DELETE FROM audit_logs 
WHERE action_type = 'LAB_TEST_INSERT';


-- ============================================================================
-- 3. DCL QUERIES (Data Control Language - Demonstration / Admin Scripts)
-- ============================================================================

-- 3.1 CREATE ROLE & GRANT read-only permissions
-- CREATE ROLE armory_analyst WITH LOGIN PASSWORD 'secure_pass';
-- GRANT CONNECT ON DATABASE postgres TO armory_analyst;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO armory_analyst;

-- 3.2 REVOKE permissions
-- REVOKE SELECT ON audit_logs FROM armory_analyst;


-- ============================================================================
-- 4. TCL QUERIES (Transaction Control Language)
-- ============================================================================

-- 4.1 Transaction with SAVEPOINT and ROLLBACK
BEGIN;
UPDATE wallets SET balance = balance + 500 WHERE player_id = 1 AND currency_id = 1;
SAVEPOINT bonus_applied;
UPDATE wallets SET balance = balance - 100000 WHERE player_id = 1 AND currency_id = 1;
-- Condition fails or rollback to savepoint:
ROLLBACK TO SAVEPOINT bonus_applied;
COMMIT;


-- ============================================================================
-- 5. DQL QUERIES (Data Query Language)
-- ============================================================================

-- 5.1 SELECT with WHERE and Arithmetic Comparison
SELECT item_name, rarity, category, base_durability 
FROM item_catalog 
WHERE is_tradable = TRUE AND base_durability >= 90;

-- 5.2 AGGREGATE FUNCTIONS (COUNT, SUM, AVG, MIN, MAX)
SELECT 
    COUNT(*) AS total_inventory_items,
    ROUND(AVG(durability), 2) AS avg_fleet_durability,
    MIN(durability) AS lowest_durability,
    MAX(durability) AS peak_durability
FROM inventories;

-- 5.3 IN, LIKE, and DISTINCT
SELECT DISTINCT rarity 
FROM item_catalog 
WHERE item_name LIKE '%Vector%' OR category IN ('Combat Helmet', 'Tactical Vest');

-- 5.4 ORDER BY, LIMIT, and OFFSET (Pagination)
SELECT item_name, rarity, category 
FROM item_catalog 
ORDER BY rarity DESC, item_name ASC 
LIMIT 5 OFFSET 0;

-- 5.5 GROUP BY and GROUP BY WITH HAVING
SELECT 
    c.rarity,
    COUNT(i.item_instance_id) AS total_instances,
    ROUND(AVG(i.durability), 1) AS avg_durability
FROM inventories i
JOIN item_catalog c ON i.item_type_id = c.item_type_id
GROUP BY c.rarity
HAVING COUNT(i.item_instance_id) >= 2
ORDER BY total_instances DESC;

-- 5.6 JOINS (All Types)

-- 5.6.1 INNER JOIN: Item Instances and Catalog
SELECT i.item_instance_id, p.username, c.item_name, c.rarity
FROM inventories i
INNER JOIN players p ON i.player_id = p.player_id
INNER JOIN item_catalog c ON i.item_type_id = c.item_type_id;

-- 5.6.2 LEFT OUTER JOIN: All Players and their Market Listings (including players with 0 listings)
SELECT p.player_id, p.username, ml.listing_id, ml.price, ml.status
FROM players p
LEFT OUTER JOIN market_listings ml ON p.player_id = ml.seller_id;

-- 5.6.3 RIGHT OUTER JOIN: Items listed vs all active catalog items
SELECT c.item_name, ml.listing_id, ml.price
FROM market_listings ml
RIGHT OUTER JOIN inventories i ON ml.item_instance_id = i.item_instance_id
RIGHT OUTER JOIN item_catalog c ON i.item_type_id = c.item_type_id;

-- 5.6.4 FULL OUTER JOIN: Players and Pending Trades (as either initiator or receiver)
SELECT p.username, t.trade_id, t.status
FROM players p
FULL OUTER JOIN trades t ON p.player_id = t.initiator_id OR p.player_id = t.receiver_id;

-- 5.6.5 CROSS JOIN: Player and Currency Matrix (Cartesian Product)
SELECT p.username, cur.currency_name
FROM players p
CROSS JOIN currencies cur
WHERE p.player_id <= 3;

-- 5.6.6 SELF JOIN: Comparing listings with different prices for the same item archetype
SELECT 
    m1.listing_id AS listing_a,
    m1.price AS price_a,
    m2.listing_id AS listing_b,
    m2.price AS price_b,
    c.item_name
FROM market_listings m1
JOIN market_listings m2 ON m1.currency_id = m2.currency_id AND m1.listing_id < m2.listing_id
JOIN inventories i1 ON m1.item_instance_id = i1.item_instance_id
JOIN inventories i2 ON m2.item_instance_id = i2.item_instance_id
JOIN item_catalog c ON i1.item_type_id = c.item_type_id AND i2.item_type_id = c.item_type_id;

-- 5.7 SET OPERATIONS: UNION, UNION ALL, INTERSECT, EXCEPT

-- 5.7.1 UNION: Players who have either listed on market or initiated a trade (distinct)
SELECT seller_id AS player_id FROM market_listings
UNION
SELECT initiator_id AS player_id FROM trades;

-- 5.7.2 UNION ALL: All trading and marketplace activity touchpoints (preserves duplicates)
SELECT seller_id AS player_id, 'MARKET' AS channel FROM market_listings
UNION ALL
SELECT initiator_id AS player_id, 'TRADE' AS channel FROM trades;

-- 5.7.3 INTERSECT: Players who have BOTH listed items on market AND initiated trades
SELECT seller_id AS player_id FROM market_listings
INTERSECT
SELECT initiator_id AS player_id FROM trades;

-- 5.7.4 EXCEPT: Players who have listed items on market BUT NEVER initiated a trade
SELECT seller_id AS player_id FROM market_listings
EXCEPT
SELECT initiator_id AS player_id FROM trades;


-- ============================================================================
-- 6. SUBQUERIES (Scalar, Correlated, ANY/ALL)
-- ============================================================================

-- 6.1 SCALAR SUBQUERY: Items with durability higher than fleet average
SELECT item_instance_id, player_id, durability
FROM inventories
WHERE durability > (SELECT AVG(durability) FROM inventories);

-- 6.2 CORRELATED SUBQUERY: Players with more than the average wallet balance in currency #1
SELECT p.username, w.balance
FROM players p
JOIN wallets w ON p.player_id = w.player_id
WHERE w.currency_id = 1
  AND w.balance > (
      SELECT AVG(w2.balance) 
      FROM wallets w2 
      WHERE w2.currency_id = 1
  );

-- 6.3 ANY SUBQUERY: Store offers priced cheaper than ANY active marketplace listing in credits
SELECT offer_id, item_type_id, price 
FROM store_offers 
WHERE currency_id = 1 
  AND price < ANY (
      SELECT price FROM market_listings WHERE currency_id = 1 AND status = 'active'
  );

-- 6.4 ALL SUBQUERY: Store offers priced higher than ALL market listings for the same currency
SELECT offer_id, price
FROM store_offers
WHERE currency_id = 2
  AND price > ALL (
      SELECT price FROM market_listings WHERE currency_id = 2 AND status = 'active'
  );


-- ============================================================================
-- 7. VIEWS & MATERIALIZED VIEWS DEMONSTRATION
-- ============================================================================

-- 7.1 Query standard view
SELECT * FROM v_player_inventory_details WHERE player_id = 1;

-- 7.2 Query Materialized View
SELECT * FROM mv_market_economy_summary;

-- 7.3 Refresh Materialized View
REFRESH MATERIALIZED VIEW mv_market_economy_summary;


-- ============================================================================
-- 8. STORED PROCEDURES, FUNCTIONS & TRIGGERS DEMONSTRATION
-- ============================================================================

-- 8.1 Call PL/pgSQL Function: Eligibility check
SELECT fn_check_item_eligibility(1) AS item_1_eligible,
       fn_check_item_eligibility(7) AS item_7_eligible;

-- 8.2 Verify Trigger: Check audit log populated from automated balance or trade
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;

-- ============================================================================
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

-- ============================================================================
-- BLACKSITE // OPERATOR ARMORY - XAMPP (MySQL / MariaDB) SCHEMA
-- Target Engine: MariaDB 10.4+ / MySQL 8.0+ (Bundled in XAMPP)
-- phpMyAdmin Compatible: Ready to import or execute directly in XAMPP SQL Tab
-- ============================================================================

CREATE DATABASE IF NOT EXISTS blacksite_armory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blacksite_armory;

-- Drop existing tables in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS wheel_spins;
DROP TABLE IF EXISTS wheel_rewards;
DROP TABLE IF EXISTS wheel_events;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS trade_currencies;
DROP TABLE IF EXISTS trade_items;
DROP TABLE IF EXISTS trades;
DROP TABLE IF EXISTS market_listings;
DROP TABLE IF EXISTS store_offers;
DROP TABLE IF EXISTS inventories;
DROP TABLE IF EXISTS item_catalog;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS currencies;
DROP TABLE IF EXISTS players;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. PLAYERS
CREATE TABLE players (
    player_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('active', 'suspended', 'offline', 'banned') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. CURRENCIES
CREATE TABLE currencies (
    currency_id INT AUTO_INCREMENT PRIMARY KEY,
    currency_name VARCHAR(50) NOT NULL UNIQUE,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    symbol VARCHAR(10) NOT NULL DEFAULT 'CR',
    description TEXT
) ENGINE=InnoDB;

-- 3. WALLETS
CREATE TABLE wallets (
    wallet_id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    currency_id INT NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_player_currency UNIQUE (player_id, currency_id),
    CONSTRAINT fk_wallets_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    CONSTRAINT fk_wallets_currency FOREIGN KEY (currency_id) REFERENCES currencies(currency_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. ITEM CATALOG
CREATE TABLE item_catalog (
    item_type_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL UNIQUE,
    rarity ENUM('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic') NOT NULL,
    is_tradable BOOLEAN NOT NULL DEFAULT TRUE,
    category ENUM(
        'Assault Rifle', 'SMG', 'Sniper Rifle', 'Combat Helmet', 
        'Tactical Vest', 'Weapon Skin', 'Operator Skin', 
        'Supply Crate', 'Tactical Gear'
    ) NOT NULL,
    base_durability INT NOT NULL DEFAULT 100,
    description TEXT,
    asset_key VARCHAR(50) NOT NULL DEFAULT 'standard_gear'
) ENGINE=InnoDB;

-- 5. INVENTORIES (Item Instances)
CREATE TABLE inventories (
    item_instance_id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    item_type_id INT NOT NULL,
    durability INT NOT NULL DEFAULT 100,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    acquired_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_catalog FOREIGN KEY (item_type_id) REFERENCES item_catalog(item_type_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. STORE OFFERS
CREATE TABLE store_offers (
    offer_id INT AUTO_INCREMENT PRIMARY KEY,
    item_type_id INT NOT NULL,
    currency_id INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    stock_limit INT NOT NULL,
    stock_sold INT NOT NULL DEFAULT 0,
    status ENUM('available', 'sold_out', 'expired', 'disabled') NOT NULL DEFAULT 'available',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_offers_catalog FOREIGN KEY (item_type_id) REFERENCES item_catalog(item_type_id) ON DELETE RESTRICT,
    CONSTRAINT fk_offers_currency FOREIGN KEY (currency_id) REFERENCES currencies(currency_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. MARKET LISTINGS
CREATE TABLE market_listings (
    listing_id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    item_instance_id INT NOT NULL,
    currency_id INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    status ENUM('active', 'sold', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_market_seller FOREIGN KEY (seller_id) REFERENCES players(player_id) ON DELETE CASCADE,
    CONSTRAINT fk_market_item FOREIGN KEY (item_instance_id) REFERENCES inventories(item_instance_id) ON DELETE RESTRICT,
    CONSTRAINT fk_market_currency FOREIGN KEY (currency_id) REFERENCES currencies(currency_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 8. TRADES
CREATE TABLE trades (
    trade_id INT AUTO_INCREMENT PRIMARY KEY,
    initiator_id INT NOT NULL,
    receiver_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'declined', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    CONSTRAINT fk_trade_initiator FOREIGN KEY (initiator_id) REFERENCES players(player_id) ON DELETE CASCADE,
    CONSTRAINT fk_trade_receiver FOREIGN KEY (receiver_id) REFERENCES players(player_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. TRADE ITEMS
CREATE TABLE trade_items (
    trade_item_id INT AUTO_INCREMENT PRIMARY KEY,
    trade_id INT NOT NULL,
    item_instance_id INT NOT NULL,
    player_id INT NOT NULL,
    CONSTRAINT uq_trade_item_instance UNIQUE (trade_id, item_instance_id),
    CONSTRAINT fk_ti_trade FOREIGN KEY (trade_id) REFERENCES trades(trade_id) ON DELETE CASCADE,
    CONSTRAINT fk_ti_item FOREIGN KEY (item_instance_id) REFERENCES inventories(item_instance_id) ON DELETE CASCADE,
    CONSTRAINT fk_ti_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. TRADE CURRENCIES
CREATE TABLE trade_currencies (
    trade_currency_id INT AUTO_INCREMENT PRIMARY KEY,
    trade_id INT NOT NULL,
    currency_id INT NOT NULL,
    player_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    CONSTRAINT uq_trade_player_currency UNIQUE (trade_id, player_id, currency_id),
    CONSTRAINT fk_tc_trade FOREIGN KEY (trade_id) REFERENCES trades(trade_id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_currency FOREIGN KEY (currency_id) REFERENCES currencies(currency_id) ON DELETE RESTRICT,
    CONSTRAINT fk_tc_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. AUDIT LOGS
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NULL,
    action_type VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 12. LUCK ROYALE EVENTS
CREATE TABLE wheel_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    currency_id INT NOT NULL,
    spin_cost DECIMAL(15, 2) NOT NULL DEFAULT 500.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wheel_currency FOREIGN KEY (currency_id) REFERENCES currencies(currency_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 13. LUCK ROYALE REWARDS (With Atomic Scarcity Cap)
CREATE TABLE wheel_rewards (
    reward_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL DEFAULT 1,
    item_type_id INT NOT NULL,
    base_probability DECIMAL(6, 4) NOT NULL,
    max_supply INT NULL,
    awarded_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wr_catalog FOREIGN KEY (item_type_id) REFERENCES item_catalog(item_type_id) ON DELETE RESTRICT,
    CONSTRAINT fk_wr_event FOREIGN KEY (event_id) REFERENCES wheel_events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. LUCK ROYALE SPINS (Audit History & Idempotency)
CREATE TABLE wheel_spins (
    spin_id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    reward_id INT NOT NULL,
    item_instance_id INT NOT NULL,
    currency_id INT NOT NULL,
    cost_paid DECIMAL(15, 2) NOT NULL,
    idempotency_key VARCHAR(64) NULL UNIQUE,
    spun_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ws_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    CONSTRAINT fk_ws_reward FOREIGN KEY (reward_id) REFERENCES wheel_rewards(reward_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ws_item FOREIGN KEY (item_instance_id) REFERENCES inventories(item_instance_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- VIEWS
CREATE OR REPLACE VIEW v_player_inventory_details AS
SELECT 
    i.item_instance_id,
    i.player_id,
    p.username AS owner_username,
    c.item_type_id,
    c.item_name,
    c.rarity,
    c.category,
    c.is_tradable,
    c.asset_key,
    i.durability,
    i.is_equipped,
    i.acquired_at,
    CASE 
        WHEN ml.listing_id IS NOT NULL THEN 'LISTED'
        ELSE 'AVAILABLE'
    END AS availability_status,
    ml.listing_id AS active_listing_id,
    ml.price AS listing_price
FROM inventories i
JOIN players p ON i.player_id = p.player_id
JOIN item_catalog c ON i.item_type_id = c.item_type_id
LEFT JOIN market_listings ml ON i.item_instance_id = ml.item_instance_id AND ml.status = 'active';


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


-- ============================================================================
-- Query 1: Simple SELECT with Filtering & Ordering (Basic Selection & Projection)
-- ============================================================================
-- Plain Text: Retrieve all registered tactical operators who have an "active" account status, displaying their player ID, username, email address, and registration timestamp, ordered alphabetically by username.
--
-- [SQL QUERY]:
SELECT player_id, username, email, status, created_at
FROM players
WHERE status = 'active'
ORDER BY username ASC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +-----------+---------------+----------------------+--------+-----------------------------------------------+
    | player_id | username      | email                | status | created_at                                    |
    +-----------+---------------+----------------------+--------+-----------------------------------------------+
    | 8         | CYPHER_BREACH | cypher@blacksite.mil | active | Sun Feb 01 2026 17:05:00 GMT+0530 (India S... |
    | 1         | GHOST_ACTUAL  | ghost@blacksite.mil  | active | Sat Jan 10 2026 08:00:00 GMT+0530 (India S... |
    | 5         | NOMAD_SNIPER  | nomad@blacksite.mil  | active | Tue Jan 20 2026 16:45:00 GMT+0530 (India S... |
    | 7         | RECON_SPECTRE | recon@blacksite.mil  | active | Sun Jan 25 2026 12:00:00 GMT+0530 (India S... |
    | 3         | SHADOW_LEAD   | shadow@blacksite.mil | active | Thu Jan 15 2026 14:30:00 GMT+0530 (India S... |
    | 6         | TITAN_HEAVY   | titan@blacksite.mil  | active | Thu Jan 22 2026 11:10:00 GMT+0530 (India S... |
    | 4         | VALKYRIE_TAC  | valk@blacksite.mil   | active | Sun Jan 18 2026 09:20:00 GMT+0530 (India S... |
    | 2         | VIPER_SEVEN   | viper@blacksite.mil  | active | Mon Jan 12 2026 10:15:00 GMT+0530 (India S... |
    +-----------+---------------+----------------------+--------+-----------------------------------------------+
*/


-- ============================================================================
-- Query 2: Multi-Criteria Filtering with Logical Operators (AND, OR, NOT)
-- ============================================================================
-- Plain Text: Find all tactical item blueprints from the catalog that are either of "Mythic" or "Legendary" rarity AND have a base durability of at least 95, excluding items that are designated as non-tradable.
--
-- [SQL QUERY]:
SELECT item_type_id, item_name, rarity, category, base_durability, is_tradable
FROM item_catalog
WHERE (rarity = 'Mythic' OR rarity = 'Legendary')
  AND base_durability >= 95
  AND is_tradable = 1
ORDER BY base_durability DESC, rarity ASC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +--------------+-------------------+-----------+---------------+-----------------+-------------+
    | item_type_id | item_name         | rarity    | category      | base_durability | is_tradable |
    +--------------+-------------------+-----------+---------------+-----------------+-------------+
    | 1            | Phantom Circuit   | Legendary | Assault Rifle | 100             | 1           |
    | 6            | Redline Spectre   | Legendary | Weapon Skin   | 100             | 1           |
    | 3            | Obsidian Vector   | Mythic    | SMG           | 100             | 1           |
    | 13           | Cryo Shock        | Mythic    | Weapon Skin   | 100             | 1           |
    | 17           | Phantom Prototype | Mythic    | Assault Rifle | 100             | 1           |
    +--------------+-------------------+-----------+---------------+-----------------+-------------+
*/


-- ============================================================================
-- Query 3: Pattern Matching & Wildcards (LIKE with % and _)
-- ============================================================================
-- Plain Text: Retrieve all weapons and tactical equipment whose name starts with "Phantom" or contains the word "Viper" anywhere in the item name.
--
-- [SQL QUERY]:
SELECT item_type_id, item_name, category, rarity, asset_key
FROM item_catalog
WHERE item_name LIKE 'Phantom%' OR item_name LIKE '%Viper%'
ORDER BY item_name ASC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +--------------+-------------------+---------------+-----------+---------------+
    | item_type_id | item_name         | category      | rarity    | asset_key     |
    +--------------+-------------------+---------------+-----------+---------------+
    | 10           | Apex Viper        | Assault Rifle | Epic      | rifle_apex    |
    | 1            | Phantom Circuit   | Assault Rifle | Legendary | rifle_phantom |
    | 17           | Phantom Prototype | Assault Rifle | Mythic    | rifle_phantom |
    +--------------+-------------------+---------------+-----------+---------------+
*/


-- ============================================================================
-- Query 4: Range Checking & Ordering (BETWEEN ... AND ...)
-- ============================================================================
-- Plain Text: Retrieve all physical inventory item instances whose current durability falls between 80% and 95% inclusive, displaying the instance ID, owner player ID, item type ID, and current durability, sorted from highest to lowest durability.
--
-- [SQL QUERY]:
SELECT item_instance_id, player_id, item_type_id, durability, is_equipped, acquired_at
FROM inventories
WHERE durability BETWEEN 80 AND 95
ORDER BY durability DESC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +------------------+-----------+--------------+------------+-------------+-----------------------------------------------+
    | item_instance_id | player_id | item_type_id | durability | is_equipped | acquired_at                                   |
    +------------------+-----------+--------------+------------+-------------+-----------------------------------------------+
    | 24               | 1         | 1            | 95         | 0           | Tue Feb 17 2026 15:50:00 GMT+0530 (India S... |
    | 4                | 1         | 5            | 93         | 1           | Mon Feb 02 2026 11:35:00 GMT+0530 (India S... |
    | 19               | 5         | 9            | 92         | 1           | Fri Feb 13 2026 17:00:00 GMT+0530 (India S... |
    | 14               | 3         | 12           | 90         | 1           | Sun Feb 08 2026 08:35:00 GMT+0530 (India S... |
    | 9                | 2         | 4            | 89         | 1           | Wed Feb 04 2026 15:25:00 GMT+0530 (India S... |
    | 22               | 6         | 5            | 84         | 1           | Mon Feb 16 2026 19:20:00 GMT+0530 (India S... |
    | 21               | 1         | 15           | 82         | 0           | Sun Feb 15 2026 12:40:00 GMT+0530 (India S... |
    +------------------+-----------+--------------+------------+-------------+-----------------------------------------------+
*/


-- ============================================================================
-- Query 5: Discrete Set Membership (IN and NOT IN)
-- ============================================================================
-- Plain Text: Find all Armory Store offers whose featured item belongs to defensive equipment categories ("Combat Helmet", "Tactical Vest", "Tactical Gear") and whose price is NOT denominated in currency #4 (Crypto-Scrip).
--
-- [SQL QUERY]:
SELECT so.offer_id, c.item_name, c.category, c.rarity, so.price, so.currency_id, so.status
FROM store_offers so
JOIN item_catalog c ON so.item_type_id = c.item_type_id
WHERE c.category IN ('Combat Helmet', 'Tactical Vest', 'Tactical Gear')
  AND so.currency_id NOT IN (4)
ORDER BY so.price ASC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +----------+----------------+---------------+----------+---------+-------------+-----------+
    | offer_id | item_name      | category      | rarity   | price   | currency_id | status    |
    +----------+----------------+---------------+----------+---------+-------------+-----------+
    | 7        | Recon Pulse    | Tactical Gear | Uncommon | 3200.00 | 1           | available |
    | 4        | Ghost Protocol | Combat Helmet | Rare     | 6500.00 | 1           | available |
    | 5        | Ironclad       | Tactical Vest | Epic     | 9500.00 | 1           | available |
    +----------+----------------+---------------+----------+---------+-------------+-----------+
*/


-- ============================================================================
-- Query 6: NULL Value Handling & Coalescing (IS NULL / COALESCE)
-- ============================================================================
-- Plain Text: List all bilateral trades in the system, showing trade ID, initiator ID, receiver ID, status, and the resolution timestamp, displaying "STILL_PENDING" if the trade has not yet been resolved.
--
-- [SQL QUERY]:
SELECT trade_id, initiator_id, receiver_id, status, created_at,
       COALESCE(CAST(resolved_at AS CHAR), 'STILL_PENDING') AS resolution_status
FROM trades
ORDER BY trade_id ASC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +----------+--------------+-------------+-----------+-----------------------------------------------+---------------------+
    | trade_id | initiator_id | receiver_id | status    | created_at                                    | resolution_status   |
    +----------+--------------+-------------+-----------+-----------------------------------------------+---------------------+
    | 1        | 1            | 2           | accepted  | Sat Feb 21 2026 14:00:00 GMT+0530 (India S... | 2026-10-26 14:52:34 |
    | 2        | 2            | 3           | cancelled | Sat Feb 21 2026 16:30:00 GMT+0530 (India S... | 2026-10-26 14:52:39 |
    | 3        | 4            | 1           | accepted  | Sun Feb 15 2026 10:00:00 GMT+0530 (India S... | 2026-02-15 10:45:00 |
    | 4        | 5            | 6           | declined  | Mon Feb 16 2026 11:20:00 GMT+0530 (India S... | 2026-02-16 12:00:00 |
    | 5        | 6            | 1           | cancelled | Tue Feb 17 2026 08:30:00 GMT+0530 (India S... | 2026-02-17 09:00:00 |
    | 6        | 3            | 4           | accepted  | Wed Feb 18 2026 17:10:00 GMT+0530 (India S... | 2026-02-18 18:00:00 |
    +----------+--------------+-------------+-----------+-----------------------------------------------+---------------------+
*/


-- ============================================================================
-- Query 7: Basic Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)
-- ============================================================================
-- Plain Text: Calculate system-wide summary metrics for all physical inventory items: total count of instantiated items, average durability, lowest durability, and peak durability across all player inventories.
--
-- [SQL QUERY]:
SELECT 
    COUNT(*) AS total_inventory_items,
    ROUND(AVG(durability), 2) AS avg_fleet_durability,
    MIN(durability) AS lowest_durability,
    MAX(durability) AS peak_durability,
    SUM(CASE WHEN is_equipped = 1 THEN 1 ELSE 0 END) AS total_equipped_items
FROM inventories;

-- [EXECUTED QUERY OUTPUT]:
/*
    +-----------------------+----------------------+-------------------+-----------------+----------------------+
    | total_inventory_items | avg_fleet_durability | lowest_durability | peak_durability | total_equipped_items |
    +-----------------------+----------------------+-------------------+-----------------+----------------------+
    | 25                    | 93.24                | 65                | 100             | 13                   |
    +-----------------------+----------------------+-------------------+-----------------+----------------------+
*/


-- ============================================================================
-- Query 8: Grouping Data with Single & Multiple Aggregates (GROUP BY)
-- ============================================================================
-- Plain Text: Group all catalog items by their equipment category and determine the number of blueprints in each category, along with the average base durability and the highest durability in that category.
--
-- [SQL QUERY]:
SELECT 
    category,
    COUNT(*) AS total_blueprints,
    ROUND(AVG(base_durability), 1) AS avg_base_durability,
    MAX(base_durability) AS max_base_durability
FROM item_catalog
GROUP BY category
ORDER BY total_blueprints DESC, category ASC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +---------------+------------------+---------------------+---------------------+
    | category      | total_blueprints | avg_base_durability | max_base_durability |
    +---------------+------------------+---------------------+---------------------+
    | Assault Rifle | 3                | 98.3                | 100                 |
    | Tactical Gear | 3                | 88.3                | 100                 |
    | SMG           | 2                | 92.5                | 100                 |
    | Combat Helmet | 2                | 85.0                | 95                  |
    | Tactical Vest | 2                | 87.5                | 90                  |
    | Weapon Skin   | 2                | 100.0               | 100                 |
    | Sniper Rifle  | 1                | 90.0                | 90                  |
    | Operator Skin | 1                | 100.0               | 100                 |
    | Supply Crate  | 1                | 100.0               | 100                 |
    +---------------+------------------+---------------------+---------------------+
*/


-- ============================================================================
-- Query 9: Aggregated Filtering with Conditions on Groups (GROUP BY with HAVING)
-- ============================================================================
-- Plain Text: Find all item rarity tiers that have at least 2 distinct physical item instances instantiated in player inventories AND have an average durability strictly greater than 85%.
--
-- [SQL QUERY]:
SELECT 
    c.rarity,
    COUNT(i.item_instance_id) AS total_instances,
    ROUND(AVG(i.durability), 2) AS avg_durability,
    MIN(i.durability) AS min_durability
FROM inventories i
JOIN item_catalog c ON i.item_type_id = c.item_type_id
GROUP BY c.rarity
HAVING COUNT(i.item_instance_id) >= 2 AND AVG(i.durability) > 85.00
ORDER BY total_instances DESC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +-----------+-----------------+----------------+----------------+
    | rarity    | total_instances | avg_durability | min_durability |
    +-----------+-----------------+----------------+----------------+
    | Rare      | 7               | 94.86          | 89             |
    | Epic      | 6               | 95.33          | 84             |
    | Legendary | 5               | 99.00          | 95             |
    | Mythic    | 3               | 100.00         | 100            |
    +-----------+-----------------+----------------+----------------+
*/


-- ============================================================================
-- Query 10: Multi-Table Inner Join (3-Table INNER JOIN)
-- ============================================================================
-- Plain Text: Display a complete inspection of all currently equipped loadout items, joining players, physical inventories, and item blueprints to show the operator username, blueprint name, rarity, category, and instance durability.
--
-- [SQL QUERY]:
SELECT 
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
ORDER BY p.player_id ASC, c.rarity DESC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +-----------+-----------------+------------------+-----------+---------------+--------------------+-----------------------------------------------+
    | player_id | operator_handle | item_name        | rarity    | category      | current_durability | acquired_at                                   |
    +-----------+-----------------+------------------+-----------+---------------+--------------------+-----------------------------------------------+
    | 1         | GHOST_ACTUAL    | Phantom Circuit  | Legendary | Assault Rifle | 100                | Sun Feb 01 2026 10:00:00 GMT+0530 (India S... |
    | 1         | GHOST_ACTUAL    | Ironclad         | Epic      | Tactical Vest | 93                 | Mon Feb 02 2026 11:35:00 GMT+0530 (India S... |
    | 1         | GHOST_ACTUAL    | Nightwatch       | Epic      | Operator Skin | 100                | Sun Feb 01 2026 10:05:00 GMT+0530 (India S... |
    | 1         | GHOST_ACTUAL    | Ghost Protocol   | Rare      | Combat Helmet | 97                 | Mon Feb 02 2026 11:30:00 GMT+0530 (India S... |
    | 2         | VIPER_SEVEN     | Obsidian Vector  | Mythic    | SMG           | 100                | Wed Feb 04 2026 15:20:00 GMT+0530 (India S... |
    | 2         | VIPER_SEVEN     | Ironclad         | Epic      | Tactical Vest | 99                 | Wed Feb 04 2026 15:30:00 GMT+0530 (India S... |
    | 2         | VIPER_SEVEN     | Ghost Protocol   | Rare      | Combat Helmet | 89                 | Wed Feb 04 2026 15:25:00 GMT+0530 (India S... |
    | 3         | SHADOW_LEAD     | Vanguard M24     | Rare      | Sniper Rifle  | 96                 | Sun Feb 08 2026 08:30:00 GMT+0530 (India S... |
    | 3         | SHADOW_LEAD     | Aegis Sentinel   | Rare      | Tactical Vest | 90                 | Sun Feb 08 2026 08:35:00 GMT+0530 (India S... |
    | 4         | VALKYRIE_TAC    | Cryo Shock       | Mythic    | Weapon Skin   | 100                | Tue Feb 10 2026 16:00:00 GMT+0530 (India S... |
    | 5         | NOMAD_SNIPER    | Vanguard M24     | Rare      | Sniper Rifle  | 92                 | Fri Feb 13 2026 17:00:00 GMT+0530 (India S... |
    | 6         | TITAN_HEAVY     | Ironclad         | Epic      | Tactical Vest | 84                 | Mon Feb 16 2026 19:20:00 GMT+0530 (India S... |
    | 6         | TITAN_HEAVY     | SpecOps Breacher | Common    | Combat Helmet | 75                 | Mon Feb 16 2026 19:25:00 GMT+0530 (India S... |
    +-----------+-----------------+------------------+-----------+---------------+--------------------+-----------------------------------------------+
*/


-- ============================================================================
-- Query 11: Left Outer Join (LEFT JOIN with NULL Detection)
-- ============================================================================
-- Plain Text: Retrieve all registered operators and their active market listings, including operators who currently have zero active listings on the Black Market (showing NULL for listing columns).
--
-- [SQL QUERY]:
SELECT 
    p.player_id,
    p.username,
    p.status AS account_status,
    ml.listing_id,
    ml.price AS asking_price,
    ml.status AS listing_status
FROM players p
LEFT JOIN market_listings ml ON p.player_id = ml.seller_id AND ml.status = 'active'
ORDER BY p.player_id ASC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +-----------+---------------+----------------+------------+--------------+----------------+
    | player_id | username      | account_status | listing_id | asking_price | listing_status |
    +-----------+---------------+----------------+------------+--------------+----------------+
    | 1         | GHOST_ACTUAL  | active         | 1          | 18500.00     | active         |
    | 2         | VIPER_SEVEN   | active         | 2          | 2800.00      | active         |
    | 2         | VIPER_SEVEN   | active         | 3          | 850.00       | active         |
    | 3         | SHADOW_LEAD   | active         | NULL       | NULL         | NULL           |
    | 4         | VALKYRIE_TAC  | active         | 4          | 2100.00      | active         |
    | 5         | NOMAD_SNIPER  | active         | 5          | 1100.00      | active         |
    | 5         | NOMAD_SNIPER  | active         | 6          | 2400.00      | active         |
    | 6         | TITAN_HEAVY   | active         | 7          | 14200.00     | active         |
    | 7         | RECON_SPECTRE | active         | NULL       | NULL         | NULL           |
    | 8         | CYPHER_BREACH | active         | NULL       | NULL         | NULL           |
    +-----------+---------------+----------------+------------+--------------+----------------+
*/


-- ============================================================================
-- Query 12: Right Outer Join (RIGHT JOIN)
-- ============================================================================
-- Plain Text: Show all item blueprint types defined in the catalog and any store offers currently offering that item type, ensuring blueprint archetypes that are not featured in the store are still preserved.
--
-- [SQL QUERY]:
SELECT 
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
LIMIT 12;

-- [EXECUTED QUERY OUTPUT]:
/*
    +----------+--------------+-----------------+---------------+-----------+----------+--------------+
    | offer_id | item_type_id | item_name       | category      | rarity    | price    | offer_status |
    +----------+--------------+-----------------+---------------+-----------+----------+--------------+
    | 1        | 1            | Phantom Circuit | Assault Rifle | Legendary | 15000.00 | available    |
    | 2        | 2            | Nightwatch      | Operator Skin | Epic      | 750.00   | available    |
    | 3        | 3            | Obsidian Vector | SMG           | Mythic    | 1800.00  | available    |
    | 4        | 4            | Ghost Protocol  | Combat Helmet | Rare      | 6500.00  | available    |
    | 5        | 5            | Ironclad        | Tactical Vest | Epic      | 9500.00  | available    |
    | 6        | 6            | Redline Spectre | Weapon Skin   | Legendary | 600.00   | available    |
    | 7        | 7            | Recon Pulse     | Tactical Gear | Uncommon  | 3200.00  | available    |
    | 8        | 8            | Blackout Cache  | Supply Crate  | Rare      | 4500.00  | available    |
    | NULL     | 9            | Vanguard M24    | Sniper Rifle  | Rare      | NULL     | NULL         |
    | 10       | 10           | Apex Viper      | Assault Rifle | Epic      | 8000.00  | available    |
    | NULL     | 11           | Shadow Walker   | Tactical Gear | Common    | NULL     | NULL         |
    | NULL     | 12           | Aegis Sentinel  | Tactical Vest | Rare      | NULL     | NULL         |
    +----------+--------------+-----------------+---------------+-----------+----------+--------------+
*/


-- ============================================================================
-- Query 13: Self Join (Comparing Records Within the Same Table)
-- ============================================================================
-- Plain Text: Compare active market listings selling the same currency denomination to identify price spreads where Listing A is priced lower than Listing B.
--
-- [SQL QUERY]:
SELECT 
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
LIMIT 5;

-- [EXECUTED QUERY OUTPUT]:
/*
    +--------------------+----------+---------------+----------------------+----------+-----------------+------------------+-------------+
    | listing_cheaper_id | seller_a | cheaper_price | listing_expensive_id | seller_b | expensive_price | price_difference | currency_id |
    +--------------------+----------+---------------+----------------------+----------+-----------------+------------------+-------------+
    | 5                  | 5        | 1100.00       | 1                    | 1        | 18500.00        | 17400.00         | 1           |
    | 6                  | 5        | 2400.00       | 1                    | 1        | 18500.00        | 16100.00         | 1           |
    | 2                  | 2        | 2800.00       | 1                    | 1        | 18500.00        | 15700.00         | 1           |
    | 5                  | 5        | 1100.00       | 7                    | 6        | 14200.00        | 13100.00         | 1           |
    | 6                  | 5        | 2400.00       | 7                    | 6        | 14200.00        | 11800.00         | 1           |
    +--------------------+----------+---------------+----------------------+----------+-----------------+------------------+-------------+
*/


-- ============================================================================
-- Query 14: Scalar Subquery in WHERE Clause
-- ============================================================================
-- Plain Text: Retrieve all physical inventory item instances whose current durability is strictly greater than the overall average durability of all inventory items in the system.
--
-- [SQL QUERY]:
SELECT 
    i.item_instance_id,
    i.player_id,
    c.item_name,
    c.rarity,
    i.durability,
    ROUND((SELECT AVG(durability) FROM inventories), 2) AS system_avg_durability
FROM inventories i
JOIN item_catalog c ON i.item_type_id = c.item_type_id
WHERE i.durability > (SELECT AVG(durability) FROM inventories)
ORDER BY i.durability DESC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +------------------+-----------+-----------------+-----------+------------+-----------------------+
    | item_instance_id | player_id | item_name       | rarity    | durability | system_avg_durability |
    +------------------+-----------+-----------------+-----------+------------+-----------------------+
    | 12               | 1         | Phantom Circuit | Legendary | 100        | 93.24                 |
    | 7                | 1         | Founder Token   | Legendary | 100        | 93.24                 |
    | 5                | 2         | Redline Spectre | Legendary | 100        | 93.24                 |
    | 17               | 2         | Obsidian Vector | Mythic    | 100        | 93.24                 |
    | 2                | 1         | Nightwatch      | Epic      | 100        | 93.24                 |
    | 1                | 1         | Phantom Circuit | Legendary | 100        | 93.24                 |
    | 16               | 4         | Cryo Shock      | Mythic    | 100        | 93.24                 |
    | 18               | 4         | Blackout Cache  | Rare      | 100        | 93.24                 |
    | 8                | 2         | Obsidian Vector | Mythic    | 100        | 93.24                 |
    | 6                | 2         | Blackout Cache  | Rare      | 100        | 93.24                 |
    | 25               | 1         | Nightwatch      | Epic      | 100        | 93.24                 |
    | 10               | 2         | Ironclad        | Epic      | 99         | 93.24                 |
    | 3                | 1         | Ghost Protocol  | Rare      | 97         | 93.24                 |
    | 13               | 3         | Vanguard M24    | Rare      | 96         | 93.24                 |
    | 15               | 3         | Apex Viper      | Epic      | 96         | 93.24                 |
    | 24               | 1         | Phantom Circuit | Legendary | 95         | 93.24                 |
    +------------------+-----------+-----------------+-----------+------------+-----------------------+
*/


-- ============================================================================
-- Query 15: Correlated Subquery with Outer Query Reference
-- ============================================================================
-- Plain Text: Retrieve all operators who possess a Combat Credits (currency #1) wallet balance that is greater than the average Combat Credits balance across all operators in the database.
--
-- [SQL QUERY]:
SELECT 
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
ORDER BY w.balance DESC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +-----------+--------------+------------------------+-------------------------+
    | player_id | username     | combat_credits_balance | avg_credits_all_players |
    +-----------+--------------+------------------------+-------------------------+
    | 4         | VALKYRIE_TAC | 89500.00               | 36050.00                |
    | 6         | TITAN_HEAVY  | 68200.00               | 36050.00                |
    | 1         | GHOST_ACTUAL | 40700.00               | 36050.00                |
    | 2         | VIPER_SEVEN  | 38200.00               | 36050.00                |
    +-----------+--------------+------------------------+-------------------------+
*/


-- ============================================================================
-- Query 16: Existence Testing Subquery (EXISTS and NOT EXISTS)
-- ============================================================================
-- Plain Text: Identify all operators who have NEVER created a market listing on the Black Market, using the NOT EXISTS clause.
--
-- [SQL QUERY]:
SELECT p.player_id, p.username, p.email, p.status
FROM players p
WHERE NOT EXISTS (
    SELECT 1 
    FROM market_listings ml 
    WHERE ml.seller_id = p.player_id
)
ORDER BY p.player_id ASC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +-----------+---------------+----------------------+--------+
    | player_id | username      | email                | status |
    +-----------+---------------+----------------------+--------+
    | 7         | RECON_SPECTRE | recon@blacksite.mil  | active |
    | 8         | CYPHER_BREACH | cypher@blacksite.mil | active |
    +-----------+---------------+----------------------+--------+
*/


-- ============================================================================
-- Query 17: Multi-Row Subquery with ANY / ALL Operators
-- ============================================================================
-- Plain Text: Find all store offers priced in Combat Credits (currency #1) whose price is cheaper than ANY active marketplace listing denominated in Combat Credits.
--
-- [SQL QUERY]:
SELECT 
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
ORDER BY so.price ASC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +----------+-----------------+-----------+-------------+------------+
    | offer_id | item_name       | rarity    | store_price | stock_left |
    +----------+-----------------+-----------+-------------+------------+
    | 7        | Recon Pulse     | Uncommon  | 3200.00     | 45         |
    | 8        | Blackout Cache  | Rare      | 4500.00     | 55         |
    | 4        | Ghost Protocol  | Rare      | 6500.00     | 58         |
    | 10       | Apex Viper      | Epic      | 8000.00     | 21         |
    | 5        | Ironclad        | Epic      | 9500.00     | 49         |
    | 1        | Phantom Circuit | Legendary | 15000.00    | 32         |
    +----------+-----------------+-----------+-------------+------------+
*/


-- ============================================================================
-- Query 18: Set Operations (UNION and UNION ALL)
-- ============================================================================
-- Plain Text: Construct a consolidated operational log of all economic touchpoints in the system by taking the UNION of all sellers on the Black Market and all initiators of bilateral trades.
--
-- [SQL QUERY]:
SELECT seller_id AS operator_id, 'MARKET_SELLER' AS activity_role, created_at AS event_timestamp
FROM market_listings
UNION
SELECT initiator_id AS operator_id, 'TRADE_INITIATOR' AS activity_role, created_at AS event_timestamp
FROM trades
ORDER BY event_timestamp DESC
LIMIT 8;

-- [EXECUTED QUERY OUTPUT]:
/*
    +-------------+-----------------+-----------------------------------------------+
    | operator_id | activity_role   | event_timestamp                               |
    +-------------+-----------------+-----------------------------------------------+
    | 2           | TRADE_INITIATOR | Sat Feb 21 2026 16:30:00 GMT+0530 (India S... |
    | 1           | TRADE_INITIATOR | Sat Feb 21 2026 14:00:00 GMT+0530 (India S... |
    | 6           | MARKET_SELLER   | Fri Feb 20 2026 16:20:00 GMT+0530 (India S... |
    | 5           | MARKET_SELLER   | Fri Feb 20 2026 09:10:00 GMT+0530 (India S... |
    | 5           | MARKET_SELLER   | Thu Feb 19 2026 15:45:00 GMT+0530 (India S... |
    | 4           | MARKET_SELLER   | Thu Feb 19 2026 14:00:00 GMT+0530 (India S... |
    | 3           | TRADE_INITIATOR | Wed Feb 18 2026 17:10:00 GMT+0530 (India S... |
    | 2           | MARKET_SELLER   | Wed Feb 18 2026 12:15:00 GMT+0530 (India S... |
    +-------------+-----------------+-----------------------------------------------+
*/


-- ============================================================================
-- Query 19: Advanced Analytical Query with CASE Expressions & Scarcity Calculations
-- ============================================================================
-- Plain Text: Inspect the real-time status of all rewards on the Luck Royale wheel, evaluating their remaining supply and classifying each drop into a scarcity classification ("EXCLUSIVE SCARCE DROP", "SOLD OUT", or "UNLIMITED POOL"), and calculating their effective drop percentage.
--
-- [SQL QUERY]:
SELECT 
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
ORDER BY wr.display_order ASC;

-- [EXECUTED QUERY OUTPUT]:
/*
    +-----------+-------------------+-----------+-------------+------------+---------------+------------------------+-------------------+
    | reward_id | item_name         | rarity    | base_chance | max_supply | awarded_count | scarcity_status        | operational_state |
    +-----------+-------------------+-----------+-------------+------------+---------------+------------------------+-------------------+
    | 1         | Phantom Prototype | Mythic    | 0.50%       | 2          | 0             | LIMITED SUPPLY: 2 LEFT | ACTIVE ON WHEEL   |
    | 2         | Obsidian Vector   | Mythic    | 1.50%       | NULL       | 0             | UNLIMITED POOL         | ACTIVE ON WHEEL   |
    | 3         | Phantom Circuit   | Legendary | 4.00%       | NULL       | 0             | UNLIMITED POOL         | ACTIVE ON WHEEL   |
    | 4         | Redline Spectre   | Legendary | 6.00%       | NULL       | 0             | UNLIMITED POOL         | ACTIVE ON WHEEL   |
    | 5         | Nightwatch        | Epic      | 12.00%      | NULL       | 1             | UNLIMITED POOL         | ACTIVE ON WHEEL   |
    | 6         | Apex Viper        | Epic      | 16.00%      | NULL       | 0             | UNLIMITED POOL         | ACTIVE ON WHEEL   |
    | 7         | Vanguard M24      | Rare      | 20.00%      | NULL       | 0             | UNLIMITED POOL         | ACTIVE ON WHEEL   |
    | 8         | Havoc Carbine     | Uncommon  | 20.00%      | NULL       | 0             | UNLIMITED POOL         | ACTIVE ON WHEEL   |
    | 9         | Shadow Walker     | Common    | 20.00%      | NULL       | 0             | UNLIMITED POOL         | ACTIVE ON WHEEL   |
    +-----------+-------------------+-----------+-------------+------------+---------------+------------------------+-------------------+
*/


-- ============================================================================
-- Query 20: Complex Data Modification & Conditional Maintenance (DML UPDATE with Subquery)
-- ============================================================================
-- Plain Text: Perform armor and equipment maintenance by boosting the durability of all equipped weapons and tactical armor by +5 points (capped at 100%) for operators who have an "active" status, followed by verification.
--
-- [SQL QUERY]:
-- Subquery-driven condition & mathematical expression:
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
LIMIT 6;

-- [EXECUTED QUERY OUTPUT]:
/*
    +------------------+--------------+-----------------+---------------+--------------------+-------------+
    | item_instance_id | username     | item_name       | category      | updated_durability | is_equipped |
    +------------------+--------------+-----------------+---------------+--------------------+-------------+
    | 1                | GHOST_ACTUAL | Phantom Circuit | Assault Rifle | 100                | 1           |
    | 2                | GHOST_ACTUAL | Nightwatch      | Operator Skin | 100                | 1           |
    | 3                | GHOST_ACTUAL | Ghost Protocol  | Combat Helmet | 100                | 1           |
    | 4                | GHOST_ACTUAL | Ironclad        | Tactical Vest | 98                 | 1           |
    | 8                | VIPER_SEVEN  | Obsidian Vector | SMG           | 100                | 1           |
    | 9                | VIPER_SEVEN  | Ghost Protocol  | Combat Helmet | 94                 | 1           |
    +------------------+--------------+-----------------+---------------+--------------------+-------------+
*/


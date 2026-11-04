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
--           (Each query includes Plain Text description and SQL Query)
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
-- PART 2: 20 SQL QUERIES
-- ============================================================================

-- Plain Text: Retrieve all registered tactical operators who have an "active" account status, displaying their player ID, username, email address, and registration timestamp, ordered alphabetically by username.
SELECT player_id, username, email, status, created_at
FROM players
WHERE status = 'active'
ORDER BY username ASC;

-- Plain Text: Find all tactical item blueprints from the catalog that are either of "Mythic" or "Legendary" rarity AND have a base durability of at least 95, excluding items that are designated as non-tradable.
SELECT item_type_id, item_name, rarity, category, base_durability, is_tradable
FROM item_catalog
WHERE (rarity = 'Mythic' OR rarity = 'Legendary')
  AND base_durability >= 95
  AND is_tradable = 1
ORDER BY base_durability DESC, rarity ASC;

-- Plain Text: Retrieve all weapons and tactical equipment whose name starts with "Phantom" or contains the word "Viper" anywhere in the item name.
SELECT item_type_id, item_name, category, rarity, asset_key
FROM item_catalog
WHERE item_name LIKE 'Phantom%' OR item_name LIKE '%Viper%'
ORDER BY item_name ASC;

-- Plain Text: Retrieve all physical inventory item instances whose current durability falls between 80% and 95% inclusive, displaying the instance ID, owner player ID, item type ID, and current durability, sorted from highest to lowest durability.
SELECT item_instance_id, player_id, item_type_id, durability, is_equipped, acquired_at
FROM inventories
WHERE durability BETWEEN 80 AND 95
ORDER BY durability DESC;

-- Plain Text: Find all Armory Store offers whose featured item belongs to defensive equipment categories ("Combat Helmet", "Tactical Vest", "Tactical Gear") and whose price is NOT denominated in currency #4 (Crypto-Scrip).
SELECT so.offer_id, c.item_name, c.category, c.rarity, so.price, so.currency_id, so.status
FROM store_offers so
JOIN item_catalog c ON so.item_type_id = c.item_type_id
WHERE c.category IN ('Combat Helmet', 'Tactical Vest', 'Tactical Gear')
  AND so.currency_id NOT IN (4)
ORDER BY so.price ASC;

-- Plain Text: List all bilateral trades in the system, showing trade ID, initiator ID, receiver ID, status, and the resolution timestamp, displaying "STILL_PENDING" if the trade has not yet been resolved.
SELECT trade_id, initiator_id, receiver_id, status, created_at,
       COALESCE(CAST(resolved_at AS CHAR), 'STILL_PENDING') AS resolution_status
FROM trades
ORDER BY trade_id ASC;

-- Plain Text: Calculate system-wide summary metrics for all physical inventory items: total count of instantiated items, average durability, lowest durability, and peak durability across all player inventories.
SELECT 
    COUNT(*) AS total_inventory_items,
    ROUND(AVG(durability), 2) AS avg_fleet_durability,
    MIN(durability) AS lowest_durability,
    MAX(durability) AS peak_durability,
    SUM(CASE WHEN is_equipped = 1 THEN 1 ELSE 0 END) AS total_equipped_items
FROM inventories;

-- Plain Text: Group all catalog items by their equipment category and determine the number of blueprints in each category, along with the average base durability and the highest durability in that category.
SELECT 
    category,
    COUNT(*) AS total_blueprints,
    ROUND(AVG(base_durability), 1) AS avg_base_durability,
    MAX(base_durability) AS max_base_durability
FROM item_catalog
GROUP BY category
ORDER BY total_blueprints DESC, category ASC;

-- Plain Text: Find all item rarity tiers that have at least 2 distinct physical item instances instantiated in player inventories AND have an average durability strictly greater than 85%.
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

-- Plain Text: Display a complete inspection of all currently equipped loadout items, joining players, physical inventories, and item blueprints to show the operator username, blueprint name, rarity, category, and instance durability.
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

-- Plain Text: Retrieve all registered operators and their active market listings, including operators who currently have zero active listings on the Black Market (showing NULL for listing columns).
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

-- Plain Text: Show all item blueprint types defined in the catalog and any store offers currently offering that item type, ensuring blueprint archetypes that are not featured in the store are still preserved.
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

-- Plain Text: Compare active market listings selling the same currency denomination to identify price spreads where Listing A is priced lower than Listing B.
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

-- Plain Text: Retrieve all physical inventory item instances whose current durability is less than their catalog base durability by joining inventories with the item catalog.
SELECT 
    i.item_instance_id,
    i.player_id,
    c.item_name,
    c.rarity,
    i.durability,
    c.base_durability
FROM inventories i
JOIN item_catalog c ON i.item_type_id = c.item_type_id
WHERE i.durability < c.base_durability
ORDER BY i.durability DESC;

-- Plain Text: Retrieve all operators who possess a Combat Credits (currency #1) wallet balance that is greater than the average Combat Credits balance across all operators in the database.
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

-- Plain Text: Identify all operators who have NEVER created a market listing on the Black Market, using the NOT EXISTS clause.
SELECT p.player_id, p.username, p.email, p.status
FROM players p
WHERE NOT EXISTS (
    SELECT 1 
    FROM market_listings ml 
    WHERE ml.seller_id = p.player_id
)
ORDER BY p.player_id ASC;


-- Plain Text: Find all store offers priced in Combat Credits (currency #1) whose price is cheaper than ANY active marketplace listing denominated in Combat Credits.
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

-- Plain Text: Construct a consolidated operational log of all economic touchpoints in the system by taking the UNION of all sellers on the Black Market and all initiators of bilateral trades.
SELECT seller_id AS operator_id, 'MARKET_SELLER' AS activity_role, created_at AS event_timestamp
FROM market_listings
UNION
SELECT initiator_id AS operator_id, 'TRADE_INITIATOR' AS activity_role, created_at AS event_timestamp
FROM trades
ORDER BY event_timestamp DESC
LIMIT 8;

-- Plain Text: Retrieve all active rewards on the Luck Royale wheel along with their event name, spin cost, item name, rarity, base probability, and awarded count by joining wheel rewards, wheel events, and the item catalog.
SELECT 
    wr.reward_id,
    we.event_name,
    we.spin_cost,
    c.item_name,
    c.rarity,
    wr.base_probability,
    wr.max_supply,
    wr.awarded_count
FROM wheel_rewards wr
JOIN wheel_events we ON wr.event_id = we.event_id
JOIN item_catalog c ON wr.item_type_id = c.item_type_id
WHERE wr.is_active = 1
ORDER BY wr.display_order ASC;

-- Plain Text: Restore the durability of all equipped items to 100 for operators who have an "active" account status by joining inventories and players, followed by a verification query.
UPDATE inventories i
JOIN players p ON i.player_id = p.player_id
SET i.durability = 100
WHERE i.is_equipped = 1
  AND p.status = 'active';

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
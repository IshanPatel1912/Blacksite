

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

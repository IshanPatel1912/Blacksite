

-- Drop tables in reverse dependency order for clean recreation
DROP TABLE IF EXISTS wheel_spins CASCADE;
DROP TABLE IF EXISTS wheel_rewards CASCADE;
DROP TABLE IF EXISTS wheel_events CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS trade_currencies CASCADE;
DROP TABLE IF EXISTS trade_items CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS market_listings CASCADE;
DROP TABLE IF EXISTS store_offers CASCADE;
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS item_catalog CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- 1. PLAYERS
CREATE TABLE players (
    player_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CONSTRAINT chk_player_status CHECK (status IN ('active', 'suspended', 'offline', 'banned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CURRENCIES
CREATE TABLE currencies (
    currency_id SERIAL PRIMARY KEY,
    currency_name VARCHAR(50) NOT NULL UNIQUE,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    symbol VARCHAR(10) NOT NULL DEFAULT 'CR',
    description TEXT
);

-- 3. WALLETS
CREATE TABLE wallets (
    wallet_id SERIAL PRIMARY KEY,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    currency_id INT NOT NULL REFERENCES currencies(currency_id) ON DELETE RESTRICT,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00
        CONSTRAINT chk_wallet_balance CHECK (balance >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_player_currency UNIQUE (player_id, currency_id)
);

-- 4. ITEM CATALOG
CREATE TABLE item_catalog (
    item_type_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL UNIQUE,
    rarity VARCHAR(20) NOT NULL
        CONSTRAINT chk_item_rarity CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic')),
    is_tradable BOOLEAN NOT NULL DEFAULT TRUE,
    category VARCHAR(50) NOT NULL
        CONSTRAINT chk_item_category CHECK (category IN (
            'Assault Rifle', 'SMG', 'Sniper Rifle', 'Combat Helmet', 
            'Tactical Vest', 'Weapon Skin', 'Operator Skin', 
            'Supply Crate', 'Tactical Gear'
        )),
    base_durability INT NOT NULL DEFAULT 100
        CONSTRAINT chk_base_durability CHECK (base_durability BETWEEN 1 AND 100),
    description TEXT,
    asset_key VARCHAR(50) NOT NULL DEFAULT 'standard_gear'
);

-- 5. INVENTORIES (Item Instances)
CREATE TABLE inventories (
    item_instance_id SERIAL PRIMARY KEY,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    item_type_id INT NOT NULL REFERENCES item_catalog(item_type_id) ON DELETE RESTRICT,
    durability INT NOT NULL DEFAULT 100
        CONSTRAINT chk_instance_durability CHECK (durability BETWEEN 0 AND 100),
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. STORE OFFERS
CREATE TABLE store_offers (
    offer_id SERIAL PRIMARY KEY,
    item_type_id INT NOT NULL REFERENCES item_catalog(item_type_id) ON DELETE RESTRICT,
    currency_id INT NOT NULL REFERENCES currencies(currency_id) ON DELETE RESTRICT,
    price NUMERIC(15, 2) NOT NULL
        CONSTRAINT chk_offer_price CHECK (price >= 0),
    stock_limit INT NOT NULL
        CONSTRAINT chk_offer_stock_limit CHECK (stock_limit >= 0),
    stock_sold INT NOT NULL DEFAULT 0
        CONSTRAINT chk_offer_stock_sold CHECK (stock_sold >= 0 AND stock_sold <= stock_limit),
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CONSTRAINT chk_offer_status CHECK (status IN ('available', 'sold_out', 'expired', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. MARKET LISTINGS
CREATE TABLE market_listings (
    listing_id SERIAL PRIMARY KEY,
    seller_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    item_instance_id INT NOT NULL REFERENCES inventories(item_instance_id) ON DELETE RESTRICT,
    currency_id INT NOT NULL REFERENCES currencies(currency_id) ON DELETE RESTRICT,
    price NUMERIC(15, 2) NOT NULL
        CONSTRAINT chk_listing_price CHECK (price > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CONSTRAINT chk_listing_status CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. TRADES
CREATE TABLE trades (
    trade_id SERIAL PRIMARY KEY,
    initiator_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CONSTRAINT chk_trade_status CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    CONSTRAINT chk_trade_distinct_players CHECK (initiator_id <> receiver_id)
);

-- 9. TRADE ITEMS
CREATE TABLE trade_items (
    trade_item_id SERIAL PRIMARY KEY,
    trade_id INT NOT NULL REFERENCES trades(trade_id) ON DELETE CASCADE,
    item_instance_id INT NOT NULL REFERENCES inventories(item_instance_id) ON DELETE CASCADE,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    CONSTRAINT uq_trade_item_instance UNIQUE (trade_id, item_instance_id)
);

-- 10. TRADE CURRENCIES
CREATE TABLE trade_currencies (
    trade_currency_id SERIAL PRIMARY KEY,
    trade_id INT NOT NULL REFERENCES trades(trade_id) ON DELETE CASCADE,
    currency_id INT NOT NULL REFERENCES currencies(currency_id) ON DELETE RESTRICT,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL
        CONSTRAINT chk_trade_currency_amount CHECK (amount > 0),
    CONSTRAINT uq_trade_player_currency UNIQUE (trade_id, player_id, currency_id)
);

-- 11. AUDIT LOGS
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(player_id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. LUCK ROYALE EVENTS
CREATE TABLE wheel_events (
    event_id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    currency_id INT NOT NULL REFERENCES currencies(currency_id) ON DELETE RESTRICT,
    spin_cost NUMERIC(15, 2) NOT NULL DEFAULT 500.00 CHECK (spin_cost > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. LUCK ROYALE REWARDS (Configured Probabilities & Atomic Cap)
CREATE TABLE wheel_rewards (
    reward_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES wheel_events(event_id) ON DELETE CASCADE,
    item_type_id INT NOT NULL REFERENCES item_catalog(item_type_id) ON DELETE RESTRICT,
    base_probability NUMERIC(6, 4) NOT NULL CHECK (base_probability >= 0 AND base_probability <= 1),
    max_supply INT NULL CHECK (max_supply IS NULL OR max_supply >= 0),
    awarded_count INT NOT NULL DEFAULT 0 CHECK (awarded_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. LUCK ROYALE SPINS (Audit History & Idempotency)
CREATE TABLE wheel_spins (
    spin_id SERIAL PRIMARY KEY,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    reward_id INT NOT NULL REFERENCES wheel_rewards(reward_id) ON DELETE RESTRICT,
    item_instance_id INT NOT NULL REFERENCES inventories(item_instance_id) ON DELETE CASCADE,
    currency_id INT NOT NULL REFERENCES currencies(currency_id) ON DELETE RESTRICT,
    cost_paid NUMERIC(15, 2) NOT NULL CHECK (cost_paid >= 0),
    idempotency_key VARCHAR(64) NULL UNIQUE,
    spun_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

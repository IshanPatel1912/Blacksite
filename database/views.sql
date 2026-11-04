

-- 1. Detailed Player Inventory View
-- Combines item instances with catalog definitions and active market status
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
        WHEN ti.trade_item_id IS NOT NULL THEN 'IN_TRADE'
        ELSE 'AVAILABLE'
    END AS availability_status,
    ml.listing_id AS active_listing_id,
    ml.price AS listing_price
FROM inventories i
JOIN players p ON i.player_id = p.player_id
JOIN item_catalog c ON i.item_type_id = c.item_type_id
LEFT JOIN market_listings ml ON i.item_instance_id = ml.item_instance_id AND ml.status = 'active'
LEFT JOIN (
    SELECT DISTINCT item_instance_id, trade_item_id 
    FROM trade_items ti_sub
    JOIN trades t_sub ON ti_sub.trade_id = t_sub.trade_id
    WHERE t_sub.status = 'pending'
) ti ON i.item_instance_id = ti.item_instance_id;

-- 2. Active Marketplace Browse View
CREATE OR REPLACE VIEW v_active_market_listings AS
SELECT 
    ml.listing_id,
    ml.seller_id,
    p.username AS seller_username,
    i.item_instance_id,
    c.item_type_id,
    c.item_name,
    c.rarity,
    c.category,
    c.asset_key,
    i.durability,
    ml.price,
    cur.currency_id,
    cur.currency_name,
    cur.symbol AS currency_symbol,
    cur.is_premium,
    ml.created_at
FROM market_listings ml
JOIN players p ON ml.seller_id = p.player_id
JOIN inventories i ON ml.item_instance_id = i.item_instance_id
JOIN item_catalog c ON i.item_type_id = c.item_type_id
JOIN currencies cur ON ml.currency_id = cur.currency_id
WHERE ml.status = 'active';

-- 3. Store Catalog & Depot View
CREATE OR REPLACE VIEW v_active_store_offers AS
SELECT 
    so.offer_id,
    so.price,
    so.stock_limit,
    so.stock_sold,
    (so.stock_limit - so.stock_sold) AS remaining_stock,
    so.status,
    c.item_type_id,
    c.item_name,
    c.rarity,
    c.category,
    c.asset_key,
    c.description AS item_description,
    c.base_durability,
    cur.currency_id,
    cur.currency_name,
    cur.symbol AS currency_symbol,
    cur.is_premium
FROM store_offers so
JOIN item_catalog c ON so.item_type_id = c.item_type_id
JOIN currencies cur ON so.currency_id = cur.currency_id
WHERE so.status = 'available';

-- 4. Player Portfolio & Wealth Summary View
CREATE OR REPLACE VIEW v_player_portfolio_summary AS
SELECT 
    p.player_id,
    p.username,
    p.email,
    p.status AS player_status,
    COUNT(DISTINCT i.item_instance_id) AS total_items_owned,
    COUNT(DISTINCT ml.listing_id) AS active_listings_count,
    COALESCE(SUM(CASE WHEN cur.is_premium = FALSE THEN w.balance ELSE 0 END), 0) AS standard_credit_balance,
    COALESCE(SUM(CASE WHEN cur.is_premium = TRUE THEN w.balance ELSE 0 END), 0) AS premium_token_balance
FROM players p
LEFT JOIN inventories i ON p.player_id = i.player_id
LEFT JOIN market_listings ml ON p.player_id = ml.seller_id AND ml.status = 'active'
LEFT JOIN wallets w ON p.player_id = w.player_id
LEFT JOIN currencies cur ON w.currency_id = cur.currency_id
GROUP BY p.player_id, p.username, p.email, p.status;

-- 5. Materialized View: Market Economic Health & Statistics
-- Refresh command: REFRESH MATERIALIZED VIEW mv_market_economy_summary;
DROP MATERIALIZED VIEW IF EXISTS mv_market_economy_summary;
CREATE MATERIALIZED VIEW mv_market_economy_summary AS
SELECT 
    c.rarity,
    c.category,
    COUNT(ml.listing_id) AS total_listings,
    COUNT(CASE WHEN ml.status = 'sold' THEN 1 END) AS total_sold,
    ROUND(AVG(ml.price), 2) AS avg_listing_price,
    MIN(ml.price) AS min_price,
    MAX(ml.price) AS max_price,
    CURRENT_TIMESTAMP AS snapshot_time
FROM market_listings ml
JOIN inventories i ON ml.item_instance_id = i.item_instance_id
JOIN item_catalog c ON i.item_type_id = c.item_type_id
GROUP BY c.rarity, c.category;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_market_summary 
ON mv_market_economy_summary (rarity, category);

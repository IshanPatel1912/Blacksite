

-- Q1: Fetch complete player loadout with equipped status and catalog attributes
SELECT 
    i.item_instance_id,
    c.item_name,
    c.rarity,
    c.category,
    i.durability,
    i.is_equipped,
    c.is_tradable,
    i.acquired_at
FROM inventories i
JOIN item_catalog c ON i.item_type_id = c.item_type_id
WHERE i.player_id = 1
ORDER BY i.is_equipped DESC, c.rarity DESC;

-- Q2: Active market listings with seller credentials and price
SELECT 
    ml.listing_id,
    p.username AS seller_name,
    c.item_name,
    c.rarity,
    i.durability,
    ml.price,
    cur.symbol AS currency
FROM market_listings ml
JOIN players p ON ml.seller_id = p.player_id
JOIN inventories i ON ml.item_instance_id = i.item_instance_id
JOIN item_catalog c ON i.item_type_id = c.item_type_id
JOIN currencies cur ON ml.currency_id = cur.currency_id
WHERE ml.status = 'active'
ORDER BY ml.created_at DESC;

-- Q3: Pending incoming trades for player
SELECT 
    t.trade_id,
    p_init.username AS initiator_name,
    t.created_at,
    (SELECT COUNT(*) FROM trade_items WHERE trade_id = t.trade_id) AS items_in_trade,
    (SELECT COALESCE(SUM(amount), 0) FROM trade_currencies WHERE trade_id = t.trade_id) AS currency_offered
FROM trades t
JOIN players p_init ON t.initiator_id = p_init.player_id
WHERE t.receiver_id = 1 AND t.status = 'pending';

-- Q4: Armory supply depot offers with stock remaining
SELECT 
    so.offer_id,
    c.item_name,
    c.rarity,
    c.category,
    so.price,
    cur.symbol AS currency,
    (so.stock_limit - so.stock_sold) AS stock_remaining,
    so.status
FROM store_offers so
JOIN item_catalog c ON so.item_type_id = c.item_type_id
JOIN currencies cur ON so.currency_id = cur.currency_id
WHERE so.status = 'available'
ORDER BY so.price ASC;

-- Q5: Player audit trail for active session
SELECT 
    log_id,
    action_type,
    details,
    created_at
FROM audit_logs
WHERE player_id = 1
ORDER BY created_at DESC
LIMIT 10;


-- Function 1: Check Item Eligibility for Trade or Market Listing
CREATE OR REPLACE FUNCTION fn_check_item_eligibility(p_item_instance_id INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_tradable BOOLEAN;
    v_durability INT;
    v_is_listed BOOLEAN;
    v_is_in_trade BOOLEAN;
BEGIN
    -- Retrieve catalog tradability & current durability
    SELECT c.is_tradable, i.durability
    INTO v_tradable, v_durability
    FROM inventories i
    JOIN item_catalog c ON i.item_type_id = c.item_type_id
    WHERE i.item_instance_id = p_item_instance_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF NOT v_tradable OR v_durability <= 0 THEN
        RETURN FALSE;
    END IF;

    -- Check active market listing
    SELECT EXISTS(
        SELECT 1 FROM market_listings 
        WHERE item_instance_id = p_item_instance_id AND status = 'active'
    ) INTO v_is_listed;

    IF v_is_listed THEN
        RETURN FALSE;
    END IF;

    -- Check pending trade
    SELECT EXISTS(
        SELECT 1 FROM trade_items ti
        JOIN trades t ON ti.trade_id = t.trade_id
        WHERE ti.item_instance_id = p_item_instance_id AND t.status = 'pending'
    ) INTO v_is_in_trade;

    IF v_is_in_trade THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Calculate Player Combined Wealth In Specific Currency
CREATE OR REPLACE FUNCTION fn_get_player_balance(p_player_id INT, p_currency_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_bal NUMERIC(15, 2);
BEGIN
    SELECT COALESCE(balance, 0.00) INTO v_bal
    FROM wallets
    WHERE player_id = p_player_id AND currency_id = p_currency_id;
    
    RETURN COALESCE(v_bal, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Function 3: Refresh Market Materialized View
CREATE OR REPLACE FUNCTION fn_refresh_market_analytics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_market_economy_summary;
EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW mv_market_economy_summary;
END;
$$ LANGUAGE plpgsql;

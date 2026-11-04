

-- Procedure 1: Purchase Store Offer (ACID Atomic Purchase)
CREATE OR REPLACE PROCEDURE sp_purchase_store_offer(
    IN p_player_id INT,
    IN p_offer_id INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_new_instance_id INT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_item_type_id INT;
    v_currency_id INT;
    v_price NUMERIC(15, 2);
    v_stock_limit INT;
    v_stock_sold INT;
    v_offer_status VARCHAR(20);
    v_wallet_id INT;
    v_balance NUMERIC(15, 2);
    v_item_name VARCHAR(100);
BEGIN
    p_success := FALSE;
    p_message := '';
    p_new_instance_id := NULL;

    -- 1. Lock store offer row
    SELECT so.item_type_id, so.currency_id, so.price, so.stock_limit, so.stock_sold, so.status, c.item_name
    INTO v_item_type_id, v_currency_id, v_price, v_stock_limit, v_stock_sold, v_offer_status, v_item_name
    FROM store_offers so
    JOIN item_catalog c ON so.item_type_id = c.item_type_id
    WHERE so.offer_id = p_offer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        p_message := 'Store offer does not exist.';
        RETURN;
    END IF;

    IF v_offer_status <> 'available' OR v_stock_sold >= v_stock_limit THEN
        p_message := 'Store offer is no longer available or out of stock.';
        RETURN;
    END IF;

    -- 2. Lock player wallet for required currency
    SELECT wallet_id, balance
    INTO v_wallet_id, v_balance
    FROM wallets
    WHERE player_id = p_player_id AND currency_id = v_currency_id
    FOR UPDATE;

    IF NOT FOUND THEN
        p_message := 'Player has no wallet denominated in the required currency.';
        RETURN;
    END IF;

    IF v_balance < v_price THEN
        p_message := 'Insufficient funds in player wallet.';
        RETURN;
    END IF;

    -- 3. Deduct currency balance
    UPDATE wallets
    SET balance = balance - v_price,
        updated_at = CURRENT_TIMESTAMP
    WHERE wallet_id = v_wallet_id;

    -- 4. Update stock and offer status
    UPDATE store_offers
    SET stock_sold = stock_sold + 1,
        status = CASE WHEN (stock_sold + 1) >= stock_limit THEN 'sold_out' ELSE 'available' END
    WHERE offer_id = p_offer_id;

    -- 5. Instantiate new inventory item
    INSERT INTO inventories (player_id, item_type_id, durability, acquired_at)
    VALUES (p_player_id, v_item_type_id, 100, CURRENT_TIMESTAMP)
    RETURNING item_instance_id INTO p_new_instance_id;

    -- 6. Write immutable audit log
    INSERT INTO audit_logs (player_id, action_type, details)
    VALUES (
        p_player_id,
        'STORE_PURCHASE',
        format('Purchased offer #%s (%s) for %s currency units. Generated item instance #%s.',
               p_offer_id, v_item_name, v_price, p_new_instance_id)
    );

    p_success := TRUE;
    p_message := format('Successfully acquired %s.', v_item_name);
END;
$$;


-- Procedure 2: Buy Marketplace Listing (Atomic Transfer)
CREATE OR REPLACE PROCEDURE sp_buy_marketplace_listing(
    IN p_buyer_id INT,
    IN p_listing_id INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_seller_id INT;
    v_item_instance_id INT;
    v_currency_id INT;
    v_price NUMERIC(15, 2);
    v_listing_status VARCHAR(20);
    v_buyer_wallet_id INT;
    v_buyer_balance NUMERIC(15, 2);
    v_seller_wallet_id INT;
    v_item_name VARCHAR(100);
BEGIN
    p_success := FALSE;
    p_message := '';

    -- 1. Lock listing row
    SELECT ml.seller_id, ml.item_instance_id, ml.currency_id, ml.price, ml.status, c.item_name
    INTO v_seller_id, v_item_instance_id, v_currency_id, v_price, v_listing_status, v_item_name
    FROM market_listings ml
    JOIN inventories i ON ml.item_instance_id = i.item_instance_id
    JOIN item_catalog c ON i.item_type_id = c.item_type_id
    WHERE ml.listing_id = p_listing_id
    FOR UPDATE;

    IF NOT FOUND THEN
        p_message := 'Marketplace listing not found.';
        RETURN;
    END IF;

    IF v_listing_status <> 'active' THEN
        p_message := 'Listing is no longer active.';
        RETURN;
    END IF;

    IF v_seller_id = p_buyer_id THEN
        p_message := 'Operator cannot purchase their own market listing.';
        RETURN;
    END IF;

    -- 2. Lock buyer and seller wallets in deterministic order to avoid deadlocks
    IF p_buyer_id < v_seller_id THEN
        SELECT wallet_id, balance INTO v_buyer_wallet_id, v_buyer_balance
        FROM wallets WHERE player_id = p_buyer_id AND currency_id = v_currency_id FOR UPDATE;

        SELECT wallet_id INTO v_seller_wallet_id
        FROM wallets WHERE player_id = v_seller_id AND currency_id = v_currency_id FOR UPDATE;
    ELSE
        SELECT wallet_id INTO v_seller_wallet_id
        FROM wallets WHERE player_id = v_seller_id AND currency_id = v_currency_id FOR UPDATE;

        SELECT wallet_id, balance INTO v_buyer_wallet_id, v_buyer_balance
        FROM wallets WHERE player_id = p_buyer_id AND currency_id = v_currency_id FOR UPDATE;
    END IF;

    IF v_buyer_wallet_id IS NULL THEN
        p_message := 'Buyer does not have a wallet for this currency.';
        RETURN;
    END IF;

    IF v_buyer_balance < v_price THEN
        p_message := 'Insufficient funds to purchase listing.';
        RETURN;
    END IF;

    -- 3. Execute balance transfer
    UPDATE wallets SET balance = balance - v_price, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = v_buyer_wallet_id;
    UPDATE wallets SET balance = balance + v_price, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = v_seller_wallet_id;

    -- 4. Reassign inventory instance ownership
    UPDATE inventories SET player_id = p_buyer_id WHERE item_instance_id = v_item_instance_id;

    -- 5. Mark listing as sold
    UPDATE market_listings SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE listing_id = p_listing_id;

    -- 6. Log audit entry
    INSERT INTO audit_logs (player_id, action_type, details)
    VALUES (
        p_buyer_id,
        'MARKET_PURCHASE',
        format('Player %s purchased %s (Item #%s) from Player %s for %s currency units via Listing #%s.',
               p_buyer_id, v_item_name, v_item_instance_id, v_seller_id, v_price, p_listing_id)
    );

    p_success := TRUE;
    p_message := format('Successfully purchased %s from marketplace.', v_item_name);
END;
$$;


-- Procedure 3: Accept Bilateral Trade
CREATE OR REPLACE PROCEDURE sp_accept_trade(
    IN p_trade_id INT,
    IN p_acceptor_id INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_initiator_id INT;
    v_receiver_id INT;
    v_status VARCHAR(20);
    rec_item RECORD;
    rec_curr RECORD;
    v_sender_wallet INT;
    v_target_wallet INT;
    v_sender_bal NUMERIC(15, 2);
    v_target_player INT;
BEGIN
    p_success := FALSE;
    p_message := '';

    -- 1. Lock trade row
    SELECT initiator_id, receiver_id, status
    INTO v_initiator_id, v_receiver_id, v_status
    FROM trades
    WHERE trade_id = p_trade_id
    FOR UPDATE;

    IF NOT FOUND THEN
        p_message := 'Trade not found.';
        RETURN;
    END IF;

    IF v_status <> 'pending' THEN
        p_message := 'Trade is not in pending status.';
        RETURN;
    END IF;

    IF p_acceptor_id <> v_receiver_id THEN
        p_message := 'Only the designated receiver can accept this trade.';
        RETURN;
    END IF;

    -- 2. Verify all offered items currently belong to the offering player and are not listed
    FOR rec_item IN (SELECT ti.item_instance_id, ti.player_id, i.player_id AS current_owner
                     FROM trade_items ti
                     JOIN inventories i ON ti.item_instance_id = i.item_instance_id
                     WHERE ti.trade_id = p_trade_id
                     FOR UPDATE OF i)
    LOOP
        IF rec_item.player_id <> rec_item.current_owner THEN
            p_message := 'One or more items in the trade are no longer owned by the offering player.';
            RETURN;
        END IF;

        IF EXISTS(SELECT 1 FROM market_listings WHERE item_instance_id = rec_item.item_instance_id AND status = 'active') THEN
            p_message := 'An item in this trade is currently listed on the marketplace.';
            RETURN;
        END IF;
    END LOOP;

    -- 3. Verify all offered currencies are available
    FOR rec_curr IN (SELECT currency_id, player_id, amount FROM trade_currencies WHERE trade_id = p_trade_id)
    LOOP
        SELECT balance INTO v_sender_bal
        FROM wallets
        WHERE player_id = rec_curr.player_id AND currency_id = rec_curr.currency_id
        FOR UPDATE;

        IF v_sender_bal IS NULL OR v_sender_bal < rec_curr.amount THEN
            p_message := 'Insufficient funds for pledged trade currency.';
            RETURN;
        END IF;
    END LOOP;

    -- 4. Transfer items: if player_id was initiator, give to receiver; if receiver, give to initiator
    FOR rec_item IN (SELECT item_instance_id, player_id FROM trade_items WHERE trade_id = p_trade_id)
    LOOP
        IF rec_item.player_id = v_initiator_id THEN
            UPDATE inventories SET player_id = v_receiver_id WHERE item_instance_id = rec_item.item_instance_id;
        ELSE
            UPDATE inventories SET player_id = v_initiator_id WHERE item_instance_id = rec_item.item_instance_id;
        END IF;
    END LOOP;

    -- 5. Transfer currencies
    FOR rec_curr IN (SELECT currency_id, player_id, amount FROM trade_currencies WHERE trade_id = p_trade_id)
    LOOP
        IF rec_curr.player_id = v_initiator_id THEN
            v_target_player := v_receiver_id;
        ELSE
            v_target_player := v_initiator_id;
        END IF;

        UPDATE wallets SET balance = balance - rec_curr.amount, updated_at = CURRENT_TIMESTAMP
        WHERE player_id = rec_curr.player_id AND currency_id = rec_curr.currency_id;

        UPDATE wallets SET balance = balance + rec_curr.amount, updated_at = CURRENT_TIMESTAMP
        WHERE player_id = v_target_player AND currency_id = rec_curr.currency_id;
    END LOOP;

    -- 6. Mark trade accepted
    UPDATE trades SET status = 'accepted', resolved_at = CURRENT_TIMESTAMP WHERE trade_id = p_trade_id;

    -- 7. Audit log
    INSERT INTO audit_logs (player_id, action_type, details)
    VALUES (
        p_acceptor_id,
        'TRADE_ACCEPTED',
        format('Trade #%s between Player %s and Player %s successfully executed.',
               p_trade_id, v_initiator_id, v_receiver_id)
    );

    p_success := TRUE;
    p_message := 'Trade executed successfully.';
END;
$$;

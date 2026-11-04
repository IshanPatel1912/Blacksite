

-- Trigger Function 1: Ensure Item Is Not Listed While Broken or Non-Tradable
CREATE OR REPLACE FUNCTION fn_trg_check_market_listing_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    v_tradable BOOLEAN;
    v_durability INT;
    v_owner INT;
BEGIN
    SELECT i.player_id, i.durability, c.is_tradable
    INTO v_owner, v_durability, v_tradable
    FROM inventories i
    JOIN item_catalog c ON i.item_type_id = c.item_type_id
    WHERE i.item_instance_id = NEW.item_instance_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item instance % not found.', NEW.item_instance_id;
    END IF;

    IF v_owner <> NEW.seller_id THEN
        RAISE EXCEPTION 'Player % does not own item instance %.', NEW.seller_id, NEW.item_instance_id;
    END IF;

    IF NOT v_tradable THEN
        RAISE EXCEPTION 'Item instance % is flagged non-tradable.', NEW.item_instance_id;
    END IF;

    IF v_durability <= 0 THEN
        RAISE EXCEPTION 'Item instance % has 0 durability and cannot be listed.', NEW.item_instance_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verify_listing_eligibility ON market_listings;
CREATE TRIGGER trg_verify_listing_eligibility
BEFORE INSERT ON market_listings
FOR EACH ROW
EXECUTE FUNCTION fn_trg_check_market_listing_eligibility();


-- Trigger Function 2: Automated Audit Logging for Wallet Mutations
CREATE OR REPLACE FUNCTION fn_trg_audit_wallet_mutation()
RETURNS TRIGGER AS $$
DECLARE
    v_diff NUMERIC(15, 2);
    v_curr_name VARCHAR(50);
BEGIN
    v_diff := NEW.balance - OLD.balance;
    IF v_diff <> 0 THEN
        SELECT currency_name INTO v_curr_name FROM currencies WHERE currency_id = NEW.currency_id;
        
        INSERT INTO audit_logs (player_id, action_type, details)
        VALUES (
            NEW.player_id,
            'WALLET_BALANCE_UPDATE',
            format('Wallet #%s balance changed from %s to %s (%s%s %s).',
                   NEW.wallet_id, OLD.balance, NEW.balance,
                   CASE WHEN v_diff > 0 THEN '+' ELSE '' END, v_diff, COALESCE(v_curr_name, 'currency'))
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_wallet ON wallets;
CREATE TRIGGER trg_audit_wallet
AFTER UPDATE OF balance ON wallets
FOR EACH ROW
EXECUTE FUNCTION fn_trg_audit_wallet_mutation();


-- Trigger Function 3: Auto-update Timestamps
CREATE OR REPLACE FUNCTION fn_trg_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_market_listings_timestamp ON market_listings;
CREATE TRIGGER trg_market_listings_timestamp
BEFORE UPDATE ON market_listings
FOR EACH ROW
EXECUTE FUNCTION fn_trg_update_timestamp();

DROP TRIGGER IF EXISTS trg_wallets_timestamp ON wallets;
CREATE TRIGGER trg_wallets_timestamp
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION fn_trg_update_timestamp();

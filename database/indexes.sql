

-- Foreign Key & Join Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_player ON wallets(player_id);
CREATE INDEX IF NOT EXISTS idx_wallets_currency ON wallets(currency_id);

CREATE INDEX IF NOT EXISTS idx_inventories_player ON inventories(player_id);
CREATE INDEX IF NOT EXISTS idx_inventories_item_type ON inventories(item_type_id);

CREATE INDEX IF NOT EXISTS idx_store_offers_item_type ON store_offers(item_type_id);
CREATE INDEX IF NOT EXISTS idx_store_offers_status ON store_offers(status);

CREATE INDEX IF NOT EXISTS idx_market_listings_seller ON market_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_item ON market_listings(item_instance_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_status ON market_listings(status);
CREATE INDEX IF NOT EXISTS idx_market_listings_price ON market_listings(price);

-- Partial Unique Index: Prevent multiple concurrent active listings for the same inventory instance
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_item_listing 
ON market_listings (item_instance_id) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_trades_initiator ON trades(initiator_id);
CREATE INDEX IF NOT EXISTS idx_trades_receiver ON trades(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

CREATE INDEX IF NOT EXISTS idx_trade_items_trade ON trade_items(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_currencies_trade ON trade_currencies(trade_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_player ON audit_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Text search / Catalog lookup
CREATE INDEX IF NOT EXISTS idx_catalog_rarity ON item_catalog(rarity);
CREATE INDEX IF NOT EXISTS idx_catalog_category ON item_catalog(category);

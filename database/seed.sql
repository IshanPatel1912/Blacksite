

-- Clean existing data
TRUNCATE TABLE audit_logs, trade_currencies, trade_items, trades, 
               market_listings, store_offers, inventories, item_catalog, 
               wallets, currencies, players RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------------------
-- 1. PLAYERS (8 Operators)
-- ----------------------------------------------------------------------------
INSERT INTO players (player_id, username, email, status, created_at) VALUES
(1, 'GHOST_ACTUAL',   'ghost@blacksite.mil',   'active',    '2026-01-10 08:00:00Z'),
(2, 'VIPER_SEVEN',    'viper@blacksite.mil',   'active',    '2026-01-12 10:15:00Z'),
(3, 'SHADOW_LEAD',    'shadow@blacksite.mil',  'active',    '2026-01-15 14:30:00Z'),
(4, 'VALKYRIE_TAC',   'valk@blacksite.mil',    'active',    '2026-01-18 09:20:00Z'),
(5, 'NOMAD_SNIPER',   'nomad@blacksite.mil',   'active',    '2026-01-20 16:45:00Z'),
(6, 'TITAN_HEAVY',    'titan@blacksite.mil',   'active',    '2026-01-22 11:10:00Z'),
(7, 'RECON_SPECTRE',  'recon@blacksite.mil',   'suspended', '2026-01-25 12:00:00Z'),
(8, 'CYPHER_BREACH',  'cypher@blacksite.mil',  'active',    '2026-02-01 17:05:00Z');

-- Reset player sequence
SELECT setval('players_player_id_seq', (SELECT MAX(player_id) FROM players));

-- ----------------------------------------------------------------------------
-- 2. CURRENCIES (4 Denominations: Standard vs Premium)
-- ----------------------------------------------------------------------------
INSERT INTO currencies (currency_id, currency_name, is_premium, symbol, description) VALUES
(1, 'Combat Credits',    FALSE, 'CR',   'Standard tactical military operational currency awarded for combat missions.'),
(2, 'Blacksite Tokens',   TRUE,  'BST',  'Encrypted elite tier tokens used for black-market prototypes and armory drops.'),
(3, 'War Bonds',          FALSE, 'WB',   'Standard veteran service scrip redeemable at tactical supply depots.'),
(4, 'Crypto-Scrip',       TRUE,  'CSP',  'High-security anonymous digital currency for high-stakes marketplace trade.');

SELECT setval('currencies_currency_id_seq', (SELECT MAX(currency_id) FROM currencies));

-- ----------------------------------------------------------------------------
-- 3. WALLETS (Player Accounts across Currencies: 8 x 2 = 16 Wallets)
-- ----------------------------------------------------------------------------
INSERT INTO wallets (wallet_id, player_id, currency_id, balance, updated_at) VALUES
(1,  1, 1, 45200.00, CURRENT_TIMESTAMP), -- Ghost: Combat Credits
(2,  1, 2,  1850.00, CURRENT_TIMESTAMP), -- Ghost: Blacksite Tokens
(3,  2, 1, 31400.00, CURRENT_TIMESTAMP), -- Viper: Combat Credits
(4,  2, 2,  2400.00, CURRENT_TIMESTAMP), -- Viper: Blacksite Tokens
(5,  3, 1, 12800.00, CURRENT_TIMESTAMP), -- Shadow: Combat Credits
(6,  3, 2,   650.00, CURRENT_TIMESTAMP), -- Shadow: Blacksite Tokens
(7,  4, 1, 89500.00, CURRENT_TIMESTAMP), -- Valkyrie: Combat Credits
(8,  4, 2,  5200.00, CURRENT_TIMESTAMP), -- Valkyrie: Blacksite Tokens
(9,  5, 1,  7600.00, CURRENT_TIMESTAMP), -- Nomad: Combat Credits
(10, 5, 2,   300.00, CURRENT_TIMESTAMP), -- Nomad: Blacksite Tokens
(11, 6, 1, 54000.00, CURRENT_TIMESTAMP), -- Titan: Combat Credits
(12, 6, 2,  1100.00, CURRENT_TIMESTAMP), -- Titan: Blacksite Tokens
(13, 7, 1,  1200.00, CURRENT_TIMESTAMP), -- Recon: Combat Credits
(14, 7, 2,    50.00, CURRENT_TIMESTAMP), -- Recon: Blacksite Tokens
(15, 8, 1, 26700.00, CURRENT_TIMESTAMP), -- Cypher: Combat Credits
(16, 8, 2,  3350.00, CURRENT_TIMESTAMP); -- Cypher: Blacksite Tokens

SELECT setval('wallets_wallet_id_seq', (SELECT MAX(wallet_id) FROM wallets));

-- ----------------------------------------------------------------------------
-- 4. ITEM CATALOG (16 Tactical Weapon, Gear, and Cosmetic Archetypes)
-- ----------------------------------------------------------------------------
INSERT INTO item_catalog (item_type_id, item_name, rarity, is_tradable, category, base_durability, description, asset_key) VALUES
(1,  'Phantom Circuit', 'Legendary', TRUE,  'Assault Rifle', 100, 'M4A1 composite frame coated with electromagnetic heat-sink circuit patterns.', 'rifle_phantom'),
(2,  'Nightwatch',      'Epic',      TRUE,  'Operator Skin', 100, 'Night-recon balaclava and stealth ghillie rig with silenced tactical webbing.', 'skin_nightwatch'),
(3,  'Obsidian Vector',  'Mythic',    TRUE,  'SMG',           100, 'Compact high-fire-rate SMG milled from volcanic obsidian polymer with gold-plated bolt.', 'smg_vector'),
(4,  'Ghost Protocol',  'Rare',      TRUE,  'Combat Helmet',  95, 'Ballistic carbon-weave helmet fitted with quad-nod NVG brackets.', 'helmet_ghost'),
(5,  'Ironclad',        'Epic',      TRUE,  'Tactical Vest',  90, 'Ceramic level-IV multi-strike plate carrier with MOLLE quick-release buckles.', 'vest_ironclad'),
(6,  'Redline Spectre', 'Legendary', TRUE,  'Weapon Skin',   100, 'Matte gunmetal finish accented with aggressive crimson telemetry stripes.', 'skin_redline'),
(7,  'Recon Pulse',     'Uncommon',  TRUE,  'Tactical Gear',  85, 'Handheld RF wide-band scanner for identifying hostile comm relays.', 'gear_pulse'),
(8,  'Blackout Cache',  'Rare',      TRUE,  'Supply Crate',  100, 'Mil-spec sealed munitions crate containing classified prototype weapon blueprints.', 'crate_blackout'),
(9,  'Vanguard M24',    'Rare',      TRUE,  'Sniper Rifle',   90, 'Precision bolt-action 7.62mm chassis optimized for extreme range neutralization.', 'sniper_vanguard'),
(10, 'Apex Viper',      'Epic',      TRUE,  'Assault Rifle',  95, 'Gas-piston bullpup carbine tuned for rapid target transition.', 'rifle_apex'),
(11, 'Shadow Walker',   'Common',    TRUE,  'Tactical Gear',  80, 'Low-signature acoustic dampening boots with reinforced steel shanks.', 'gear_boots'),
(12, 'Aegis Sentinel',  'Rare',      TRUE,  'Tactical Vest',  85, 'Lightweight patrol vest with integrated hydration pack and ammo chest rig.', 'vest_aegis'),
(13, 'Cryo Shock',      'Mythic',    TRUE,  'Weapon Skin',   100, 'Superconducting liquid-nitrogen pulse chamber visual effect skin.', 'skin_cryo'),
(14, 'SpecOps Breacher', 'Common',    TRUE,  'Combat Helmet',  75, 'Standard issue fast-cut ballistic helmet with ear protection rails.', 'helmet_standard'),
(15, 'Havoc Carbine',   'Uncommon',  TRUE,  'SMG',            85, 'Close-quarters compact SMG with side-folding skeleton stock.', 'smg_havoc'),
(16, 'Founder Token',    'Legendary', FALSE, 'Tactical Gear', 100, 'Honorary non-tradable service commendation awarded to elite alpha testers.', 'gear_medal'),
(17, 'Phantom Prototype', 'Mythic',   TRUE,  'Assault Rifle', 100, 'Experimental classified assault rifle prototype with superconducting electromagnetic coils. Ultra-limited Black Market drop.', 'rifle_phantom');

SELECT setval('item_catalog_item_type_id_seq', (SELECT MAX(item_type_id) FROM item_catalog));

-- ----------------------------------------------------------------------------
-- 5. INVENTORIES (Item Instances: 24 Instances with Varied Durability)
-- ----------------------------------------------------------------------------
INSERT INTO inventories (item_instance_id, player_id, item_type_id, durability, is_equipped, acquired_at) VALUES
-- Ghost's loadout (player 1)
(1,  1, 1,  98, TRUE,  '2026-02-01 10:00:00Z'), -- Phantom Circuit (Equipped)
(2,  1, 2, 100, TRUE,  '2026-02-01 10:05:00Z'), -- Nightwatch (Equipped)
(3,  1, 4,  92, TRUE,  '2026-02-02 11:30:00Z'), -- Ghost Protocol (Equipped)
(4,  1, 5,  88, TRUE,  '2026-02-02 11:35:00Z'), -- Ironclad (Equipped)
(5,  1, 6, 100, FALSE, '2026-02-03 14:00:00Z'), -- Redline Spectre
(6,  1, 8, 100, FALSE, '2026-02-05 09:15:00Z'), -- Blackout Cache
(7,  1, 16, 100, FALSE, '2026-01-10 08:00:00Z'), -- Founder Token (Non-tradable)

-- Viper's loadout (player 2)
(8,  2, 3, 100, TRUE,  '2026-02-04 15:20:00Z'), -- Obsidian Vector (Equipped)
(9,  2, 4,  84, TRUE,  '2026-02-04 15:25:00Z'), -- Ghost Protocol (Equipped)
(10, 2, 5,  94, TRUE,  '2026-02-04 15:30:00Z'), -- Ironclad (Equipped)
(11, 2, 7,  78, FALSE, '2026-02-06 18:40:00Z'), -- Recon Pulse
(12, 2, 1, 100, FALSE, '2026-02-07 12:10:00Z'), -- Phantom Circuit (Duplicate for sale)

-- Shadow's loadout (player 3)
(13, 3, 9,  91, TRUE,  '2026-02-08 08:30:00Z'), -- Vanguard M24 (Equipped)
(14, 3, 12, 85, TRUE,  '2026-02-08 08:35:00Z'), -- Aegis Sentinel (Equipped)
(15, 3, 10, 96, FALSE, '2026-02-09 13:45:00Z'), -- Apex Viper

-- Valkyrie's loadout (player 4)
(16, 4, 13, 100, TRUE, '2026-02-10 16:00:00Z'), -- Cryo Shock (Equipped)
(17, 4, 3,  100, FALSE, '2026-02-11 11:20:00Z'), -- Obsidian Vector (Extra)
(18, 4, 8,  100, FALSE, '2026-02-12 14:10:00Z'), -- Blackout Cache

-- Nomad's loadout (player 5)
(19, 5, 9,  87, TRUE,  '2026-02-13 17:00:00Z'), -- Vanguard M24 (Equipped)
(20, 5, 11, 65, FALSE, '2026-02-14 10:15:00Z'), -- Shadow Walker
(21, 5, 15, 82, FALSE, '2026-02-15 12:40:00Z'), -- Havoc Carbine

-- Titan's loadout (player 6)
(22, 6, 5,  79, TRUE,  '2026-02-16 19:20:00Z'), -- Ironclad (Equipped)
(23, 6, 14, 70, TRUE,  '2026-02-16 19:25:00Z'), -- SpecOps Breacher (Equipped)
(24, 6, 1,  95, FALSE, '2026-02-17 15:50:00Z'); -- Phantom Circuit

SELECT setval('inventories_item_instance_id_seq', (SELECT MAX(item_instance_id) FROM inventories));

-- ----------------------------------------------------------------------------
-- 6. STORE OFFERS (10 Curated Armory Drops)
-- ----------------------------------------------------------------------------
INSERT INTO store_offers (offer_id, item_type_id, currency_id, price, stock_limit, stock_sold, status, created_at) VALUES
(1,  1,  1, 15000.00,  50, 18, 'available', '2026-02-01 00:00:00Z'), -- Phantom Circuit (Credits)
(2,  2,  2,   750.00,  30, 14, 'available', '2026-02-01 00:00:00Z'), -- Nightwatch (Tokens)
(3,  3,  2,  1800.00,  15, 12, 'available', '2026-02-01 00:00:00Z'), -- Obsidian Vector (Tokens)
(4,  4,  1,  6500.00, 100, 42, 'available', '2026-02-02 00:00:00Z'), -- Ghost Protocol (Credits)
(5,  5,  1,  9500.00,  80, 31, 'available', '2026-02-02 00:00:00Z'), -- Ironclad (Credits)
(6,  6,  2,   600.00,  40, 20, 'available', '2026-02-03 00:00:00Z'), -- Redline Spectre (Tokens)
(7,  7,  1,  3200.00,  60, 15, 'available', '2026-02-03 00:00:00Z'), -- Recon Pulse (Credits)
(8,  8,  1,  4500.00, 150, 95, 'available', '2026-02-04 00:00:00Z'), -- Blackout Cache (Credits)
(9,  13, 2,  2500.00,  10, 10, 'sold_out',  '2026-02-05 00:00:00Z'), -- Cryo Shock (Sold Out)
(10, 10, 1,  8000.00,  25,  4, 'available', '2026-02-06 00:00:00Z'); -- Apex Viper (Credits)

SELECT setval('store_offers_offer_id_seq', (SELECT MAX(offer_id) FROM store_offers));

-- ----------------------------------------------------------------------------
-- 7. MARKET LISTINGS (10 Listings: Active, Sold, Cancelled)
-- ----------------------------------------------------------------------------
INSERT INTO market_listings (listing_id, seller_id, item_instance_id, currency_id, price, status, created_at, updated_at) VALUES
(1, 1, 5,  1, 18500.00, 'active',    '2026-02-18 10:00:00Z', '2026-02-18 10:00:00Z'), -- Ghost sells Redline Spectre
(2, 2, 11, 1,  2800.00, 'active',    '2026-02-18 11:30:00Z', '2026-02-18 11:30:00Z'), -- Viper sells Recon Pulse
(3, 2, 12, 2,   850.00, 'active',    '2026-02-18 12:15:00Z', '2026-02-18 12:15:00Z'), -- Viper sells Phantom Circuit
(4, 4, 17, 2,  2100.00, 'active',    '2026-02-19 14:00:00Z', '2026-02-19 14:00:00Z'), -- Valkyrie sells Obsidian Vector
(5, 5, 20, 1,  1100.00, 'active',    '2026-02-19 15:45:00Z', '2026-02-19 15:45:00Z'), -- Nomad sells Shadow Walker
(6, 5, 21, 1,  2400.00, 'active',    '2026-02-20 09:10:00Z', '2026-02-20 09:10:00Z'), -- Nomad sells Havoc Carbine
(7, 6, 24, 1, 14200.00, 'active',    '2026-02-20 16:20:00Z', '2026-02-20 16:20:00Z'), -- Titan sells Phantom Circuit
(8, 3, 15, 1,  7500.00, 'sold',      '2026-02-15 09:00:00Z', '2026-02-16 11:00:00Z'), -- Past sold listing
(9, 4, 18, 1,  4800.00, 'cancelled', '2026-02-17 13:00:00Z', '2026-02-17 14:00:00Z'), -- Cancelled listing
(10, 1, 6, 1,  4900.00, 'sold',      '2026-02-14 10:00:00Z', '2026-02-15 15:30:00Z'); -- Past sold cache

SELECT setval('market_listings_listing_id_seq', (SELECT MAX(listing_id) FROM market_listings));

-- ----------------------------------------------------------------------------
-- 8. TRADES (6 Trades: Pending, Accepted, Declined)
-- ----------------------------------------------------------------------------
INSERT INTO trades (trade_id, initiator_id, receiver_id, status, created_at, resolved_at) VALUES
(1, 1, 2, 'pending',   '2026-02-21 14:00:00Z', NULL),
(2, 2, 3, 'pending',   '2026-02-21 16:30:00Z', NULL),
(3, 4, 1, 'accepted',  '2026-02-15 10:00:00Z', '2026-02-15 10:45:00Z'),
(4, 5, 6, 'declined',  '2026-02-16 11:20:00Z', '2026-02-16 12:00:00Z'),
(5, 6, 1, 'cancelled', '2026-02-17 08:30:00Z', '2026-02-17 09:00:00Z'),
(6, 3, 4, 'accepted',  '2026-02-18 17:10:00Z', '2026-02-18 18:00:00Z');

SELECT setval('trades_trade_id_seq', (SELECT MAX(trade_id) FROM trades));

-- ----------------------------------------------------------------------------
-- 9. TRADE ITEMS (8 Item Bindings for Bilateral Trades)
-- ----------------------------------------------------------------------------
INSERT INTO trade_items (trade_item_id, trade_id, item_instance_id, player_id) VALUES
(1, 1, 6,  1), -- Ghost offers Blackout Cache
(2, 2, 11, 2), -- Viper offers Recon Pulse
(3, 3, 16, 4), -- Valkyrie offered Cryo Shock in past trade
(4, 3, 1,  1), -- Ghost offered Phantom Circuit
(5, 4, 20, 5), -- Nomad offered Shadow Walker
(6, 4, 23, 6), -- Titan offered SpecOps Breacher
(7, 5, 24, 6), -- Titan offered Phantom Circuit
(8, 6, 14, 3); -- Shadow offered Aegis Sentinel

SELECT setval('trade_items_trade_item_id_seq', (SELECT MAX(trade_item_id) FROM trade_items));

-- ----------------------------------------------------------------------------
-- 10. TRADE CURRENCIES (6 Currency Offerings)
-- ----------------------------------------------------------------------------
INSERT INTO trade_currencies (trade_currency_id, trade_id, currency_id, player_id, amount) VALUES
(1, 1, 1, 1, 2500.00), -- Ghost offers 2,500 Credits
(2, 1, 2, 2,  150.00), -- Viper counter-offers 150 Tokens
(3, 2, 1, 2, 1000.00), -- Viper offers 1,000 Credits
(4, 3, 2, 4,  500.00), -- Valkyrie offered 500 Tokens in past trade
(5, 4, 1, 5,  500.00), -- Nomad offered 500 Credits
(6, 6, 1, 4, 3000.00); -- Valkyrie offered 3,000 Credits

SELECT setval('trade_currencies_trade_currency_id_seq', (SELECT MAX(trade_currency_id) FROM trade_currencies));

-- ----------------------------------------------------------------------------
-- 11. AUDIT LOGS (20 Detailed Historical Audit Events)
-- ----------------------------------------------------------------------------
INSERT INTO audit_logs (log_id, player_id, action_type, details, created_at) VALUES
(1,  1, 'SYSTEM_BOOT',          'Operator database node synchronized and security protocols engaged.', '2026-01-10 08:00:00Z'),
(2,  1, 'WALLET_INITIALIZED',   'Initial operator combat scrip grant: 50,000 Credits allocated.', '2026-01-10 08:05:00Z'),
(3,  1, 'STORE_PURCHASE',       'Purchased offer #1 (Phantom Circuit) for 15,000 Combat Credits.', '2026-02-01 10:00:00Z'),
(4,  1, 'EQUIP_GEAR',           'Equipped item #1 (Phantom Circuit) as primary weapon.', '2026-02-01 10:02:00Z'),
(5,  1, 'STORE_PURCHASE',       'Purchased offer #2 (Nightwatch) for 750 Blacksite Tokens.', '2026-02-01 10:05:00Z'),
(6,  2, 'STORE_PURCHASE',       'Purchased offer #3 (Obsidian Vector) for 1,800 Blacksite Tokens.', '2026-02-04 15:20:00Z'),
(7,  2, 'MARKET_LISTING_CREATE','Created marketplace listing #3 for Phantom Circuit at 850 BST.', '2026-02-18 12:15:00Z'),
(8,  3, 'MARKET_PURCHASE',      'Purchased listing #8 (Apex Viper) from Valkyrie for 7,500 Credits.', '2026-02-16 11:00:00Z'),
(9,  4, 'TRADE_ACCEPTED',       'Trade #3 with Ghost completed. Swapped Cryo Shock & 500 BST for Phantom Circuit.', '2026-02-15 10:45:00Z'),
(10, 5, 'TRADE_DECLINED',       'Trade #4 between Nomad and Titan declined by mutual standoff.', '2026-02-16 12:00:00Z'),
(11, 6, 'TRADE_CANCELLED',      'Trade #5 cancelled by initiator Titan.', '2026-02-17 09:00:00Z'),
(12, 1, 'MARKET_LISTING_CREATE','Listed Redline Spectre on public exchange for 18,500 Credits.', '2026-02-18 10:00:00Z'),
(13, 1, 'TRADE_PROPOSED',       'Proposed bilateral exchange Trade #1 to Viper_Seven.', '2026-02-21 14:00:00Z'),
(14, 2, 'TRADE_COUNTERED',      'Added 150 Blacksite Tokens to pending Trade #1.', '2026-02-21 14:30:00Z'),
(15, 7, 'SECURITY_FLAG',        'Account suspended pending forensic review of encrypted comms.', '2026-01-25 12:00:00Z'),
(16, 8, 'WALLET_DEPOSIT',       'Received encrypted token transmission of 3,350 Crypto-Scrip.', '2026-02-01 17:10:00Z'),
(17, 4, 'MARKET_LISTING_CREATE','Created high-value listing #4 for Obsidian Vector at 2,100 BST.', '2026-02-19 14:00:00Z'),
(18, 5, 'DURABILITY_DEGRADE',   'Field deployment reduced Shadow Walker boots durability to 65%.', '2026-02-14 10:15:00Z'),
(19, 3, 'TRADE_ACCEPTED',       'Trade #6 with Valkyrie finalized. Exchanged Aegis Sentinel for 3,000 CR.', '2026-02-18 18:00:00Z'),
(20, 1, 'INSPECT_ARMORY',       'Diagnostic scan completed for tactical armory instances #1-#7.', '2026-02-22 09:00:00Z');

SELECT setval('audit_logs_log_id_seq', (SELECT MAX(log_id) FROM audit_logs));

-- 12. LUCK ROYALE EVENTS
INSERT INTO wheel_events (event_id, event_name, currency_id, spin_cost, is_active) VALUES
(1, 'BLACK MARKET // LUCK ROYALE', 1, 500.00, TRUE);

SELECT setval('wheel_events_event_id_seq', (SELECT MAX(event_id) FROM wheel_events));

-- 13. LUCK ROYALE REWARDS (Configured Probabilities & Scarcity Cap)
-- Phantom Prototype: 0.5% (0.0050), max_supply: 2 (Strict global cap!)
INSERT INTO wheel_rewards (reward_id, event_id, item_type_id, base_probability, max_supply, awarded_count, is_active, display_order) VALUES
(1, 1, 17, 0.0050, 2,    0, TRUE, 1), -- Phantom Prototype (Mythic / Exclusive Cap: 2)
(2, 1, 3,  0.0150, NULL, 0, TRUE, 2), -- Obsidian Vector (Mythic)
(3, 1, 1,  0.0400, NULL, 0, TRUE, 3), -- Phantom Circuit (Legendary)
(4, 1, 6,  0.0600, NULL, 0, TRUE, 4), -- Redline Spectre (Legendary)
(5, 1, 2,  0.1200, NULL, 0, TRUE, 5), -- Nightwatch (Epic)
(6, 1, 10, 0.1600, NULL, 0, TRUE, 6), -- Apex Viper (Epic)
(7, 1, 9,  0.2000, NULL, 0, TRUE, 7), -- Vanguard M24 (Rare)
(8, 1, 15, 0.2000, NULL, 0, TRUE, 8), -- Havoc Carbine (Uncommon)
(9, 1, 11, 0.2000, NULL, 0, TRUE, 9); -- Shadow Walker (Common)

SELECT setval('wheel_rewards_reward_id_seq', (SELECT MAX(reward_id) FROM wheel_rewards));

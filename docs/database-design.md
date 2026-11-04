# BLACKSITE // OPERATOR ARMORY
## Database Design, Relational Schema & 3NF Normalization
**RDBMS Engine:** PostgreSQL 14+  
**Target Schema:** `public`  

---

### 1. Relational Schema Specification

#### 1.1 `PLAYERS` Table
- `player_id` SERIAL PRIMARY KEY
- `username` VARCHAR(50) NOT NULL UNIQUE
- `email` VARCHAR(100) NOT NULL UNIQUE
- `status` VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'offline', 'banned'))
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP

#### 1.2 `CURRENCIES` Table
- `currency_id` SERIAL PRIMARY KEY
- `currency_name` VARCHAR(50) NOT NULL UNIQUE
- `is_premium` BOOLEAN NOT NULL DEFAULT FALSE
- `symbol` VARCHAR(10) NOT NULL DEFAULT 'CR'
- `description` TEXT

#### 1.3 `WALLETS` Table
- `wallet_id` SERIAL PRIMARY KEY
- `player_id` INT NOT NULL REFERENCES PLAYERS(player_id) ON DELETE CASCADE
- `currency_id` INT NOT NULL REFERENCES CURRENCIES(currency_id) ON DELETE RESTRICT
- `balance` NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0)
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT `uq_player_currency` UNIQUE (player_id, currency_id)

#### 1.4 `ITEM_CATALOG` Table
- `item_type_id` SERIAL PRIMARY KEY
- `item_name` VARCHAR(100) NOT NULL UNIQUE
- `rarity` VARCHAR(20) NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'))
- `is_tradable` BOOLEAN NOT NULL DEFAULT TRUE
- `category` VARCHAR(50) NOT NULL CHECK (category IN ('Assault Rifle', 'SMG', 'Sniper Rifle', 'Combat Helmet', 'Tactical Vest', 'Weapon Skin', 'Operator Skin', 'Supply Crate', 'Tactical Gear'))
- `base_durability` INT NOT NULL DEFAULT 100 CHECK (base_durability BETWEEN 1 AND 100)
- `description` TEXT
- `asset_key` VARCHAR(50) NOT NULL DEFAULT 'standard_gear'

#### 1.5 `INVENTORIES` Table (Item Instances)
- `item_instance_id` SERIAL PRIMARY KEY
- `player_id` INT NOT NULL REFERENCES PLAYERS(player_id) ON DELETE CASCADE
- `item_type_id` INT NOT NULL REFERENCES ITEM_CATALOG(item_type_id) ON DELETE RESTRICT
- `durability` INT NOT NULL DEFAULT 100 CHECK (durability BETWEEN 0 AND 100)
- `acquired_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
- `is_equipped` BOOLEAN NOT NULL DEFAULT FALSE

#### 1.6 `STORE_OFFERS` Table
- `offer_id` SERIAL PRIMARY KEY
- `item_type_id` INT NOT NULL REFERENCES ITEM_CATALOG(item_type_id) ON DELETE RESTRICT
- `currency_id` INT NOT NULL REFERENCES CURRENCIES(currency_id) ON DELETE RESTRICT
- `price` NUMERIC(15, 2) NOT NULL CHECK (price >= 0)
- `stock_limit` INT NOT NULL CHECK (stock_limit >= 0)
- `stock_sold` INT NOT NULL DEFAULT 0 CHECK (stock_sold >= 0 AND stock_sold <= stock_limit)
- `status` VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold_out', 'expired', 'disabled'))
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP

#### 1.7 `MARKET_LISTINGS` Table
- `listing_id` SERIAL PRIMARY KEY
- `seller_id` INT NOT NULL REFERENCES PLAYERS(player_id) ON DELETE CASCADE
- `item_instance_id` INT NOT NULL REFERENCES INVENTORIES(item_instance_id) ON DELETE RESTRICT
- `currency_id` INT NOT NULL REFERENCES CURRENCIES(currency_id) ON DELETE RESTRICT
- `price` NUMERIC(15, 2) NOT NULL CHECK (price > 0)
- `status` VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired'))
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP

#### 1.8 `TRADES` Table
- `trade_id` SERIAL PRIMARY KEY
- `initiator_id` INT NOT NULL REFERENCES PLAYERS(player_id) ON DELETE CASCADE
- `receiver_id` INT NOT NULL REFERENCES PLAYERS(player_id) ON DELETE CASCADE
- `status` VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'))
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
- `resolved_at` TIMESTAMPTZ
- CONSTRAINT `chk_trade_distinct_players` CHECK (initiator_id <> receiver_id)

#### 1.9 `TRADE_ITEMS` Table
- `trade_item_id` SERIAL PRIMARY KEY
- `trade_id` INT NOT NULL REFERENCES TRADES(trade_id) ON DELETE CASCADE
- `item_instance_id` INT NOT NULL REFERENCES INVENTORIES(item_instance_id) ON DELETE CASCADE
- `player_id` INT NOT NULL REFERENCES PLAYERS(player_id) ON DELETE CASCADE
- CONSTRAINT `uq_trade_item_instance` UNIQUE (trade_id, item_instance_id)

#### 1.10 `TRADE_CURRENCIES` Table
- `trade_currency_id` SERIAL PRIMARY KEY
- `trade_id` INT NOT NULL REFERENCES TRADES(trade_id) ON DELETE CASCADE
- `currency_id` INT NOT NULL REFERENCES CURRENCIES(currency_id) ON DELETE RESTRICT
- `player_id` INT NOT NULL REFERENCES PLAYERS(player_id) ON DELETE CASCADE
- `amount` NUMERIC(15, 2) NOT NULL CHECK (amount > 0)
- CONSTRAINT `uq_trade_player_currency` UNIQUE (trade_id, player_id, currency_id)

#### 1.11 `AUDIT_LOGS` Table
- `log_id` SERIAL PRIMARY KEY
- `player_id` INT REFERENCES PLAYERS(player_id) ON DELETE SET NULL
- `action_type` VARCHAR(50) NOT NULL
- `details` TEXT NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP

---

### 2. Functional Dependencies & Normalization Proof (1NF to 3NF)

#### 2.1 First Normal Form (1NF)
- **Criteria:** All attributes are atomic (no repeating groups, multi-valued attributes, or comma-separated lists). Each column has a distinct domain, and tables have unique primary keys.
- **Proof:** 
  - `TRADE_ITEMS` and `TRADE_CURRENCIES` are separated into dedicated associative tables rather than storing item lists or money bundles as arrays in `TRADES`.
  - Player wallets are normalized into individual rows in `WALLETS` rather than multiple balance columns (`balance_credits`, `balance_tokens`) in `PLAYERS`.
  - Every column holds scalar values.

#### 2.2 Second Normal Form (2NF)
- **Criteria:** The relation is in 1NF and every non-prime attribute is fully functionally dependent on the entire primary key (no partial functional dependencies).
- **Proof:**
  - In `WALLETS`: Primary key is surrogate `wallet_id` (candidate key `(player_id, currency_id)`). Non-prime attribute `balance` depends on the combination of player and currency, not just `player_id` or `currency_id`.
  - In `TRADE_ITEMS`: Key is surrogate `trade_item_id` (candidate key `(trade_id, item_instance_id)`). `player_id` is the offering actor, completely bound to the specific item offered in that trade.
  - In `TRADE_CURRENCIES`: `amount` depends on `(trade_id, player_id, currency_id)`.
  - In `INVENTORIES`: Durability depends strictly on the physical instance `item_instance_id`, not on `player_id`.

#### 2.3 Third Normal Form (3NF)
- **Criteria:** The relation is in 2NF and no non-prime attribute is transitively dependent on the primary key (for every non-trivial functional dependency $X \rightarrow Y$, either $X$ is a superkey or $Y$ is a prime attribute).
- **Proof:**
  - `INVENTORIES` does NOT store `item_name`, `rarity`, `is_tradable`, or `category`. If it did, we would have $item\_instance\_id \rightarrow item\_type\_id \rightarrow (item\_name, rarity)$, which is a transitive dependency. Instead, `INVENTORIES` stores only the foreign key `item_type_id`, referencing `ITEM_CATALOG`.
  - `STORE_OFFERS` references `item_type_id` and `currency_id`, avoiding duplication of item descriptions or currency properties.
  - `MARKET_LISTINGS` references `item_instance_id` and does not duplicate item attributes or seller username.
  - Conclusion: The schema satisfies 3NF rigorously across all relations.

---

### 3. Concurrency Control & ACID Guarantees

1. **Store Purchase Transaction:**
   ```sql
   BEGIN;
   -- 1. Lock store offer and verify stock
   SELECT * FROM store_offers WHERE offer_id = $1 FOR UPDATE;
   -- 2. Lock player wallet and verify balance
   SELECT * FROM wallets WHERE player_id = $2 AND currency_id = $3 FOR UPDATE;
   -- 3. Deduct balance, increment stock_sold
   UPDATE wallets SET balance = balance - $price WHERE wallet_id = $wallet_id;
   UPDATE store_offers SET stock_sold = stock_sold + 1, 
          status = CASE WHEN stock_sold + 1 >= stock_limit THEN 'sold_out' ELSE status END
   WHERE offer_id = $offer_id;
   -- 4. Insert into inventories
   INSERT INTO inventories (player_id, item_type_id, durability) VALUES ($player_id, $item_type_id, 100);
   -- 5. Audit log
   INSERT INTO audit_logs (player_id, action_type, details) VALUES (...);
   COMMIT;
   ```

2. **Market Listing Purchase Transaction:**
   - Buyer wallet and seller wallet locked using consistent ordering (`LEAST(buyer_id, seller_id), GREATEST(buyer_id, seller_id)`) to prevent deadlocks.
   - Listing locked with `FOR UPDATE WHERE status = 'active'` to prevent race conditions (double spend / double purchase).
   - Item instance ownership reassigned: `UPDATE inventories SET player_id = $buyer_id WHERE item_instance_id = $item_instance_id;`.

3. **Trade Acceptance Transaction:**
   - Trade row locked: `SELECT * FROM trades WHERE trade_id = $1 AND status = 'pending' FOR UPDATE;`.
   - Verified that all offered items in `TRADE_ITEMS` still belong to their respective offerers.
   - Swapped item ownership atomically in `INVENTORIES`.
   - Transferred all pledged `TRADE_CURRENCIES` between initiator and receiver wallets.
   - Marked trade status as `'accepted'`.

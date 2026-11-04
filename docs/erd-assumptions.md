# BLACKSITE // OPERATOR ARMORY
## ER Diagram Analysis, Assumptions & Model Mapping
**Source Document:** `FINAL_FINAL.pdf`  

---

### 1. ERD Entity & Attribute Inventory
Careful visual inspection of `FINAL_FINAL.pdf` reveals the following 11 entities, their primary keys, attributes, and relationships:

| Entity Name | Primary Key | Attributes in Diagram | Type & Description |
|---|---|---|---|
| **PLAYERS** | `player_id` | `player_id`, `username`, `email`, `status` | Core actor entity. Represents registered game operators. |
| **CURRENCIES** | `currency_id` | `currency_id`, `currency_name`, `is_premium` | Currency archetypes (e.g., standard vs premium). |
| **WALLETS** | `wallet_id` | `wallet_id`, `balance` | Financial account for a specific player denominated in a specific currency. |
| **TRADE CURRENCIES** | *(composite/weak)* | `amount` | Associative/weak entity capturing currency amounts pledged in a trade. |
| **TRADES** | `trade_id` | `trade_id`, `status` | Bilateral trade transaction between an initiator and a receiver. |
| **TRADE ITEMS** | *(composite/weak)* | *(associative)* | Associative entity linking traded inventory instances to a trade and offering player. |
| **STORE OFFERS** | `offer_id` | `offer_id`, `price`, `stock_limit`, `stock_sold`, `status` | Armory store listing offering a catalog item for purchase. |
| **ITEM CATALOG** | `item_type_id` | `item_type_id`, `item_name`, `rarity`, `is_tradable` | Blueprint/archetype definition for weapons, armor, skins, and gear. |
| **INVENTORIES** | `item_instance_id` | `item_instance_id`, `durability` | Instantiated physical item instance owned by a player. |
| **MARKET LISTINGS** | `listing_id` | `listing_id`, `price`, `status` | P2P marketplace offer selling an inventory item instance. |
| **AUDIT LOGS** | `log_id` | `log_id`, `action_type`, `details` | Historical immutable event record for auditing and security. |

---

### 2. Relationship Analysis & Cardinality Mapping

1. **PLAYERS — WALLETS (`OWNS`)**
   - **ERD Cardinality:** `PLAYERS (0,M) --- OWNS --- (1,1) WALLETS`
   - **Interpretation:** Every wallet belongs to exactly one player. A player can possess multiple wallets (each for a distinct currency).
   - **Relational Implementation:** `WALLETS.player_id REFERENCES PLAYERS(player_id) ON DELETE CASCADE`.

2. **CURRENCIES — WALLETS (`DENOMINATES`)**
   - **ERD Cardinality:** `CURRENCIES (0,M) --- DENOMINATES --- (1,1) WALLETS`
   - **Interpretation:** Each wallet is denominated in exactly one currency. A currency can denominate multiple players' wallets.
   - **Relational Implementation:** `WALLETS.currency_id REFERENCES CURRENCIES(currency_id) ON DELETE RESTRICT`. Composite constraint: `UNIQUE(player_id, currency_id)`.

3. **PLAYERS — AUDIT LOGS (`GENERATES LOG`)**
   - **ERD Cardinality:** `PLAYERS (0,M) --- GENERATES LOG --- (1,1) AUDIT LOGS`
   - **Interpretation:** Each audit log record is associated with the player who performed or was affected by the action.
   - **Relational Implementation:** `AUDIT_LOGS.player_id REFERENCES PLAYERS(player_id) ON DELETE SET NULL`.

4. **PLAYERS — TRADES (`INITIATES TRADE` & `RECEIVES TRADE`)**
   - **ERD Cardinality:**  
     - `PLAYERS (0,M) --- INITIATES TRADE --- (1,1) TRADES`
     - `PLAYERS (0,M) --- RECEIVES TRADE --- (1,1) TRADES`
   - **Interpretation:** A trade requires two distinct player roles: an initiator (`initiator_id`) and a recipient (`receiver_id`).
   - **Relational Implementation:** `TRADES.initiator_id REFERENCES PLAYERS(player_id)`, `TRADES.receiver_id REFERENCES PLAYERS(player_id)`. Check constraint: `CHECK (initiator_id <> receiver_id)`.

5. **TRADES — TRADE ITEMS (`INCLUDES`) & PLAYERS — TRADE ITEMS (`OFFERS ITEM`) & INVENTORIES — TRADE ITEMS (`ASSOCIATED ITEM`)**
   - **ERD Cardinality:**  
     - `TRADES (0,M) --- INCLUDES --- (1,1) TRADE ITEMS`
     - `PLAYERS (0,M) --- OFFERS ITEM --- (1,1) TRADE ITEMS`
     - `INVENTORIES (0,M) --- ASSOCIATED ITEM --- (1,1) TRADE ITEMS`
   - **Interpretation:** `TRADE ITEMS` is an associative entity resolving the M:N relationship between trades and item instances, explicitly recording which player is offering the item.
   - **Relational Implementation:** Table `TRADE_ITEMS` with `trade_id`, `item_instance_id`, `player_id`. Constraint: `UNIQUE(trade_id, item_instance_id)`.

6. **TRADES — TRADE CURRENCIES (`CONTAINS CURRENCY`) & CURRENCIES — TRADE CURRENCIES (`USES CURRENCY`) & PLAYERS — TRADE CURRENCIES (`OFFERS CURRENCY`)**
   - **ERD Cardinality:**  
     - `TRADES (0,M) --- CONTAINS CURRENCY --- (1,1) TRADE CURRENCIES`
     - `CURRENCIES (0,M) --- USES CURRENCY --- (1,1) TRADE CURRENCIES`
     - `PLAYERS (0,M) --- OFFERS CURRENCY --- (1,1) TRADE CURRENCIES`
   - **Interpretation:** Allows players in a trade to offer currency amounts in addition to or instead of items.
   - **Relational Implementation:** Table `TRADE_CURRENCIES` with `trade_id`, `currency_id`, `player_id`, `amount`. Constraint: `UNIQUE(trade_id, player_id, currency_id)`.

7. **ITEM CATALOG — INVENTORIES (`DEFINES TYPE`)**
   - **ERD Cardinality:** `ITEM CATALOG (0,M) --- DEFINES TYPE --- (1,1) INVENTORIES`
   - **Interpretation:** Every inventory item instance is of an archetype defined in the catalog.
   - **Relational Implementation:** `INVENTORIES.item_type_id REFERENCES ITEM_CATALOG(item_type_id) ON DELETE RESTRICT`.

8. **PLAYERS — INVENTORIES (`OWNS INSTANCE`)**
   - **ERD Cardinality:** `PLAYERS (0,M) --- OWNS INSTANCE --- (1,1) INVENTORIES`
   - **Interpretation:** Every item instance is owned by exactly one player.
   - **Relational Implementation:** `INVENTORIES.player_id REFERENCES PLAYERS(player_id) ON DELETE CASCADE`.

9. **ITEM CATALOG — STORE OFFERS (`FEATURED IN`)**
   - **ERD Cardinality:** `ITEM CATALOG (0,M) --- FEATURED IN --- (1,1) STORE OFFERS`
   - **Interpretation:** Each store offer features a specific catalog item archetype.
   - **Relational Implementation:** `STORE_OFFERS.item_type_id REFERENCES ITEM_CATALOG(item_type_id) ON DELETE RESTRICT`.

10. **CURRENCIES — STORE OFFERS (`PRICE OFFERS`)**
    - **ERD Cardinality:** `CURRENCIES (0,M) --- PRICE OFFERS --- (1,1) STORE OFFERS`
    - **Interpretation:** Store offers are priced in a designated currency.
    - **Relational Implementation:** `STORE_OFFERS.currency_id REFERENCES CURRENCIES(currency_id) ON DELETE RESTRICT`.

11. **PLAYERS — MARKET LISTINGS (`CREATES LISTINGS`)**
    - **ERD Cardinality:** `PLAYERS (0,M) --- CREATES LISTINGS --- (1,1) MARKET LISTINGS`
    - **Interpretation:** Each marketplace listing is created by an active seller.
    - **Relational Implementation:** `MARKET_LISTINGS.seller_id REFERENCES PLAYERS(player_id) ON DELETE CASCADE`.

12. **INVENTORIES — MARKET LISTINGS (`IS LISTED IN`)**
    - **ERD Cardinality:** `INVENTORIES (0,1) --- IS LISTED IN --- (1,1) MARKET LISTINGS`
    - **Interpretation:** An active listing references an item instance in an inventory. An inventory item instance can only be actively listed once at a time.
    - **Relational Implementation:** `MARKET_LISTINGS.item_instance_id REFERENCES INVENTORIES(item_instance_id) ON DELETE RESTRICT`. Partial unique index: `CREATE UNIQUE INDEX unique_active_listing ON MARKET_LISTINGS (item_instance_id) WHERE status = 'active';`.

13. **CURRENCIES — MARKET LISTINGS (`PRICES LISTING`)**
    - **ERD Cardinality:** `CURRENCIES (0,M) --- PRICES LISTING --- (1,1) MARKET LISTINGS`
    - **Interpretation:** The asking price of a market listing is denominated in a designated currency.
    - **Relational Implementation:** `MARKET_LISTINGS.currency_id REFERENCES CURRENCIES(currency_id) ON DELETE RESTRICT`.

---

### 3. Deliberate Technical Assumptions & Clarifications

1. **Temporal Attributes (Timestamps):**
   - The Chen ER diagram in `FINAL_FINAL.pdf` focuses on core domain attributes. In accordance with database engineering best practices and the prompt guideline (*"Store timestamps in the database where appropriate. Do not fabricate timestamps for records after retrieval"*), `created_at` and `updated_at` timestamps with time zone default to `CURRENT_TIMESTAMP` on mutable entities (`AUDIT_LOGS`, `TRADES`, `MARKET_LISTINGS`, `INVENTORIES`).

2. **Status Domains (Enumerations/Check Constraints):**
   - `PLAYERS.status`: `'active'`, `'suspended'`, `'offline'`, `'banned'`.
   - `TRADES.status`: `'pending'`, `'accepted'`, `'declined'`, `'cancelled'`.
   - `STORE_OFFERS.status`: `'available'`, `'sold_out'`, `'expired'`, `'disabled'`.
   - `MARKET_LISTINGS.status`: `'active'`, `'sold'`, `'cancelled'`, `'expired'`.
   - `ITEM_CATALOG.rarity`: `'Common'`, `'Uncommon'`, `'Rare'`, `'Epic'`, `'Legendary'`, `'Mythic'`.

3. **Catalog Extensions for Tactical UI & 3D Rendering:**
   - To power the requested tactical operator inspection and 3D preview, `ITEM_CATALOG` incorporates complementary presentation attributes: `category` (e.g. `'Assault Rifle'`, `'SMG'`, `'Helmet'`, `'Vest'`, `'Cosmetic'`, `'Supply Crate'`), `description`, and `asset_key` / `model_type` mapping. This preserves the exact schema contract while enriching the 3D graphics experience.

4. **Foreign Key Deletion Rules:**
   - `ON DELETE CASCADE` is applied to purely dependent entities such as `WALLETS`, `INVENTORIES`, and `TRADE_ITEMS` / `TRADE_CURRENCIES` when their parent player or trade is pruned.
   - `ON DELETE RESTRICT` is strictly applied to archetypes (`ITEM_CATALOG`, `CURRENCIES`) to avoid corrupting financial and transactional histories.
   - `ON DELETE SET NULL` is applied to `AUDIT_LOGS.player_id` so audit trails remain intact even if a demo player record is removed.

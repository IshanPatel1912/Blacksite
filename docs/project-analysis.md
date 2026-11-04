# BLACKSITE // OPERATOR ARMORY
## Project Analysis & System Specification
**DBMS Academic Capstone Project**  
**Domain:** Real-Time Game Inventory, Armory Asset Lifecycle, P2P Marketplace & Secure Trading System  

---

### 1. Executive Summary & Project Statement
The objective of this project is to architect, normalize, implement, and deploy an industrial-grade Relational Database Management System (RDBMS) tailored to a real-time multiplayer tactical game economy. 

Modern AAA video games (e.g., tactical shooters like *Call of Duty*, *Escape from Tarkov*, and *Counter-Strike*) operate complex virtual economies handling millions of concurrent micro-transactions: item drops, durability degradation, currency exchanges, limited store offers, peer-to-peer marketplace listings, and multi-asset bartering trades. Such workloads demand strict ACID transaction guarantees, concurrency control (pessimistic locking to avoid race conditions or item duplication), data integrity through declarative constraints, automated auditing via triggers, and high-performance query execution utilizing indexes, views, and stored procedures.

This project delivers **BLACKSITE // OPERATOR ARMORY**, a full-stack, database-driven tactical inventory management platform adhering to the official academic DBMS project guidelines.

---

### 2. Intended Users & Role Matrix

| User Role | Responsibilities & Capabilities | Key Workflows |
|---|---|---|
| **Operator (Player)** | Active gaming participant managing their personal military loadout, armory stock, wallets, and commercial engagements. | Inspect 3D loadouts, list items on P2P marketplace, purchase supply depot drops, propose/accept trades, monitor wallet balances. |
| **Merchant / Trader** | Economic specialist focused on arbitrage, supply depot acquisition, and peer-to-peer asset exchange. | Batch listing creation, market trend observation via database views, multi-item atomic trade negotiation. |
| **Game Master / Auditor** | Compliance and regulatory officer reviewing economy stability and tracking fraudulent transactions. | Query system audit logs, evaluate player activity graphs, review materialized views for suspicious asset transfers. |
| **Database Administrator (DBA) / Faculty Evaluator** | System administrator evaluating database performance, schema integrity, and executing DBMS Lab query demonstrations. | Execute DDL, DML, DCL, TCL benchmarks, inspect triggers and procedures, examine query execution plans (`EXPLAIN ANALYZE`). |

---

### 3. Core Use Cases & System Capabilities

#### Use Case 1: Armory Asset Lifecycle & Durability Tracking
- **Description:** Every item possessed by an operator is an instantiated row in `INVENTORIES` pointing to an immutable archetype in `ITEM_CATALOG`.
- **Integrity Rule:** Instances track `durability` (0–100%). Durability cannot exceed bounds, and only tradable (`is_tradable = TRUE`) items in undamaged states or eligible statuses can enter marketplace or trading pipelines.
- **Visual Integration:** Equipped or inspected items trigger real-time procedural 3D model/material updates on the tactical Operator Avatar.

#### Use Case 2: Multi-Currency Wallet Denomination
- **Description:** Players possess wallets separated across distinct currencies (`CURRENCIES`), specifically distinguishing standard soft currencies (e.g., Combat Credits, War Bonds) from premium hard currencies (e.g., Blacksite Tokens) via the `is_premium` boolean.
- **Integrity Rule:** `balance >= 0` check constraint strictly enforced. Overdrafts are rejected at the database engine level.

#### Use Case 3: Supply Depot (Store Offers) Atomic Purchase
- **Description:** Limited-time and stock-limited store offers (`STORE_OFFERS`) present catalog weapons, helmets, vests, and skins for fixed currency prices.
- **Integrity Rule:** Purchase execution is performed within a serializable/read-committed transaction with row-level locks (`SELECT ... FOR UPDATE` on store offer and player wallet). The transaction decrements wallet balance, increments `stock_sold`, verifies `stock_sold <= stock_limit`, changes status to `'sold_out'` if exhausted, inserts a new instance in `INVENTORIES`, and records an entry in `AUDIT_LOGS`.

#### Use Case 4: Peer-to-Peer Marketplace Concurrency
- **Description:** Players list owned inventory items for sale in `MARKET_LISTINGS` at a designated price and currency denomination.
- **Integrity Rule:** While an item instance is actively listed (`status = 'active'`), it cannot be offered in a trade or double-sold. A purchase atomically debits the buyer, credits the seller, transfers ownership of the inventory instance, updates listing status to `'sold'`, and logs the transaction.

#### Use Case 5: Complex Multi-Asset Atomic Bartering (Trades)
- **Description:** Two players exchange arbitrary sets of item instances (`TRADE_ITEMS`) and currency bundles (`TRADE_CURRENCIES`) in a single bilateral transaction (`TRADES`).
- **Integrity Rule:** Trade acceptance executes an atomic database procedure. Both parties' asset ownership and wallet balances are verified under lock. All items swap ownership, currencies transfer between respective wallets, trade state transitions from `'pending'` to `'accepted'`, and audit rows are generated.

#### Use Case 6: Academic Database Lab Demonstration
- **Description:** An interactive faculty demonstration module allowing real-time testing and visualization of standard SQL constructs: DDL, DML, DCL, TCL, complex DQL with joins, set operations (UNION, INTERSECT, EXCEPT), subqueries, stored procedures, triggers, views, and materialized views.

---

### 4. Technical Architecture Overview
- **Client (Frontend):** React (Vite) Single Page Application using clean modular JavaScript (ES6+), Three.js, React Three Fiber (`@react-three/fiber`), and Drei (`@react-three/drei`) for 3D operator preview.
- **Server (Backend):** Node.js and Express RESTful API with modular controllers, centralized error handling, and parameter validation.
- **Database Layer:** PostgreSQL relational database connected via the native `pg` connection pool. Multi-step mutations execute inside atomic database transactions (`BEGIN ... COMMIT / ROLLBACK`) with row locks (`FOR UPDATE`).
- **Audit System:** Immutable event logging utilizing PostgreSQL triggers and backend audit services.

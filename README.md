# BLACKSITE // OPERATOR ARMORY
### 3D Game Inventory Management System & Academic DBMS Capstone
**Engine:** PostgreSQL 14+ | **Backend:** Node.js & Express (ES6) | **Frontend:** React, Vite & Three.js (React Three Fiber / Drei)

---

## 1. Project Overview & Architecture

**BLACKSITE // OPERATOR ARMORY** is an industrial-grade full-stack game inventory, asset lifecycle, P2P marketplace, and multi-asset trading management system built specifically to satisfy and exceed the official **DBMS Project Guidelines** while adhering strictly to the **ER diagram specification** (`FINAL_FINAL.pdf`).

```
                              ┌────────────────────────────────────────┐
                              │  REACT TACTICAL FRONTEND (Vite / R3F)  │
                              │  • 3D Operator Avatar (Three.js/Drei)  │
                              │  • Armory, Store, Marketplace, Trades  │
                              │  • Academic Database Lab Interface    │
                              └──────────────────┬─────────────────────┘
                                                 │ REST API (JSON)
                                                 ▼
                              ┌────────────────────────────────────────┐
                              │       EXPRESS NODE.JS BACKEND          │
                              │  • Input Validation & Route Handlers   │
                              │  • Concurrency & Deadlock-Free Locks   │
                              │  • Transaction Management (ACID)       │
                              └──────────────────┬─────────────────────┘
                                                 │ pg Pool Driver
                                                 ▼
                              ┌────────────────────────────────────────┐
                              │       POSTGRESQL RELATIONAL ENGINE     │
                              │  • 11 Normalized 3NF Tables            │
                              │  • Stored Procedures & PL/pgSQL Funcs  │
                              │  • Automated Audit Triggers            │
                              │  • Views & Materialized Views          │
                              └────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
DBMS_Project/
├── client/                     # React Vite Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/             # TacticalAvatar.jsx, OperatorScene.jsx
│   │   │   ├── layout/         # TopBar.jsx, Sidebar.jsx, DbStatusBanner.jsx
│   │   │   └── modals/         # ItemInspectModal, CreateListing, CreateTrade
│   │   ├── context/            # PlayerContext.jsx, NotificationContext.jsx
│   │   ├── pages/              # 10 Dedicated Tactical Screens
│   │   ├── services/           # Centralized API service (api.js)
│   │   └── styles/             # Tactical theme and global styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js & Express RESTful API Backend
│   ├── src/
│   │   ├── config/             # PostgreSQL connection pool (db.js)
│   │   ├── controllers/        # Modular business logic controllers
│   │   ├── middleware/         # Database check & security middleware
│   │   ├── routes/             # RESTful API routing (api.js)
│   │   └── scripts/            # Database initialization script (setup-db.js)
│   ├── package.json
│   └── .env.example
│
├── database/                   # Pure SQL Relational Database Scripts
│   ├── schema.sql              # DDL Table Definitions & Domain Constraints
│   ├── indexes.sql             # B-Tree Secondary & Partial Unique Indexes
│   ├── views.sql               # Views & Materialized Views (mv_market_economy_summary)
│   ├── functions.sql           # PL/pgSQL Business Calculation Functions
│   ├── procedures.sql          # ACID Stored Procedures (Pessimistic Row Locking)
│   ├── triggers.sql            # Automated Trigger Audit Logs & Safeguards
│   ├── seed.sql                # 128+ Deterministic Realistic Test Records
│   ├── queries.sql             # Production Operational DQL Queries
│   └── dbms-lab.sql            # Complete Academic Syllabus Verification Suite
│
├── docs/                       # Engineering & Academic Design Documentation
│   ├── project-analysis.md     # Purpose, User Roles, Use Cases & Specifications
│   ├── erd-assumptions.md      # ERD Entity/Relationship Mapping from FINAL_FINAL.pdf
│   └── database-design.md      # 3NF Normalization Proof & Concurrency Strategy
│
├── DBMS Project Guidelines.pdf # Official Course Requirements Document
├── FINAL_FINAL.pdf             # Official Course Chen ER Diagram
├── .env.example                # Root Environment Configuration Template
├── package.json                # Root Concurrently Orchestration Script
└── README.md                   # This Document
```

---

## 3. Database Design & Relational Mapping

The database schema directly maps the 11 entities and associative structures identified in `FINAL_FINAL.pdf`:

1. **`players`**: Registered military operators (`player_id`, `username`, `email`, `status`, `created_at`).
2. **`currencies`**: Economic denominations (`currency_id`, `currency_name`, `is_premium`, `symbol`).
3. **`wallets`**: Player financial accounts (`wallet_id`, `player_id`, `currency_id`, `balance`, `updated_at`). Constraint: `UNIQUE(player_id, currency_id)`.
4. **`item_catalog`**: Central archetype blueprints (`item_type_id`, `item_name`, `rarity`, `is_tradable`, `category`, `base_durability`, `asset_key`).
5. **`inventories`**: Physical item instances (`item_instance_id`, `player_id`, `item_type_id`, `durability`, `is_equipped`).
6. **`store_offers`**: Armory depot drops (`offer_id`, `item_type_id`, `currency_id`, `price`, `stock_limit`, `stock_sold`, `status`).
7. **`market_listings`**: P2P public exchange listings (`listing_id`, `seller_id`, `item_instance_id`, `currency_id`, `price`, `status`). Partial unique index enforces only 1 active listing per instance.
8. **`trades`**: Bilateral exchange header (`trade_id`, `initiator_id`, `receiver_id`, `status`). Constraint: `initiator_id <> receiver_id`.
9. **`trade_items`**: Associative table binding item instances to trades (`trade_item_id`, `trade_id`, `item_instance_id`, `player_id`).
10. **`trade_currencies`**: Associative table binding currency pledges to trades (`trade_currency_id`, `trade_id`, `currency_id`, `player_id`, `amount`).
11. **`audit_logs`**: Immutable security ledger (`log_id`, `player_id`, `action_type`, `details`, `created_at`).

### 3NF Normalization Proof
- **1NF**: Atomic scalar attributes; repeating sets (trade items, currency bundles) isolated in associative relations.
- **2NF**: No partial functional dependencies; all non-prime attributes fully dependent on candidate keys.
- **3NF**: No transitive dependencies. Catalog archetypes are decoupled from inventory instances ($item\_instance\_id \rightarrow item\_type\_id \rightarrow item\_name$ avoided).

---

## 4. Prerequisites

- **Node.js**: v18.0.0 or later (v24.18.0 tested).
- **PostgreSQL**: v14.0 or later (v15 or v16 recommended).
- **Web Browser**: Chrome, Edge, Firefox, or Safari with WebGL enabled.

---

## 5. Setup & Installation Instructions

### Option A: Running with XAMPP (MySQL / MariaDB)

If you have XAMPP installed on your system (e.g. at `C:\xampp`), you can run the entire project directly against XAMPP's database engine with zero additional database downloads:

1. **Start MySQL in XAMPP:**
   - Open **XAMPP Control Panel** (`C:\xampp\xampp-control.exe`).
   - Click the **Start** button next to **MySQL** (and optionally **Apache** if you want to use phpMyAdmin).
   - Ensure the module status turns green with port `3306`.

2. **Run the Automated XAMPP Setup Command:**
   In your project root terminal:
   ```powershell
   npm run db:setup:xampp
   ```
   This script automatically:
   - Connects to your XAMPP MySQL daemon (`localhost:3306`, user `root`, no password).
   - Creates the database `blacksite_armory`.
   - Executes `database/xampp-mysql-schema.sql` (creating all 11 tables with foreign keys and constraints).
   - Executes `database/xampp-mysql-seed.sql` (populating 128+ deterministic test records).

3. *(Optional) Inspect in phpMyAdmin:*
   - Open your browser to `http://localhost/phpmyadmin`.
   - In the left sidebar, click on `blacksite_armory` to view all 11 tables, views, and data.

---

### Option B: Running with PostgreSQL

If your faculty or guidelines strictly evaluate PostgreSQL:

1. **Install & Start PostgreSQL:**
   - Install PostgreSQL 14+ via the official EDB installer or `winget install PostgreSQL.PostgreSQL`.
   - Default port is `5432` (which runs alongside XAMPP with zero port conflicts).

2. **Configure Credentials:**
   - Ensure `server/.env` has your PostgreSQL password:
     ```env
     PGHOST=localhost
     PGPORT=5432
     PGDATABASE=blacksite_armory
     PGUSER=postgres
     PGPASSWORD=your_postgres_password
     ```

3. **Run PostgreSQL Setup Pipeline:**
   ```powershell
   npm run db:setup
   ```

---

### Step 4: Start the Full-Stack Application
Once either XAMPP MySQL or PostgreSQL is initialized, start the frontend and backend concurrently:
```powershell
npm run dev
```
Open **`http://localhost:5173`** in your browser. The Top Bar will automatically indicate:
`DB: ONLINE [mysql (XAMPP)]` or `DB: ONLINE [postgres]`.

---

## 6. Academic Database Lab Demonstration

The **Database Lab** tab in the sidebar provides an interactive evaluation suite covering the entire academic DBMS syllabus across 12 structured categories:

1. **DDL**: Constraint inspections, CREATE, ALTER, DROP, TRUNCATE, and RENAME.
2. **DML**: INSERT with `RETURNING`, bounded conditional UPDATE, and cascade rules analysis.
3. **DCL**: Role-based access control, privilege grants, and revocations.
4. **TCL**: Multi-Version Concurrency Control (MVCC) lock inspection, savepoints, and rollbacks.
5. **DQL**: Conditional WHERE queries and aggregate metrics (`COUNT`, `AVG`, `MIN`, `MAX`).
6. **Clauses**: `IN`, `LIKE`, `DISTINCT`, `ORDER BY`, `LIMIT`, and `OFFSET`.
7. **Grouping**: `GROUP BY` and `HAVING` threshold aggregations.
8. **Joins**: Complete implementations of `INNER`, `LEFT OUTER`, `RIGHT OUTER`, `FULL OUTER`, `CROSS`, and `SELF JOIN`.
9. **Set Operations**: `UNION`, `UNION ALL`, `INTERSECT`, and `EXCEPT`.
10. **Subqueries**: Scalar, correlated, `ANY`, and `ALL` subqueries.
11. **Views & Materialized Views**: Standard query views and `REFRESH MATERIALIZED VIEW`.
12. **Procedural SQL**: PL/pgSQL function calls and trigger-generated audit verification.

---

## 7. Troubleshooting & Diagnostics

- **Database Disconnected Banner:** If PostgreSQL is offline or credentials in `server/.env` do not match, the application displays an orange diagnostic banner with step-by-step instructions. The UI gracefully reports the offline status without crashing.
- **Port Conflicts:** If port 5000 or 5173 is in use, modify `PORT` in `server/.env` or Vite port in `client/vite.config.js`.
- **CORS Configuration:** The backend CORS middleware is configured to accept requests from all local development origins.

---

## 8. Summary of Completed Academic Requirements

| Course Guideline | Implementation Status | Evidence / Location |
|---|---|---|
| **Project Statement & Use Cases** | Completed | `docs/project-analysis.md` |
| **ERD Analysis & Cardinalities** | Completed | `docs/erd-assumptions.md`, source `FINAL_FINAL.pdf` |
| **Relational Model & Constraints** | Completed | `database/schema.sql`, `docs/database-design.md` |
| **3NF Normalization Proof** | Completed | `docs/database-design.md` Section 2 |
| **100+ Seed Records** | Completed | `database/seed.sql` (128 records across all 11 tables) |
| **DDL Queries** | Completed | `database/dbms-lab.sql`, Database Lab Category 1 |
| **DML Queries (Cascading/Non)** | Completed | `database/dbms-lab.sql`, Database Lab Category 2 |
| **DCL Queries (Grant/Revoke)** | Completed | `database/dbms-lab.sql`, Database Lab Category 3 |
| **TCL (Commit, Savepoint, Rollback)** | Completed | `database/dbms-lab.sql`, Database Lab Category 4 |
| **DQL (Select, Aggregate, Clauses)** | Completed | `database/dbms-lab.sql`, Database Lab Categories 5-7 |
| **Joins (All 6 Types)** | Completed | `database/dbms-lab.sql`, Database Lab Category 8 |
| **Set Operations (UNION, INTERSECT, etc.)** | Completed | `database/dbms-lab.sql`, Database Lab Category 9 |
| **Subqueries (ANY, ALL, Correlated)** | Completed | `database/dbms-lab.sql`, Database Lab Category 10 |
| **Views & Materialized Views** | Completed | `database/views.sql`, Database Lab Category 11 |
| **Procedures, Functions & Triggers** | Completed | `database/procedures.sql`, `triggers.sql`, `functions.sql` |
| **Interactive 3D Operator Avatar** | Completed | `client/src/components/3d/TacticalAvatar.jsx` (Three.js/R3F) |
| **Tactical Dark UI Design** | Completed | `client/src/styles/` (Blacksite Tactical Armory Aesthetic) |

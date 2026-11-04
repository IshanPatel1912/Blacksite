# BLACKSITE // OPERATOR ARMORY
## Academic DBMS Submission Guide: DDL Script & 20 Queries of All Types
**Course:** Database Management Systems (DBMS)  
**Target RDBMS:** MySQL 8.0+ / MariaDB 10.4+ (XAMPP Environment)  
**Database Name:** `blacksite_armory`  
**Generated Files:** 
- `database/DDL_AND_20_SQL_QUERIES.sql`
- `DDL_AND_20_SQL_QUERIES.sql`

---

## Instructions for Sir / Evaluation
Per your instructor's guidelines:
1. **DDL Script:** Complete schema creation for all 14 tables, constraints, foreign keys, and views.
2. **Plain Text and SQL Queries:** 20 distinct queries covering every fundamental category in the DBMS curriculum (Selection, Logical Operators, Pattern Matching, Range Checking, Set Membership, Nulls, Aggregates, Group By, Having, Inner/Left/Right/Self Joins, Scalar/Correlated/Exists/Any Subqueries, Set Operations, CASE expressions, and DML Updates).
3. **Executed Queries Outputs:** Real-world execution outputs captured directly from the live XAMPP MariaDB database formatted as ASCII tables.

---

## Summary of the 20 Queries

| # | Query Type / Technique | Plain Text Objective Summary |
|---|---|---|
| **Q1** | **Simple Selection & Projection** | Retrieve all active registered operators, sorted alphabetically by username. |
| **Q2** | **Logical Operators (AND, OR, NOT)** | Filter weapons from catalog with Mythic or Legendary rarity, durability >= 95, and tradable. |
| **Q3** | **Pattern Matching (LIKE with % and _)** | Find blueprints starting with 'Phantom' or containing 'Viper' anywhere in their name. |
| **Q4** | **Range Checking (BETWEEN ... AND ...)** | Retrieve inventory items whose current durability is between 80% and 95%. |
| **Q5** | **Set Membership (IN and NOT IN)** | Find store offers for defensive armor categories not priced in Crypto-Scrip. |
| **Q6** | **NULL Handling (IS NULL / COALESCE)** | List all trades with resolution timestamp or 'STILL_PENDING' if unresolved. |
| **Q7** | **Aggregate Functions (COUNT, AVG, MIN, MAX)** | Calculate system-wide inventory metrics: item count, average durability, min, and max. |
| **Q8** | **Grouping with Aggregates (GROUP BY)** | Group catalog items by category and compute counts, average base durability, and max durability. |
| **Q9** | **Group Filtering (GROUP BY with HAVING)** | Find rarity tiers with at least 2 instances and average durability strictly above 85%. |
| **Q10** | **3-Table INNER JOIN** | Inspect active loadouts joining players, physical inventories, and item blueprints. |
| **Q11** | **LEFT OUTER JOIN** | List all players and their active market listings, preserving players with 0 listings. |
| **Q12** | **RIGHT OUTER JOIN** | List all catalog blueprints and any store offers featuring them, preserving unfeatured blueprints. |
| **Q13** | **SELF JOIN** | Compare market listings of the same currency to find price differentials (Listing A vs B). |
| **Q14** | **Scalar Subquery** | Retrieve inventory items whose durability is higher than the overall fleet average durability. |
| **Q15** | **Correlated Subquery** | Find players whose Combat Credits balance exceeds the average balance of all players. |
| **Q16** | **Existence Testing (NOT EXISTS)** | Identify players who have never created any listing on the Black Market. |
| **Q17** | **Multi-Row Subquery (ANY Operator)** | Find store offers priced cheaper than ANY active Black Market listing in Combat Credits. |
| **Q18** | **Set Operations (UNION)** | Create a consolidated activity feed combining market sellers and trade initiators. |
| **Q19** | **Advanced Analytical (CASE & Scarcity)** | Inspect Luck Royale reward drops with real-time scarcity classification ('SOLD OUT', 'LIMITED SUPPLY', etc.). |
| **Q20** | **Data Modification (DML UPDATE with Subquery)** | Perform maintenance boosting durability by +5 for equipped items of active players. |

---

## How to Run in XAMPP / phpMyAdmin
1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Open your browser and go to `http://localhost/phpmyadmin`.
3. Select database `blacksite_armory` (or create it if needed).
4. Click on the **SQL** tab.
5. Open `DDL_AND_20_SQL_QUERIES.sql`, copy all or any specific query, paste into the text box, and click **Go**.

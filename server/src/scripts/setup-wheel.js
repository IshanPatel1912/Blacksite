const { query, getActiveEngine, checkConnection } = require('../config/db');

/**
 * setupWheelSchema
 * Automatically checks and initializes tables and catalog records for Luck Royale.
 * Compatible with both MySQL (XAMPP) and PostgreSQL.
 */
async function setupWheelSchema() {
  console.log('[LUCK ROYALE] Verifying database schema & exclusive items...');

  try {
    if (checkConnection) {
      await checkConnection();
    }

    // 1. Ensure Phantom Prototype exists in item_catalog
    const catalogCheck = await query(`
      SELECT item_type_id FROM item_catalog WHERE item_name = 'Phantom Prototype'
    `);

    let prototypeId;
    if (catalogCheck.rowCount === 0) {
      console.log('[LUCK ROYALE] Registering exclusive "Phantom Prototype" into item_catalog...');
      const insertCat = await query(`
        INSERT INTO item_catalog (item_name, rarity, is_tradable, category, base_durability, description, asset_key)
        VALUES (
          'Phantom Prototype',
          'Mythic',
          TRUE,
          'Assault Rifle',
          100,
          'Experimental classified assault rifle prototype with superconducting electromagnetic coils. Ultra-limited Black Market drop.',
          'rifle_phantom'
        )
      `);
      prototypeId = insertCat.insertId;
      if (!prototypeId) {
        const idCheck = await query(`SELECT item_type_id FROM item_catalog WHERE item_name = 'Phantom Prototype'`);
        prototypeId = idCheck.rows[0]?.item_type_id;
      }
    } else {
      prototypeId = catalogCheck.rows[0].item_type_id;
    }

    // 2. Create wheel_events table
    await query(`
      CREATE TABLE IF NOT EXISTS wheel_events (
        event_id INT AUTO_INCREMENT PRIMARY KEY,
        event_name VARCHAR(100) NOT NULL,
        currency_id INT NOT NULL,
        spin_cost DECIMAL(15, 2) NOT NULL DEFAULT 500.00,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `).catch(async () => {
      // PostgreSQL fallback syntax
      await query(`
        CREATE TABLE IF NOT EXISTS wheel_events (
          event_id SERIAL PRIMARY KEY,
          event_name VARCHAR(100) NOT NULL,
          currency_id INT NOT NULL,
          spin_cost NUMERIC(15, 2) NOT NULL DEFAULT 500.00,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    // 3. Create wheel_rewards table
    await query(`
      CREATE TABLE IF NOT EXISTS wheel_rewards (
        reward_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL DEFAULT 1,
        item_type_id INT NOT NULL,
        base_probability DECIMAL(6, 4) NOT NULL,
        max_supply INT NULL,
        awarded_count INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `).catch(async () => {
      // PostgreSQL fallback syntax
      await query(`
        CREATE TABLE IF NOT EXISTS wheel_rewards (
          reward_id SERIAL PRIMARY KEY,
          event_id INT NOT NULL DEFAULT 1,
          item_type_id INT NOT NULL,
          base_probability NUMERIC(6, 4) NOT NULL,
          max_supply INT NULL,
          awarded_count INT NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          display_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    // 4. Create wheel_spins table
    await query(`
      CREATE TABLE IF NOT EXISTS wheel_spins (
        spin_id INT AUTO_INCREMENT PRIMARY KEY,
        player_id INT NOT NULL,
        reward_id INT NOT NULL,
        item_instance_id INT NOT NULL,
        currency_id INT NOT NULL,
        cost_paid DECIMAL(15, 2) NOT NULL,
        idempotency_key VARCHAR(64) NULL UNIQUE,
        spun_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `).catch(async () => {
      // PostgreSQL fallback syntax
      await query(`
        CREATE TABLE IF NOT EXISTS wheel_spins (
          spin_id SERIAL PRIMARY KEY,
          player_id INT NOT NULL,
          reward_id INT NOT NULL,
          item_instance_id INT NOT NULL,
          currency_id INT NOT NULL,
          cost_paid NUMERIC(15, 2) NOT NULL,
          idempotency_key VARCHAR(64) NULL UNIQUE,
          spun_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    // 5. Seed default wheel_event if none exists
    const eventCheck = await query(`SELECT event_id FROM wheel_events LIMIT 1`);
    if (eventCheck.rowCount === 0) {
      await query(`
        INSERT INTO wheel_events (event_id, event_name, currency_id, spin_cost, is_active)
        VALUES (1, 'BLACK MARKET // LUCK ROYALE', 1, 500.00, TRUE)
      `);
    }

    // 6. Seed initial rewards if empty
    const rewardsCheck = await query(`SELECT reward_id FROM wheel_rewards LIMIT 1`);
    if (rewardsCheck.rowCount === 0 && prototypeId) {
      console.log('[LUCK ROYALE] Seeding balanced tactical reward probabilities...');

      // Find item IDs for standard items
      const itemsRes = await query(`
        SELECT item_type_id, item_name, rarity FROM item_catalog
      `);
      const itemsMap = {};
      itemsRes.rows.forEach(r => { itemsMap[r.item_name] = r.item_type_id; });

      // Configured rewards matching the user's scarcity requirements:
      // - Phantom Prototype: 0.5% (0.0050), max_supply: 2 (Exclusive cap!)
      // - Obsidian Vector: 1.5% (0.0150), Mythic
      // - Phantom Circuit: 4.0% (0.0400), Legendary
      // - Redline Spectre: 6.0% (0.0600), Legendary
      // - Nightwatch: 12.0% (0.1200), Epic
      // - Apex Viper: 16.0% (0.1600), Epic
      // - Vanguard M24: 20.0% (0.2000), Rare
      // - Havoc Carbine: 20.0% (0.2000), Uncommon
      // - Shadow Walker: 20.0% (0.2000), Common
      const rewardsToSeed = [
        { name: 'Phantom Prototype', prob: 0.0050, cap: 2, order: 1 },
        { name: 'Obsidian Vector', prob: 0.0150, cap: null, order: 2 },
        { name: 'Phantom Circuit', prob: 0.0400, cap: null, order: 3 },
        { name: 'Redline Spectre', prob: 0.0600, cap: null, order: 4 },
        { name: 'Nightwatch', prob: 0.1200, cap: null, order: 5 },
        { name: 'Apex Viper', prob: 0.1600, cap: null, order: 6 },
        { name: 'Vanguard M24', prob: 0.2000, cap: null, order: 7 },
        { name: 'Havoc Carbine', prob: 0.2000, cap: null, order: 8 },
        { name: 'Shadow Walker', prob: 0.2000, cap: null, order: 9 },
      ];

      for (const r of rewardsToSeed) {
        const id = itemsMap[r.name] || (r.name === 'Phantom Prototype' ? prototypeId : null);
        if (id) {
          await query(`
            INSERT INTO wheel_rewards (event_id, item_type_id, base_probability, max_supply, awarded_count, is_active, display_order)
            VALUES (1, $1, $2, $3, 0, TRUE, $4)
          `, [id, r.prob, r.cap, r.order]);
        }
      }
      console.log('[LUCK ROYALE] [OK] Reward table seeded successfully.');
    }

    console.log('[LUCK ROYALE] [OK] Luck Royale database initialized.');
    return true;
  } catch (err) {
    console.warn('[LUCK ROYALE] Schema initialization warning:', err.message);
    return false;
  }
}

module.exports = { setupWheelSchema };

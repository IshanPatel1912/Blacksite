const { query, getClient } = require('../config/db');
const crypto = require('crypto');

/**
 * getWheelState
 * Returns the current active Luck Royale event, rewards list with dynamic
 * recalculated probabilities (redistributing exhausted supplies), and recent history.
 */
async function getWheelState(req, res) {
  const { playerId } = req.query;

  try {
    // 1. Get Active Wheel Event
    const eventRes = await query(`
      SELECT 
        we.event_id,
        we.event_name,
        we.currency_id,
        we.spin_cost,
        we.is_active,
        c.currency_name,
        c.symbol AS currency_symbol,
        c.is_premium
      FROM wheel_events we
      JOIN currencies c ON we.currency_id = c.currency_id
      WHERE we.is_active = TRUE
      LIMIT 1
    `);

    if (eventRes.rowCount === 0) {
      return res.json({
        success: true,
        active: false,
        message: 'No active Luck Royale event currently deployed.',
      });
    }

    const event = eventRes.rows[0];

    // 2. Get Rewards and Catalog specs
    const rewardsRes = await query(`
      SELECT 
        wr.reward_id,
        wr.event_id,
        wr.item_type_id,
        wr.base_probability,
        wr.max_supply,
        wr.awarded_count,
        wr.is_active,
        wr.display_order,
        c.item_name,
        c.rarity,
        c.category,
        c.asset_key,
        c.description,
        c.base_durability,
        c.is_tradable
      FROM wheel_rewards wr
      JOIN item_catalog c ON wr.item_type_id = c.item_type_id
      WHERE wr.event_id = $1 AND wr.is_active = TRUE
      ORDER BY wr.display_order ASC, wr.reward_id ASC
    `, [event.event_id]);

    const rewards = rewardsRes.rows;

    // 3. Compute dynamic probabilities & supply status
    // Rule: If max_supply is set and awarded_count >= max_supply, reward is SOLD OUT.
    // Its probability is redistributed proportionally across remaining eligible rewards.
    let eligibleWeightSum = 0;
    const evaluatedRewards = rewards.map((r) => {
      const baseProb = parseFloat(r.base_probability);
      const maxSupply = r.max_supply !== null && r.max_supply !== undefined ? parseInt(r.max_supply, 10) : null;
      const awarded = parseInt(r.awarded_count || 0, 10);
      const isSoldOut = maxSupply !== null && awarded >= maxSupply;
      const remainingSupply = maxSupply !== null ? Math.max(0, maxSupply - awarded) : null;

      if (!isSoldOut) {
        eligibleWeightSum += baseProb;
      }

      return {
        ...r,
        base_probability: baseProb,
        max_supply: maxSupply,
        awarded_count: awarded,
        remaining_supply: remainingSupply,
        is_sold_out: isSoldOut,
        is_exclusive: maxSupply !== null,
      };
    });

    const finalizedRewards = evaluatedRewards.map((r) => {
      let effectiveProb = 0;
      if (!r.is_sold_out && eligibleWeightSum > 0) {
        effectiveProb = r.base_probability / eligibleWeightSum;
      }

      return {
        ...r,
        effective_probability: effectiveProb,
        effective_percentage: (effectiveProb * 100).toFixed(2) + '%',
        base_percentage: (r.base_probability * 100).toFixed(2) + '%',
      };
    });

    // 4. Player Balance & Player-Specific Status
    let playerBalance = 0;
    let playerRecentSpins = [];

    if (playerId) {
      const walletRes = await query(`
        SELECT balance FROM wallets
        WHERE player_id = $1 AND currency_id = $2
      `, [playerId, event.currency_id]);

      if (walletRes.rowCount > 0) {
        playerBalance = parseFloat(walletRes.rows[0].balance);
      }

      const playerHistoryRes = await query(`
        SELECT 
          ws.spin_id,
          ws.cost_paid,
          ws.spun_at,
          c.item_name,
          c.rarity,
          c.category,
          c.asset_key
        FROM wheel_spins ws
        JOIN wheel_rewards wr ON ws.reward_id = wr.reward_id
        JOIN item_catalog c ON wr.item_type_id = c.item_type_id
        WHERE ws.player_id = $1
        ORDER BY ws.spun_at DESC
        LIMIT 10
      `, [playerId]);

      playerRecentSpins = playerHistoryRes.rows;
    }

    // 5. Recent Global Winners (Last 15)
    const recentGlobalRes = await query(`
      SELECT 
        ws.spin_id,
        ws.spun_at,
        p.username,
        c.item_name,
        c.rarity,
        c.category,
        c.asset_key,
        wr.max_supply
      FROM wheel_spins ws
      JOIN players p ON ws.player_id = p.player_id
      JOIN wheel_rewards wr ON ws.reward_id = wr.reward_id
      JOIN item_catalog c ON wr.item_type_id = c.item_type_id
      ORDER BY ws.spun_at DESC
      LIMIT 15
    `);

    res.json({
      success: true,
      active: true,
      event: {
        eventId: event.event_id,
        eventName: event.event_name,
        currencyId: event.currency_id,
        currencyName: event.currency_name,
        currencySymbol: event.currency_symbol,
        isPremium: event.is_premium,
        spinCost: parseFloat(event.spin_cost),
      },
      rewards: finalizedRewards,
      player: {
        balance: playerBalance,
        canAfford: playerBalance >= parseFloat(event.spin_cost),
        recentSpins: playerRecentSpins,
      },
      recentWinners: recentGlobalRes.rows,
    });
  } catch (err) {
    console.error('[WHEEL] getWheelState error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * executeSpin
 * Atomic, concurrency-safe server-side reward execution.
 * Validates balance, selects reward, enforces global supply cap,
 * deducts currency, grants item, and records spin history within a transaction.
 */
async function executeSpin(req, res) {
  const { playerId, idempotencyKey } = req.body;

  if (!playerId) {
    return res.status(400).json({ success: false, error: 'playerId is required.' });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Idempotency Check: if identical key was submitted, return previous result
    if (idempotencyKey && String(idempotencyKey).trim()) {
      const existingSpin = await client.query(`
        SELECT 
          ws.spin_id,
          ws.cost_paid,
          ws.spun_at,
          c.item_type_id,
          c.item_name,
          c.rarity,
          c.category,
          c.asset_key,
          c.description,
          wr.max_supply,
          wr.awarded_count
        FROM wheel_spins ws
        JOIN wheel_rewards wr ON ws.reward_id = wr.reward_id
        JOIN item_catalog c ON wr.item_type_id = c.item_type_id
        WHERE ws.idempotency_key = $1
      `, [idempotencyKey]);

      if (existingSpin.rowCount > 0) {
        await client.query('COMMIT');
        const s = existingSpin.rows[0];
        return res.json({
          success: true,
          idempotentReplay: true,
          reward: {
            item_type_id: s.item_type_id,
            item_name: s.item_name,
            rarity: s.rarity,
            category: s.category,
            asset_key: s.asset_key,
            description: s.description,
            is_exclusive: s.max_supply !== null,
          },
          spinId: s.spin_id,
          message: 'Previous spin retrieved via idempotency token.',
        });
      }
    }

    // 2. Fetch Active Event Configuration
    const eventRes = await client.query(`
      SELECT event_id, currency_id, spin_cost, is_active
      FROM wheel_events
      WHERE is_active = TRUE
      LIMIT 1
    `);

    if (eventRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Luck Royale event is currently not active.' });
    }

    const event = eventRes.rows[0];
    const spinCost = parseFloat(event.spin_cost);

    // 3. Lock Player's Wallet and verify balance
    const walletRes = await client.query(`
      SELECT wallet_id, balance
      FROM wallets
      WHERE player_id = $1 AND currency_id = $2
      FOR UPDATE
    `, [playerId, event.currency_id]);

    if (walletRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Player wallet for this currency not found.' });
    }

    const currentBalance = parseFloat(walletRes.rows[0].balance);
    if (currentBalance < spinCost) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Required: ${spinCost}, Available: ${currentBalance}`,
        code: 'INSUFFICIENT_FUNDS',
      });
    }

    // 4. Lock Reward Rows to prevent concurrent supply overflow
    const rewardsRes = await client.query(`
      SELECT 
        wr.reward_id,
        wr.item_type_id,
        wr.base_probability,
        wr.max_supply,
        wr.awarded_count,
        wr.is_active,
        c.item_name,
        c.rarity,
        c.category,
        c.asset_key,
        c.description,
        c.base_durability
      FROM wheel_rewards wr
      JOIN item_catalog c ON wr.item_type_id = c.item_type_id
      WHERE wr.event_id = $1 AND wr.is_active = TRUE
      FOR UPDATE
    `, [event.event_id]);

    if (rewardsRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No active rewards found for this event.' });
    }

    // 5. Filter eligible rewards (enforcing supply cap)
    const eligibleRewards = rewardsRes.rows.filter((r) => {
      if (r.max_supply === null || r.max_supply === undefined) return true;
      return parseInt(r.awarded_count, 10) < parseInt(r.max_supply, 10);
    });

    if (eligibleRewards.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'All limited rewards have been exhausted. Event sold out.',
        code: 'ALL_SOLD_OUT',
      });
    }

    // 6. Server-side Weighted Selection
    const totalWeight = eligibleRewards.reduce((sum, r) => sum + parseFloat(r.base_probability), 0);

    // Cryptographic uniform random in [0, totalWeight)
    const randomBuffer = crypto.randomBytes(4);
    const randomFloat = randomBuffer.readUInt32LE(0) / 0xffffffff;
    const target = randomFloat * totalWeight;

    let cumulative = 0;
    let selectedReward = eligibleRewards[0];

    for (const r of eligibleRewards) {
      cumulative += parseFloat(r.base_probability);
      if (target <= cumulative) {
        selectedReward = r;
        break;
      }
    }

    // 7. Strict double-check for exclusive cap
    const isExclusive = selectedReward.max_supply !== null && selectedReward.max_supply !== undefined;
    if (isExclusive) {
      const currentAwarded = parseInt(selectedReward.awarded_count, 10);
      const cap = parseInt(selectedReward.max_supply, 10);
      if (currentAwarded >= cap) {
        // Fallback to next unlimited eligible reward to guarantee cap integrity
        const unlimited = eligibleRewards.find((r) => r.max_supply === null);
        selectedReward = unlimited || eligibleRewards[0];
      }
    }

    // 8. Deduct Spin Cost from Player Wallet
    await client.query(`
      UPDATE wallets
      SET balance = balance - $1
      WHERE player_id = $2 AND currency_id = $3
    `, [spinCost, playerId, event.currency_id]);

    const newBalance = currentBalance - spinCost;

    // 9. Grant Item Instance to Player Inventory
    const invRes = await client.query(`
      INSERT INTO inventories (player_id, item_type_id, durability, is_equipped)
      VALUES ($1, $2, $3, FALSE)
    `, [playerId, selectedReward.item_type_id, selectedReward.base_durability || 100]);

    // Handle insertId for MySQL / returning for Postgres
    let itemInstanceId = invRes.insertId;
    if (!itemInstanceId) {
      const lastItemRes = await client.query(`
        SELECT item_instance_id FROM inventories
        WHERE player_id = $1 AND item_type_id = $2
        ORDER BY item_instance_id DESC LIMIT 1
      `, [playerId, selectedReward.item_type_id]);
      itemInstanceId = lastItemRes.rows[0]?.item_instance_id;
    }

    // 10. Update Awarded Count on Wheel Reward
    await client.query(`
      UPDATE wheel_rewards
      SET awarded_count = awarded_count + 1
      WHERE reward_id = $1
    `, [selectedReward.reward_id]);

    const updatedAwarded = parseInt(selectedReward.awarded_count, 10) + 1;
    const remainingCopies = selectedReward.max_supply !== null
      ? Math.max(0, parseInt(selectedReward.max_supply, 10) - updatedAwarded)
      : null;

    // 11. Insert Record into wheel_spins
    const spinKey = idempotencyKey || crypto.randomUUID();
    const spinRes = await client.query(`
      INSERT INTO wheel_spins (player_id, reward_id, item_instance_id, currency_id, cost_paid, idempotency_key)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [playerId, selectedReward.reward_id, itemInstanceId, event.currency_id, spinCost, spinKey]);

    const spinId = spinRes.insertId || Date.now();

    // 12. Record in Audit Logs
    const auditDetails = JSON.stringify({
      event: 'LUCK_ROYALE_SPIN',
      reward: selectedReward.item_name,
      rarity: selectedReward.rarity,
      cost: spinCost,
      remainingSupply: remainingCopies,
      itemInstanceId,
    });

    await client.query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'LUCK_ROYALE_SPIN', $2)
    `, [playerId, auditDetails]);

    // Commit Transaction
    await client.query('COMMIT');

    res.json({
      success: true,
      spinId,
      reward: {
        reward_id: selectedReward.reward_id,
        item_type_id: selectedReward.item_type_id,
        item_name: selectedReward.item_name,
        rarity: selectedReward.rarity,
        category: selectedReward.category,
        asset_key: selectedReward.asset_key,
        description: selectedReward.description,
        is_exclusive: isExclusive,
        item_instance_id: itemInstanceId,
        remaining_supply: remainingCopies,
      },
      cost: spinCost,
      newBalance,
      message: isExclusive
        ? `CLASSIFIED DROP SECURED! You obtained the exclusive ${selectedReward.item_name}!`
        : `Requisition successful: ${selectedReward.item_name} added to your Armory.`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[WHEEL] executeSpin error:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

/**
 * getAdminConfig
 * Returns full configuration, probabilities, and supply counters for admin inspection.
 */
async function getAdminConfig(req, res) {
  try {
    const eventRes = await query(`
      SELECT we.*, c.currency_name, c.symbol
      FROM wheel_events we
      JOIN currencies c ON we.currency_id = c.currency_id
      ORDER BY we.event_id ASC
    `);

    const rewardsRes = await query(`
      SELECT 
        wr.*,
        c.item_name,
        c.rarity,
        c.category,
        c.asset_key,
        c.is_tradable
      FROM wheel_rewards wr
      JOIN item_catalog c ON wr.item_type_id = c.item_type_id
      ORDER BY wr.display_order ASC, wr.reward_id ASC
    `);

    const statsRes = await query(`
      SELECT 
        COUNT(*) AS total_spins,
        COALESCE(SUM(cost_paid), 0) AS total_revenue
      FROM wheel_spins
    `);

    res.json({
      success: true,
      events: eventRes.rows,
      rewards: rewardsRes.rows,
      stats: statsRes.rows[0] || { total_spins: 0, total_revenue: 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * updateRewardConfig
 * Admin update for reward probability, max_supply, and active status.
 */
async function updateRewardConfig(req, res) {
  const { rewardId } = req.params;
  const { baseProbability, maxSupply, isActive } = req.body;

  try {
    const parsedProb = parseFloat(baseProbability);
    if (isNaN(parsedProb) || parsedProb < 0 || parsedProb > 1) {
      return res.status(400).json({ success: false, error: 'Probability must be between 0.0000 and 1.0000' });
    }

    const parsedSupply = maxSupply === '' || maxSupply === null ? null : parseInt(maxSupply, 10);
    if (parsedSupply !== null && (isNaN(parsedSupply) || parsedSupply < 0)) {
      return res.status(400).json({ success: false, error: 'Max supply must be a positive integer or null (unlimited)' });
    }

    await query(`
      UPDATE wheel_rewards
      SET base_probability = $1, max_supply = $2, is_active = $3
      WHERE reward_id = $4
    `, [parsedProb, parsedSupply, isActive !== false, rewardId]);

    res.json({ success: true, message: 'Reward configuration updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * updateEventConfig
 * Admin update for event cost, currency, or active status.
 */
async function updateEventConfig(req, res) {
  const { eventId, spinCost, currencyId, isActive } = req.body;

  try {
    const parsedCost = parseFloat(spinCost);
    if (isNaN(parsedCost) || parsedCost <= 0) {
      return res.status(400).json({ success: false, error: 'Spin cost must be a positive number.' });
    }

    await query(`
      UPDATE wheel_events
      SET spin_cost = $1, currency_id = $2, is_active = $3
      WHERE event_id = $4
    `, [parsedCost, currencyId || 1, isActive !== false, eventId || 1]);

    res.json({ success: true, message: 'Event configuration updated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * getSpinHistory
 * Full paginated history for admin audit.
 */
async function getSpinHistory(req, res) {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const historyRes = await query(`
      SELECT 
        ws.spin_id,
        ws.player_id,
        p.username,
        ws.cost_paid,
        cur.symbol AS currency_symbol,
        c.item_name,
        c.rarity,
        c.category,
        wr.max_supply,
        ws.spun_at,
        ws.idempotency_key
      FROM wheel_spins ws
      JOIN players p ON ws.player_id = p.player_id
      JOIN wheel_rewards wr ON ws.reward_id = wr.reward_id
      JOIN item_catalog c ON wr.item_type_id = c.item_type_id
      JOIN currencies cur ON ws.currency_id = cur.currency_id
      ORDER BY ws.spun_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit, 10), parseInt(offset, 10)]);

    res.json({ success: true, data: historyRes.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getWheelState,
  executeSpin,
  getAdminConfig,
  updateRewardConfig,
  updateEventConfig,
  getSpinHistory,
};

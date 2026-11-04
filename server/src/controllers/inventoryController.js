const { query, getClient } = require('../config/db');

async function getInventory(req, res) {
  const playerId = parseInt(req.query.playerId || '1', 10);
  const { search, rarity, category, tradable, availability, sort = 'acquired_desc' } = req.query;

  try {
    let sql = `
      SELECT 
        i.item_instance_id,
        i.player_id,
        i.durability,
        i.is_equipped,
        i.acquired_at,
        c.item_type_id,
        c.item_name,
        c.rarity,
        c.category,
        c.is_tradable,
        c.base_durability,
        c.asset_key,
        c.description,
        CASE 
          WHEN ml.listing_id IS NOT NULL THEN 'LISTED'
          WHEN ti.trade_item_id IS NOT NULL THEN 'IN_TRADE'
          ELSE 'AVAILABLE'
        END AS availability_status,
        ml.listing_id AS active_listing_id,
        ml.price AS listing_price
      FROM inventories i
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      LEFT JOIN market_listings ml ON i.item_instance_id = ml.item_instance_id AND ml.status = 'active'
      LEFT JOIN (
        SELECT DISTINCT item_instance_id, trade_item_id 
        FROM trade_items ti_sub
        JOIN trades t_sub ON ti_sub.trade_id = t_sub.trade_id
        WHERE t_sub.status = 'pending'
      ) ti ON i.item_instance_id = ti.item_instance_id
      WHERE i.player_id = $1
    `;

    const params = [playerId];
    let paramIndex = 2;

    if (search && search.trim()) {
      sql += ` AND (c.item_name ILIKE $${paramIndex} OR c.category ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (rarity && rarity !== 'ALL') {
      sql += ` AND c.rarity = $${paramIndex}`;
      params.push(rarity);
      paramIndex++;
    }

    if (category && category !== 'ALL') {
      sql += ` AND c.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (tradable !== undefined && tradable !== 'ALL') {
      sql += ` AND c.is_tradable = $${paramIndex}`;
      params.push(tradable === 'true');
      paramIndex++;
    }

    // Availability filter
    if (availability === 'AVAILABLE') {
      sql += ` AND ml.listing_id IS NULL AND ti.trade_item_id IS NULL`;
    } else if (availability === 'LISTED') {
      sql += ` AND ml.listing_id IS NOT NULL`;
    } else if (availability === 'IN_TRADE') {
      sql += ` AND ti.trade_item_id IS NOT NULL`;
    }

    // Sorting
    switch (sort) {
      case 'rarity_desc':
        sql += ` ORDER BY CASE c.rarity WHEN 'Mythic' THEN 1 WHEN 'Legendary' THEN 2 WHEN 'Epic' THEN 3 WHEN 'Rare' THEN 4 WHEN 'Uncommon' THEN 5 ELSE 6 END ASC, i.item_instance_id DESC`;
        break;
      case 'durability_asc':
        sql += ` ORDER BY i.durability ASC`;
        break;
      case 'durability_desc':
        sql += ` ORDER BY i.durability DESC`;
        break;
      case 'name_asc':
        sql += ` ORDER BY c.item_name ASC`;
        break;
      case 'acquired_asc':
        sql += ` ORDER BY i.acquired_at ASC`;
        break;
      case 'acquired_desc':
      default:
        sql += ` ORDER BY i.is_equipped DESC, i.acquired_at DESC`;
        break;
    }

    const result = await query(sql, params);

    res.json({
      success: true,
      count: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Equip or Unequip Item Instance
async function toggleEquip(req, res) {
  const { itemInstanceId, playerId } = req.body;
  if (!itemInstanceId || !playerId) {
    return res.status(400).json({ success: false, error: 'itemInstanceId and playerId are required.' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify ownership and get category
    const itemRes = await client.query(`
      SELECT i.item_instance_id, i.player_id, i.is_equipped, c.category, c.item_name
      FROM inventories i
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      WHERE i.item_instance_id = $1 AND i.player_id = $2
      FOR UPDATE OF i
    `, [itemInstanceId, playerId]);

    if (itemRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Item not found in player armory.' });
    }

    const currentItem = itemRes.rows[0];
    const willEquip = !currentItem.is_equipped;

    if (willEquip) {
      // Unequip any other item of the same category
      await client.query(`
        UPDATE inventories i
        SET is_equipped = FALSE
        FROM item_catalog c
        WHERE i.item_type_id = c.item_type_id
          AND i.player_id = $1
          AND c.category = $2
          AND i.item_instance_id <> $3;
      `, [playerId, currentItem.category, itemInstanceId]);
    }

    // Toggle current item
    await client.query(`
      UPDATE inventories SET is_equipped = $1 WHERE item_instance_id = $2;
    `, [willEquip, itemInstanceId]);

    // Audit log
    await client.query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, $2, $3);
    `, [
      playerId,
      willEquip ? 'ITEM_EQUIPPED' : 'ITEM_UNEQUIPPED',
      `${willEquip ? 'Equipped' : 'Unequipped'} ${currentItem.item_name} (#${itemInstanceId}) [${currentItem.category}].`
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      isEquipped: willEquip,
      message: `${currentItem.item_name} ${willEquip ? 'equipped to operator loadout' : 'unequipped'}.`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// Repair Item Durability
async function repairItem(req, res) {
  const { itemInstanceId, playerId } = req.body;
  if (!itemInstanceId || !playerId) {
    return res.status(400).json({ success: false, error: 'itemInstanceId and playerId are required.' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch item instance
    const itemRes = await client.query(`
      SELECT i.item_instance_id, i.durability, c.item_name, c.base_durability
      FROM inventories i
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      WHERE i.item_instance_id = $1 AND i.player_id = $2
      FOR UPDATE OF i
    `, [itemInstanceId, playerId]);

    if (itemRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Item not found in player armory.' });
    }

    const item = itemRes.rows[0];
    if (item.durability >= 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Item is already at 100% maximum durability.' });
    }

    const missingDurability = 100 - item.durability;
    const repairCost = missingDurability * 15; // 15 Combat Credits per 1% repair

    // Check player standard wallet (currency_id = 1)
    const walletRes = await client.query(`
      SELECT wallet_id, balance FROM wallets
      WHERE player_id = $1 AND currency_id = 1
      FOR UPDATE
    `, [playerId]);

    if (walletRes.rowCount === 0 || walletRes.rows[0].balance < repairCost) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Insufficient Combat Credits. Repair requires ${repairCost} CR.`
      });
    }

    // Deduct repair cost
    await client.query(`
      UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2;
    `, [repairCost, walletRes.rows[0].wallet_id]);

    // Restore durability
    await client.query(`
      UPDATE inventories SET durability = 100 WHERE item_instance_id = $1;
    `, [itemInstanceId]);

    // Audit log
    await client.query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'ITEM_REPAIRED', $2);
    `, [
      playerId,
      `Repaired ${item.item_name} (#${itemInstanceId}) from ${item.durability}% to 100% for ${repairCost} Combat Credits.`
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      newDurability: 100,
      costPaid: repairCost,
      message: `${item.item_name} restored to 100% condition.`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

module.exports = {
  getInventory,
  toggleEquip,
  repairItem,
};

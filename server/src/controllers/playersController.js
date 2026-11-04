const { query } = require('../config/db');

// Get all players (demonstration accounts)
async function getPlayers(req, res) {
  try {
    const result = await query(`
      SELECT 
        p.player_id,
        p.username,
        p.email,
        p.status,
        p.created_at,
        COUNT(DISTINCT i.item_instance_id) AS total_items,
        COUNT(DISTINCT ml.listing_id) AS active_listings
      FROM players p
      LEFT JOIN inventories i ON p.player_id = i.player_id
      LEFT JOIN market_listings ml ON p.player_id = ml.seller_id AND ml.status = 'active'
      GROUP BY p.player_id, p.username, p.email, p.status, p.created_at
      ORDER BY p.player_id ASC;
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get player profile by ID
async function getPlayerById(req, res) {
  const playerId = parseInt(req.params.id, 10);
  if (isNaN(playerId)) {
    return res.status(400).json({ success: false, error: 'Invalid player ID' });
  }

  try {
    const playerRes = await query(
      `SELECT player_id, username, email, status, created_at FROM players WHERE player_id = $1`,
      [playerId]
    );

    if (playerRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const walletsRes = await query(`
      SELECT w.wallet_id, w.currency_id, w.balance, c.currency_name, c.is_premium, c.symbol
      FROM wallets w
      JOIN currencies c ON w.currency_id = c.currency_id
      WHERE w.player_id = $1
      ORDER BY c.is_premium ASC, c.currency_id ASC;
    `, [playerId]);

    const statsRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM inventories WHERE player_id = $1) AS inventory_count,
        (SELECT COUNT(*) FROM market_listings WHERE seller_id = $1 AND status = 'active') AS active_listings,
        (SELECT COUNT(*) FROM trades WHERE (initiator_id = $1 OR receiver_id = $1) AND status = 'pending') AS pending_trades;
    `, [playerId]);

    res.json({
      success: true,
      data: {
        player: playerRes.rows[0],
        wallets: walletsRes.rows,
        stats: statsRes.rows[0],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Admin: Update player status
async function updatePlayerStatus(req, res) {
  const playerId = parseInt(req.params.id, 10);
  const { status, reason } = req.body;

  const validStatuses = ['active', 'suspended', 'offline', 'banned'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const updateRes = await query(`
      UPDATE players
      SET status = $1
      WHERE player_id = $2;
    `, [status, playerId]);

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Player record not found.' });
    }

    // Insert into audit trail
    const details = JSON.stringify({
      target_player_id: playerId,
      new_status: status,
      reason: reason || 'COMMAND_OVERSEER_MODERATION',
    });
    await query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'PLAYER_STATUS_MODIFIED', $2);
    `, [playerId, details]);

    res.json({
      success: true,
      message: `Operator #${playerId} status updated to ${status.toUpperCase()}!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getPlayers,
  getPlayerById,
  updatePlayerStatus,
};

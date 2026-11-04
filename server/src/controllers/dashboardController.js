const { query } = require('../config/db');

async function getDashboardData(req, res) {
  const playerId = parseInt(req.query.playerId || '1', 10);

  try {
    // 1. Player Info & Wallets
    const playerRes = await query(`
      SELECT player_id, username, email, status, created_at FROM players WHERE player_id = $1
    `, [playerId]);

    if (playerRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const walletsRes = await query(`
      SELECT w.wallet_id, w.currency_id, w.balance, c.currency_name, c.is_premium, c.symbol
      FROM wallets w
      JOIN currencies c ON w.currency_id = c.currency_id
      WHERE w.player_id = $1
      ORDER BY c.is_premium ASC;
    `, [playerId]);

    // 2. Counts - Execute robust independent queries
    const [invCountRes, listCountRes, tradesCountRes, totalListingsRes] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM inventories WHERE player_id = $1', [playerId]),
      query("SELECT COUNT(*) AS count FROM market_listings WHERE seller_id = $1 AND status = 'active'", [playerId]),
      query("SELECT COUNT(*) AS count FROM trades WHERE (initiator_id = $1 OR receiver_id = $2) AND status = 'pending'", [playerId, playerId]),
      query("SELECT COUNT(*) AS count FROM market_listings WHERE status = 'active'"),
    ]);

    const counts = {
      inventory_count: parseInt(invCountRes.rows[0]?.count || 0, 10),
      active_listings_count: parseInt(listCountRes.rows[0]?.count || 0, 10),
      pending_trades_count: parseInt(tradesCountRes.rows[0]?.count || 0, 10),
      total_market_listings: parseInt(totalListingsRes.rows[0]?.count || 0, 10),
    };

    // 3. Equipped Gear for 3D Operator Avatar Preview
    const equippedRes = await query(`
      SELECT 
        i.item_instance_id,
        i.durability,
        c.item_name,
        c.rarity,
        c.category,
        c.asset_key,
        c.description
      FROM inventories i
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      WHERE i.player_id = $1 AND i.is_equipped = TRUE;
    `, [playerId]);

    // 4. Rare / Legendary Highlights
    const rareRes = await query(`
      SELECT 
        i.item_instance_id,
        i.durability,
        c.item_name,
        c.rarity,
        c.category,
        c.asset_key
      FROM inventories i
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      WHERE i.player_id = $1 AND c.rarity IN ('Rare', 'Epic', 'Legendary', 'Mythic')
      ORDER BY 
        CASE c.rarity 
          WHEN 'Mythic' THEN 1 
          WHEN 'Legendary' THEN 2 
          WHEN 'Epic' THEN 3 
          ELSE 4 
        END ASC
      LIMIT 4;
    `, [playerId]);

    // 5. Recent Activity from Audit Logs
    const activityRes = await query(`
      SELECT log_id, action_type, details, created_at
      FROM audit_logs
      WHERE player_id = $1 OR player_id IS NULL
      ORDER BY created_at DESC
      LIMIT 6;
    `, [playerId]);

    // 6. Featured Store Offers
    const offersRes = await query(`
      SELECT 
        so.offer_id,
        so.price,
        so.stock_limit,
        so.stock_sold,
        (so.stock_limit - so.stock_sold) AS remaining_stock,
        c.item_name,
        c.rarity,
        c.category,
        c.asset_key,
        cur.symbol AS currency_symbol
      FROM store_offers so
      JOIN item_catalog c ON so.item_type_id = c.item_type_id
      JOIN currencies cur ON so.currency_id = cur.currency_id
      WHERE so.status = 'available'
      ORDER BY so.created_at DESC
      LIMIT 3;
    `);

    // 7. Market Highlights
    const marketRes = await query(`
      SELECT 
        ml.listing_id,
        ml.price,
        c.item_name,
        c.rarity,
        c.category,
        p.username AS seller_name,
        cur.symbol AS currency_symbol
      FROM market_listings ml
      JOIN inventories i ON ml.item_instance_id = i.item_instance_id
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      JOIN players p ON ml.seller_id = p.player_id
      JOIN currencies cur ON ml.currency_id = cur.currency_id
      WHERE ml.status = 'active'
      ORDER BY ml.created_at DESC
      LIMIT 4;
    `);

    res.json({
      success: true,
      data: {
        player: playerRes.rows[0],
        wallets: walletsRes.rows,
        counts: counts,
        equipped: equippedRes.rows,
        rareItems: rareRes.rows,
        recentActivity: activityRes.rows,
        featuredOffers: offersRes.rows,
        marketHighlights: marketRes.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Global Administrative Economy & System Metrics
async function getAdminMetrics(req, res) {
  try {
    const [playersRes, itemsRes, marketRes, tradesRes, storeRes, circulationRes, auditRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active FROM players;`),
      query(`SELECT COUNT(*) AS total_instances, COUNT(DISTINCT item_type_id) AS distinct_types FROM inventories;`),
      query(`SELECT COUNT(*) AS active_listings, COALESCE(SUM(price), 0) AS market_volume FROM market_listings WHERE status = 'active';`),
      query(`SELECT COUNT(*) AS total_trades, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_trades FROM trades;`),
      query(`SELECT COUNT(*) AS total_offers, SUM(stock_sold) AS total_sold, SUM(stock_limit - stock_sold) AS available_stock FROM store_offers;`),
      query(`SELECT c.currency_name, c.symbol, c.is_premium, COALESCE(SUM(w.balance), 0) AS total_circulation FROM currencies c LEFT JOIN wallets w ON c.currency_id = w.currency_id GROUP BY c.currency_id, c.currency_name, c.symbol, c.is_premium;`),
      query(`SELECT a.log_id, a.action_type, a.details, a.created_at, p.username FROM audit_logs a LEFT JOIN players p ON a.player_id = p.player_id ORDER BY a.created_at DESC LIMIT 8;`)
    ]);

    res.json({
      success: true,
      data: {
        players: playersRes.rows[0] || {},
        inventory: itemsRes.rows[0] || {},
        market: marketRes.rows[0] || {},
        trades: tradesRes.rows[0] || {},
        store: storeRes.rows[0] || {},
        circulation: circulationRes.rows || [],
        recentAudits: auditRes.rows || [],
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDashboardData,
  getAdminMetrics,
};

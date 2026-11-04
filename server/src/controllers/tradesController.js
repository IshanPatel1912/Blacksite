const { query, getClient } = require('../config/db');

// List Trades for a player (incoming, outgoing, historical)
async function getTrades(req, res) {
  const playerId = parseInt(req.query.playerId || '1', 10);
  const { status = 'ALL' } = req.query;

  try {
    let sql = `
      SELECT 
        t.trade_id,
        t.initiator_id,
        p_init.username AS initiator_name,
        t.receiver_id,
        p_rec.username AS receiver_name,
        t.status,
        t.created_at,
        t.resolved_at,
        CASE WHEN t.initiator_id = $1 THEN 'OUTGOING' ELSE 'INCOMING' END AS trade_direction
      FROM trades t
      JOIN players p_init ON t.initiator_id = p_init.player_id
      JOIN players p_rec ON t.receiver_id = p_rec.player_id
      WHERE (t.initiator_id = $1 OR t.receiver_id = $1)
    `;

    const params = [playerId];
    if (status !== 'ALL') {
      sql += ` AND t.status = $2`;
      params.push(status);
    }

    sql += ` ORDER BY CASE t.status WHEN 'pending' THEN 1 ELSE 2 END ASC, t.created_at DESC;`;

    const tradesResult = await query(sql, params);
    const trades = tradesResult.rows;

    if (trades.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const tradeIds = trades.map(t => t.trade_id);

    // Fetch items in these trades
    const itemsResult = await query(`
      SELECT 
        ti.trade_id,
        ti.trade_item_id,
        ti.item_instance_id,
        ti.player_id AS offered_by_player_id,
        p.username AS offered_by_name,
        c.item_name,
        c.rarity,
        c.category,
        c.asset_key,
        i.durability
      FROM trade_items ti
      JOIN players p ON ti.player_id = p.player_id
      JOIN inventories i ON ti.item_instance_id = i.item_instance_id
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      WHERE ti.trade_id = ANY($1::int[]);
    `, [tradeIds]);

    // Fetch currencies in these trades
    const currenciesResult = await query(`
      SELECT 
        tc.trade_id,
        tc.trade_currency_id,
        tc.currency_id,
        tc.player_id AS offered_by_player_id,
        p.username AS offered_by_name,
        tc.amount,
        cur.currency_name,
        cur.symbol AS currency_symbol,
        cur.is_premium
      FROM trade_currencies tc
      JOIN players p ON tc.player_id = p.player_id
      JOIN currencies cur ON tc.currency_id = cur.currency_id
      WHERE tc.trade_id = ANY($1::int[]);
    `, [tradeIds]);

    // Assemble rich trade objects
    const itemsByTrade = {};
    for (const item of itemsResult.rows) {
      if (!itemsByTrade[item.trade_id]) itemsByTrade[item.trade_id] = [];
      itemsByTrade[item.trade_id].push(item);
    }

    const currenciesByTrade = {};
    for (const curr of currenciesResult.rows) {
      if (!currenciesByTrade[curr.trade_id]) currenciesByTrade[curr.trade_id] = [];
      currenciesByTrade[curr.trade_id].push(curr);
    }

    const enrichedTrades = trades.map(t => ({
      ...t,
      items: itemsByTrade[t.trade_id] || [],
      currencies: currenciesByTrade[t.trade_id] || [],
    }));

    res.json({
      success: true,
      count: enrichedTrades.length,
      data: enrichedTrades,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Propose a new Trade
async function createTrade(req, res) {
  const {
    initiatorId,
    receiverId,
    itemInstanceIds = [], // items offered by initiator
    currencyOffers = [], // [{ currencyId, amount }]
  } = req.body;

  if (!initiatorId || !receiverId) {
    return res.status(400).json({ success: false, error: 'initiatorId and receiverId are required.' });
  }

  if (parseInt(initiatorId, 10) === parseInt(receiverId, 10)) {
    return res.status(400).json({ success: false, error: 'Cannot trade with yourself.' });
  }

  if (itemInstanceIds.length === 0 && currencyOffers.length === 0) {
    return res.status(400).json({ success: false, error: 'Must offer at least one item or currency amount.' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify receiver exists
    const recCheck = await client.query('SELECT player_id, username FROM players WHERE player_id = $1', [receiverId]);
    if (recCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Recipient player does not exist.' });
    }

    // 2. Verify all offered items belong to initiator, are tradable, not listed, not broken
    for (const instanceId of itemInstanceIds) {
      const itemCheck = await client.query(`
        SELECT i.item_instance_id, i.durability, c.is_tradable, c.item_name
        FROM inventories i
        JOIN item_catalog c ON i.item_type_id = c.item_type_id
        WHERE i.item_instance_id = $1 AND i.player_id = $2
        FOR UPDATE OF i;
      `, [instanceId, initiatorId]);

      if (itemCheck.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: `Item #${instanceId} not found in your armory.` });
      }

      const item = itemCheck.rows[0];
      if (!item.is_tradable) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: `${item.item_name} is non-tradable.` });
      }

      // Check active listing
      const listedCheck = await client.query(
        "SELECT listing_id FROM market_listings WHERE item_instance_id = $1 AND status = 'active'",
        [instanceId]
      );
      if (listedCheck.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: `${item.item_name} is currently listed on the marketplace.` });
      }
    }

    // 3. Verify initiator has sufficient currency for all offered currencies
    for (const offer of currencyOffers) {
      const amt = parseFloat(offer.amount);
      if (amt <= 0) continue;

      const walletCheck = await client.query(`
        SELECT wallet_id, balance FROM wallets
        WHERE player_id = $1 AND currency_id = $2
        FOR UPDATE;
      `, [initiatorId, offer.currencyId]);

      if (walletCheck.rowCount === 0 || parseFloat(walletCheck.rows[0].balance) < amt) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Insufficient balance for currency #${offer.currencyId}.`,
        });
      }
    }

    // 4. Create master trade record
    const tradeRes = await client.query(`
      INSERT INTO trades (initiator_id, receiver_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING trade_id;
    `, [initiatorId, receiverId]);

    const tradeId = tradeRes.rows[0].trade_id;

    // 5. Insert trade items
    for (const instanceId of itemInstanceIds) {
      await client.query(`
        INSERT INTO trade_items (trade_id, item_instance_id, player_id)
        VALUES ($1, $2, $3);
      `, [tradeId, instanceId, initiatorId]);
    }

    // 6. Insert trade currencies
    for (const offer of currencyOffers) {
      const amt = parseFloat(offer.amount);
      if (amt > 0) {
        await client.query(`
          INSERT INTO trade_currencies (trade_id, currency_id, player_id, amount)
          VALUES ($1, $2, $3, $4);
        `, [tradeId, offer.currencyId, initiatorId, amt]);
      }
    }

    // 7. Write audit log
    await client.query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'TRADE_PROPOSED', $2);
    `, [
      initiatorId,
      `Proposed bilateral Trade #${tradeId} to Operator #${receiverId} with ${itemInstanceIds.length} items and ${currencyOffers.length} currency pledges.`
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Trade proposal dispatched to ${recCheck.rows[0].username}.`,
      tradeId,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// Accept a Trade (Atomic Bilateral Execution)
async function acceptTrade(req, res) {
  const tradeId = parseInt(req.params.id, 10);
  const { acceptorId } = req.body;

  if (!tradeId || !acceptorId) {
    return res.status(400).json({ success: false, error: 'tradeId and acceptorId are required.' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Lock trade row
    const tradeRes = await client.query(`
      SELECT trade_id, initiator_id, receiver_id, status
      FROM trades
      WHERE trade_id = $1
      FOR UPDATE;
    `, [tradeId]);

    if (tradeRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Trade not found.' });
    }

    const trade = tradeRes.rows[0];

    if (trade.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: `Trade cannot be accepted; status is '${trade.status}'.` });
    }

    if (trade.receiver_id !== parseInt(acceptorId, 10)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Only the designated recipient can accept this trade.' });
    }

    // 2. Lock and verify all items in the trade
    const itemsRes = await client.query(`
      SELECT ti.item_instance_id, ti.player_id AS offerer_id, i.player_id AS actual_owner, c.item_name
      FROM trade_items ti
      JOIN inventories i ON ti.item_instance_id = i.item_instance_id
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      WHERE ti.trade_id = $1
      FOR UPDATE OF i;
    `, [tradeId]);

    for (const item of itemsRes.rows) {
      if (item.offerer_id !== item.actual_owner) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Item "${item.item_name}" (#${item.item_instance_id}) is no longer owned by the offering player.`
        });
      }

      // Check marketplace listing
      const listed = await client.query(
        "SELECT listing_id FROM market_listings WHERE item_instance_id = $1 AND status = 'active'",
        [item.item_instance_id]
      );
      if (listed.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Item "${item.item_name}" is currently listed on the public marketplace.`
        });
      }
    }

    // 3. Lock and verify currencies
    const currRes = await client.query(`
      SELECT currency_id, player_id, amount
      FROM trade_currencies
      WHERE trade_id = $1;
    `, [tradeId]);

    for (const curr of currRes.rows) {
      const amt = parseFloat(curr.amount);
      const wRes = await client.query(`
        SELECT wallet_id, balance FROM wallets
        WHERE player_id = $1 AND currency_id = $2
        FOR UPDATE;
      `, [curr.player_id, curr.currency_id]);

      if (wRes.rowCount === 0 || parseFloat(wRes.rows[0].balance) < amt) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Insufficient funds for pledged trade currency.`
        });
      }
    }

    // 4. Swap ownership of items
    for (const item of itemsRes.rows) {
      const newOwner = item.offerer_id === trade.initiator_id ? trade.receiver_id : trade.initiator_id;
      await client.query(`
        UPDATE inventories
        SET player_id = $1, is_equipped = FALSE
        WHERE item_instance_id = $2;
      `, [newOwner, item.item_instance_id]);
    }

    // 5. Transfer currencies
    for (const curr of currRes.rows) {
      const amt = parseFloat(curr.amount);
      const targetPlayer = curr.player_id === trade.initiator_id ? trade.receiver_id : trade.initiator_id;

      await client.query(`
        UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP
        WHERE player_id = $2 AND currency_id = $3;
      `, [amt, curr.player_id, curr.currency_id]);

      await client.query(`
        UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
        WHERE player_id = $2 AND currency_id = $3;
      `, [amt, targetPlayer, curr.currency_id]);
    }

    // 6. Mark trade accepted
    await client.query(`
      UPDATE trades
      SET status = 'accepted', resolved_at = CURRENT_TIMESTAMP
      WHERE trade_id = $1;
    `, [tradeId]);

    // 7. Audit log
    await client.query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'TRADE_ACCEPTED', $2);
    `, [
      acceptorId,
      `Trade #${tradeId} between Player #${trade.initiator_id} and Player #${trade.receiver_id} finalized successfully.`
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Trade accepted! All assets and currencies transferred atomically.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// Decline a Trade
async function declineTrade(req, res) {
  const tradeId = parseInt(req.params.id, 10);
  const { playerId } = req.body;

  try {
    const tradeRes = await query(`
      SELECT trade_id, status, receiver_id FROM trades WHERE trade_id = $1
    `, [tradeId]);

    if (tradeRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Trade not found.' });
    }

    const trade = tradeRes.rows[0];
    if (trade.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Trade cannot be declined; status is '${trade.status}'.` });
    }

    await query(`
      UPDATE trades SET status = 'declined', resolved_at = CURRENT_TIMESTAMP WHERE trade_id = $1;
    `, [tradeId]);

    await query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'TRADE_DECLINED', $2);
    `, [playerId, `Trade #${tradeId} declined.`]);

    res.json({ success: true, message: `Trade #${tradeId} declined.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Cancel a Trade
async function cancelTrade(req, res) {
  const tradeId = parseInt(req.params.id, 10);
  const { playerId } = req.body;

  try {
    const tradeRes = await query(`
      SELECT trade_id, status, initiator_id FROM trades WHERE trade_id = $1
    `, [tradeId]);

    if (tradeRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Trade not found.' });
    }

    const trade = tradeRes.rows[0];
    if (trade.initiator_id !== parseInt(playerId, 10)) {
      return res.status(403).json({ success: false, error: 'Only the trade initiator can cancel this trade.' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Trade cannot be cancelled; status is '${trade.status}'.` });
    }

    await query(`
      UPDATE trades SET status = 'cancelled', resolved_at = CURRENT_TIMESTAMP WHERE trade_id = $1;
    `, [tradeId]);

    await query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'TRADE_CANCELLED', $2);
    `, [playerId, `Trade #${tradeId} cancelled by initiator.`]);

    res.json({ success: true, message: `Trade #${tradeId} cancelled.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getTrades,
  createTrade,
  acceptTrade,
  declineTrade,
  cancelTrade,
};

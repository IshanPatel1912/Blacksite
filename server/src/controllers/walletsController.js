const { query } = require('../config/db');

// List Currencies
async function getCurrencies(req, res) {
  try {
    const result = await query(`
      SELECT currency_id, currency_name, is_premium, symbol, description
      FROM currencies
      ORDER BY is_premium ASC, currency_id ASC;
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get Player Wallets
async function getPlayerWallets(req, res) {
  const playerId = parseInt(req.params?.playerId || req.query?.playerId || '1', 10);

  try {
    const result = await query(`
      SELECT 
        w.wallet_id,
        w.player_id,
        w.currency_id,
        w.balance,
        w.updated_at,
        c.currency_name,
        c.is_premium,
        c.symbol,
        c.description AS currency_description
      FROM wallets w
      JOIN currencies c ON w.currency_id = c.currency_id
      WHERE w.player_id = $1
      ORDER BY c.is_premium ASC, c.currency_id ASC;
    `, [playerId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Fund Wallet (Stipend Requisition / Demonstration Balance)
async function fundWallet(req, res) {
  const { playerId, currencyId, amount } = req.body;
  const numAmount = parseFloat(amount);

  if (!playerId || !currencyId || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid playerId, currencyId, and positive amount are required.',
    });
  }

  try {
    // 1. Update wallet balance
    const updateRes = await query(`
      UPDATE wallets
      SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
      WHERE player_id = $2 AND currency_id = $3;
    `, [numAmount, playerId, currencyId]);

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Target wallet not found for this player.' });
    }

    // 2. Log in audit trail
    const details = JSON.stringify({
      currency_id: currencyId,
      amount: numAmount,
      reason: 'OPERATOR_STIPEND_REQUISITION',
      timestamp: new Date().toISOString(),
    });

    await query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'WALLET_FUNDED', $2);
    `, [playerId, details]);

    // 3. Fetch updated wallet
    const updated = await query(`
      SELECT w.wallet_id, w.player_id, w.currency_id, w.balance, w.updated_at, c.currency_name, c.symbol, c.is_premium
      FROM wallets w
      JOIN currencies c ON w.currency_id = c.currency_id
      WHERE w.player_id = $1 AND w.currency_id = $2;
    `, [playerId, currencyId]);

    res.json({
      success: true,
      message: `Successfully allocated +${numAmount.toLocaleString()} to operator ledger!`,
      data: updated.rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get Player Wallet Transactions History from Audit Trail
async function getWalletTransactions(req, res) {
  const playerId = parseInt(req.params?.playerId || req.query?.playerId || '1', 10);

  try {
    const result = await query(`
      SELECT 
        log_id,
        player_id,
        action_type,
        details,
        created_at
      FROM audit_logs
      WHERE player_id = $1 
        AND action_type IN ('WALLET_FUNDED', 'STORE_PURCHASE', 'MARKETPLACE_BUY', 'MARKETPLACE_SOLD', 'TRADE_EXECUTED', 'ITEM_REPAIRED')
      ORDER BY created_at DESC
      LIMIT 25;
    `, [playerId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getCurrencies,
  getPlayerWallets,
  fundWallet,
  getWalletTransactions,
};
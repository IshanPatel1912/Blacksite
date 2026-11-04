const { query, getClient } = require('../config/db');

// List Store Offers
async function getStoreOffers(req, res) {
  try {
    const result = await query(`
      SELECT 
        so.offer_id,
        so.price,
        so.stock_limit,
        so.stock_sold,
        (so.stock_limit - so.stock_sold) AS remaining_stock,
        so.status,
        so.created_at,
        c.item_type_id,
        c.item_name,
        c.rarity,
        c.category,
        c.asset_key,
        c.description AS item_description,
        c.base_durability,
        cur.currency_id,
        cur.currency_name,
        cur.symbol AS currency_symbol,
        cur.is_premium
      FROM store_offers so
      JOIN item_catalog c ON so.item_type_id = c.item_type_id
      JOIN currencies cur ON so.currency_id = cur.currency_id
      ORDER BY 
        CASE so.status WHEN 'available' THEN 1 ELSE 2 END ASC,
        so.offer_id ASC;
    `);

    res.json({
      success: true,
      count: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Purchase Store Offer - Fully ACID with Pessimistic Locking
async function purchaseStoreOffer(req, res) {
  const { playerId, offerId } = req.body;

  if (!playerId || !offerId) {
    return res.status(400).json({
      success: false,
      error: 'playerId and offerId are required parameters.',
    });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Lock store offer row
    const offerRes = await client.query(`
      SELECT 
        so.offer_id,
        so.item_type_id,
        so.currency_id,
        so.price,
        so.stock_limit,
        so.stock_sold,
        so.status,
        c.item_name,
        c.rarity
      FROM store_offers so
      JOIN item_catalog c ON so.item_type_id = c.item_type_id
      WHERE so.offer_id = $1
      FOR UPDATE OF so;
    `, [offerId]);

    if (offerRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Store offer not found.' });
    }

    const offer = offerRes.rows[0];

    if (offer.status !== 'available' || offer.stock_sold >= offer.stock_limit) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'This requisition offer is sold out or no longer active.',
      });
    }

    // 2. Lock player wallet for required currency
    const walletRes = await client.query(`
      SELECT wallet_id, balance
      FROM wallets
      WHERE player_id = $1 AND currency_id = $2
      FOR UPDATE;
    `, [playerId, offer.currency_id]);

    if (walletRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Player has no wallet denominated in the required currency.',
      });
    }

    const wallet = walletRes.rows[0];
    const currentBalance = parseFloat(wallet.balance);
    const price = parseFloat(offer.price);

    if (currentBalance < price) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Insufficient funds. Required: ${price}, Available: ${currentBalance}.`,
      });
    }

    // 3. Deduct currency from wallet
    const newBalance = currentBalance - price;
    await client.query(`
      UPDATE wallets
      SET balance = $1, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_id = $2;
    `, [newBalance, wallet.wallet_id]);

    // 4. Update stock and status
    const newStockSold = offer.stock_sold + 1;
    const newStatus = newStockSold >= offer.stock_limit ? 'sold_out' : 'available';

    await client.query(`
      UPDATE store_offers
      SET stock_sold = $1, status = $2
      WHERE offer_id = $3;
    `, [newStockSold, newStatus, offerId]);

    // 5. Instantiate item into player's inventory
    const invRes = await client.query(`
      INSERT INTO inventories (player_id, item_type_id, durability, acquired_at)
      VALUES ($1, $2, 100, CURRENT_TIMESTAMP)
      RETURNING item_instance_id;
    `, [playerId, offer.item_type_id]);

    const newInstanceId = invRes.rows[0].item_instance_id;

    // 6. Record audit log
    await client.query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'STORE_PURCHASE', $2);
    `, [
      playerId,
      `Acquired ${offer.item_name} (#${newInstanceId}) from Offer #${offerId} for ${price} currency units.`
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Requisition successful! ${offer.item_name} added to your Armory.`,
      data: {
        itemInstanceId: newInstanceId,
        itemName: offer.item_name,
        pricePaid: price,
        remainingBalance: newBalance,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// Admin: Create new store offer
async function createStoreOffer(req, res) {
  const { itemTypeId, currencyId, price, stockLimit } = req.body;
  if (!itemTypeId || !currencyId || !price || !stockLimit) {
    return res.status(400).json({
      success: false,
      error: 'itemTypeId, currencyId, price, and stockLimit are required.',
    });
  }

  try {
    const insertRes = await query(`
      INSERT INTO store_offers (item_type_id, currency_id, price, stock_limit, stock_sold, status)
      VALUES ($1, $2, $3, $4, 0, 'available');
    `, [parseInt(itemTypeId, 10), parseInt(currencyId, 10), parseFloat(price), parseInt(stockLimit, 10)]);

    res.json({
      success: true,
      message: 'New store supply drop authorized and available in depot!',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Admin: Restock or adjust existing offer
async function restockStoreOffer(req, res) {
  const offerId = parseInt(req.params.id, 10);
  const { addStock, newPrice, status } = req.body;

  try {
    let sql = 'UPDATE store_offers SET ';
    const params = [];
    let pIdx = 1;

    if (addStock !== undefined && !isNaN(parseInt(addStock, 10))) {
      sql += `stock_limit = stock_limit + $${pIdx}, `;
      params.push(parseInt(addStock, 10));
      pIdx++;
    }

    if (newPrice !== undefined && !isNaN(parseFloat(newPrice))) {
      sql += `price = $${pIdx}, `;
      params.push(parseFloat(newPrice));
      pIdx++;
    }

    if (status) {
      sql += `status = $${pIdx}, `;
      params.push(status);
      pIdx++;
    }

    sql = sql.replace(/, $/, '');
    sql += ` WHERE offer_id = $${pIdx};`;
    params.push(offerId);

    const updateRes = await query(sql, params);
    if (updateRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Store offer not found.' });
    }

    res.json({
      success: true,
      message: `Store offer #${offerId} inventory parameters updated!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getStoreOffers,
  purchaseStoreOffer,
  createStoreOffer,
  restockStoreOffer,
};

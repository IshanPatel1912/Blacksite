const { query, getClient } = require('../config/db');

// List Marketplace Listings
async function getMarketListings(req, res) {
  const { search, rarity, category, currencyId, sort = 'date_desc' } = req.query;

  try {
    let sql = `
      SELECT 
        ml.listing_id,
        ml.seller_id,
        p.username AS seller_username,
        ml.item_instance_id,
        ml.price,
        ml.status,
        ml.created_at,
        ml.updated_at,
        c.item_type_id,
        c.item_name,
        c.rarity,
        c.category,
        c.asset_key,
        c.description,
        i.durability,
        cur.currency_id,
        cur.currency_name,
        cur.symbol AS currency_symbol,
        cur.is_premium
      FROM market_listings ml
      JOIN players p ON ml.seller_id = p.player_id
      JOIN inventories i ON ml.item_instance_id = i.item_instance_id
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      JOIN currencies cur ON ml.currency_id = cur.currency_id
      WHERE ml.status = 'active'
    `;

    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      sql += ` AND (c.item_name ILIKE $${paramIndex} OR p.username ILIKE $${paramIndex})`;
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

    if (currencyId && currencyId !== 'ALL') {
      sql += ` AND cur.currency_id = $${paramIndex}`;
      params.push(parseInt(currencyId, 10));
      paramIndex++;
    }

    switch (sort) {
      case 'price_asc':
        sql += ` ORDER BY ml.price ASC`;
        break;
      case 'price_desc':
        sql += ` ORDER BY ml.price DESC`;
        break;
      case 'rarity_desc':
        sql += ` ORDER BY CASE c.rarity WHEN 'Mythic' THEN 1 WHEN 'Legendary' THEN 2 WHEN 'Epic' THEN 3 WHEN 'Rare' THEN 4 WHEN 'Uncommon' THEN 5 ELSE 6 END ASC`;
        break;
      case 'date_asc':
        sql += ` ORDER BY ml.created_at ASC`;
        break;
      case 'date_desc':
      default:
        sql += ` ORDER BY ml.created_at DESC`;
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

// Create a new Marketplace Listing
async function createMarketListing(req, res) {
  const { sellerId, itemInstanceId, currencyId, price } = req.body;

  if (!sellerId || !itemInstanceId || !currencyId || !price || parseFloat(price) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'sellerId, itemInstanceId, currencyId, and valid positive price are required.',
    });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify item ownership, tradability, and condition
    const itemRes = await client.query(`
      SELECT i.item_instance_id, i.player_id, i.durability, c.is_tradable, c.item_name
      FROM inventories i
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      WHERE i.item_instance_id = $1 AND i.player_id = $2
      FOR UPDATE OF i
    `, [itemInstanceId, sellerId]);

    if (itemRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Item instance not found in operator armory.',
      });
    }

    const item = itemRes.rows[0];

    if (!item.is_tradable) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'This item is designated NON-TRADABLE by military command.',
      });
    }

    if (item.durability <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Cannot list broken items. Repair item before listing.',
      });
    }

    // 2. Check if already actively listed
    const existingListing = await client.query(`
      SELECT listing_id FROM market_listings
      WHERE item_instance_id = $1 AND status = 'active'
    `, [itemInstanceId]);

    if (existingListing.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Item is already actively listed on the marketplace.',
      });
    }

    // 3. Check if committed to a pending trade
    const pendingTrade = await client.query(`
      SELECT ti.trade_item_id FROM trade_items ti
      JOIN trades t ON ti.trade_id = t.trade_id
      WHERE ti.item_instance_id = $1 AND t.status = 'pending'
    `, [itemInstanceId]);

    if (pendingTrade.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Item is currently pledged in an active pending trade.',
      });
    }

    // 4. Unequip item if currently equipped
    await client.query(`
      UPDATE inventories SET is_equipped = FALSE WHERE item_instance_id = $1;
    `, [itemInstanceId]);

    // 5. Insert listing
    const insertRes = await client.query(`
      INSERT INTO market_listings (seller_id, item_instance_id, currency_id, price, status)
      VALUES ($1, $2, $3, $4, 'active')
      RETURNING *;
    `, [sellerId, itemInstanceId, currencyId, parseFloat(price)]);

    const newListing = insertRes.rows[0];

    // 6. Audit log
    await client.query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'MARKET_LISTING_CREATE', $2);
    `, [
      sellerId,
      `Created listing #${newListing.listing_id} for ${item.item_name} (#${itemInstanceId}) at price ${price}.`
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `${item.item_name} listed on public exchange for ${price}.`,
      data: newListing,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// Cancel a Marketplace Listing
async function cancelMarketListing(req, res) {
  const { listingId, sellerId } = req.body;

  if (!listingId || !sellerId) {
    return res.status(400).json({
      success: false,
      error: 'listingId and sellerId are required.',
    });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const listingRes = await client.query(`
      SELECT ml.listing_id, ml.seller_id, ml.status, ml.item_instance_id, c.item_name
      FROM market_listings ml
      JOIN inventories i ON ml.item_instance_id = i.item_instance_id
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      WHERE ml.listing_id = $1
      FOR UPDATE OF ml;
    `, [listingId]);

    if (listingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Listing not found.' });
    }

    const listing = listingRes.rows[0];

    if (listing.seller_id !== parseInt(sellerId, 10)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Only the original seller can cancel this listing.' });
    }

    if (listing.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: `Listing cannot be cancelled because it is already '${listing.status}'.` });
    }

    await client.query(`
      UPDATE market_listings
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE listing_id = $1;
    `, [listingId]);

    // Audit log
    await client.query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'MARKET_LISTING_CANCEL', $2);
    `, [
      sellerId,
      `Cancelled marketplace listing #${listingId} for ${listing.item_name}.`
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Listing #${listingId} cancelled. Item returned to available armory stock.`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// Purchase Marketplace Listing (Atomic Transfer)
async function buyMarketListing(req, res) {
  const { buyerId, listingId } = req.body;

  if (!buyerId || !listingId) {
    return res.status(400).json({
      success: false,
      error: 'buyerId and listingId are required.',
    });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Lock listing row
    const listingRes = await client.query(`
      SELECT 
        ml.listing_id,
        ml.seller_id,
        ml.item_instance_id,
        ml.currency_id,
        ml.price,
        ml.status,
        c.item_name,
        cur.symbol AS currency_symbol
      FROM market_listings ml
      JOIN inventories i ON ml.item_instance_id = i.item_instance_id
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      JOIN currencies cur ON ml.currency_id = cur.currency_id
      WHERE ml.listing_id = $1
      FOR UPDATE OF ml;
    `, [listingId]);

    if (listingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Listing not found.' });
    }

    const listing = listingRes.rows[0];

    if (listing.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Listing is no longer active (already sold or cancelled).' });
    }

    if (listing.seller_id === parseInt(buyerId, 10)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Operator cannot purchase their own market listing.' });
    }

    const price = parseFloat(listing.price);

    // 2. Lock wallets in deterministic order to prevent deadlock
    const p1 = Math.min(parseInt(buyerId, 10), listing.seller_id);
    const p2 = Math.max(parseInt(buyerId, 10), listing.seller_id);

    const w1 = await client.query(`
      SELECT wallet_id, player_id, balance FROM wallets
      WHERE player_id = $1 AND currency_id = $2
      FOR UPDATE;
    `, [p1, listing.currency_id]);

    const w2 = await client.query(`
      SELECT wallet_id, player_id, balance FROM wallets
      WHERE player_id = $1 AND currency_id = $2
      FOR UPDATE;
    `, [p2, listing.currency_id]);

    const buyerWallet = p1 === parseInt(buyerId, 10) ? w1.rows[0] : w2.rows[0];
    const sellerWallet = p1 === listing.seller_id ? w1.rows[0] : w2.rows[0];

    if (!buyerWallet) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Buyer does not have a wallet for this currency.' });
    }

    if (parseFloat(buyerWallet.balance) < price) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Price is ${price} ${listing.currency_symbol}, your balance is ${buyerWallet.balance}.`
      });
    }

    // 3. Balance transfer
    await client.query(`
      UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2;
    `, [price, buyerWallet.wallet_id]);

    await client.query(`
      UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2;
    `, [price, sellerWallet.wallet_id]);

    // 4. Reassign ownership of inventory item
    await client.query(`
      UPDATE inventories
      SET player_id = $1, is_equipped = FALSE
      WHERE item_instance_id = $2;
    `, [buyerId, listing.item_instance_id]);

    // 5. Update listing status
    await client.query(`
      UPDATE market_listings
      SET status = 'sold', updated_at = CURRENT_TIMESTAMP
      WHERE listing_id = $1;
    `, [listingId]);

    // 6. Write audit logs
    await client.query(`
      INSERT INTO audit_logs (player_id, action_type, details)
      VALUES ($1, 'MARKET_PURCHASE', $2);
    `, [
      buyerId,
      `Purchased ${listing.item_name} (#${listing.item_instance_id}) from Operator #${listing.seller_id} for ${price} ${listing.currency_symbol}.`
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Purchase finalized! ${listing.item_name} transferred to your Armory.`,
      data: {
        listingId,
        itemName: listing.item_name,
        pricePaid: price,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

module.exports = {
  getMarketListings,
  createMarketListing,
  cancelMarketListing,
  buyMarketListing,
};

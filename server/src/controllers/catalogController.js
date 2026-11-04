const { query } = require('../config/db');

// List Catalog Items with filtering & search
async function getCatalog(req, res) {
  const { search, rarity, category, tradable } = req.query;

  try {
    let sql = `
      SELECT 
        c.item_type_id,
        c.item_name,
        c.rarity,
        c.category,
        c.is_tradable,
        c.base_durability,
        c.description,
        c.asset_key,
        COUNT(i.item_instance_id) AS total_instances_in_game
      FROM item_catalog c
      LEFT JOIN inventories i ON c.item_type_id = i.item_type_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      sql += ` AND (c.item_name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
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

    sql += ` GROUP BY c.item_type_id, c.item_name, c.rarity, c.category, c.is_tradable, c.base_durability, c.description, c.asset_key`;
    sql += ` ORDER BY c.item_type_id ASC;`;

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

// Add new Catalog record (Admin feature required by guidelines)
async function createCatalogItem(req, res) {
  const {
    item_name,
    rarity,
    category,
    is_tradable = true,
    base_durability = 100,
    description = '',
    asset_key = 'standard_gear',
  } = req.body;

  if (!item_name || !rarity || !category) {
    return res.status(400).json({
      success: false,
      error: 'item_name, rarity, and category are required fields.',
    });
  }

  try {
    const result = await query(`
      INSERT INTO item_catalog (item_name, rarity, category, is_tradable, base_durability, description, asset_key)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [item_name, rarity, category, is_tradable, base_durability, description, asset_key]);

    // Record audit log
    await query(`
      INSERT INTO audit_logs (action_type, details)
      VALUES ('ADMIN_CATALOG_CREATE', $1);
    `, [`Created new catalog blueprint: ${item_name} (#${result.rows[0].item_type_id}) [${rarity} ${category}].`]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: `Blueprint for ${item_name} registered into central armory catalog.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getCatalog,
  createCatalogItem,
};

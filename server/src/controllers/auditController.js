const { query } = require('../config/db');

async function getAuditLogs(req, res) {
  const { playerId, actionType, limit = 50, offset = 0 } = req.query;

  try {
    let sql = `
      SELECT 
        a.log_id,
        a.player_id,
        p.username,
        a.action_type,
        a.details,
        a.created_at
      FROM audit_logs a
      LEFT JOIN players p ON a.player_id = p.player_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (playerId && playerId !== 'ALL') {
      sql += ` AND a.player_id = $${paramIndex}`;
      params.push(parseInt(playerId, 10));
      paramIndex++;
    }

    if (actionType && actionType !== 'ALL') {
      sql += ` AND a.action_type = $${paramIndex}`;
      params.push(actionType);
      paramIndex++;
    }

    sql += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1};`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await query(sql, params);

    // Get distinct action types for filter dropdown
    const typesRes = await query(`SELECT DISTINCT action_type FROM audit_logs ORDER BY action_type ASC;`);

    res.json({
      success: true,
      count: result.rowCount,
      actionTypes: typesRes.rows.map(r => r.action_type),
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAuditLogs,
};

const { getDbStatus, checkConnection } = require('../config/db');

async function requireDb(req, res, next) {
  let status = getDbStatus();
  if (!status.connected) {
    status = await checkConnection();
  }

  if (!status.connected) {
    return res.status(503).json({
      success: false,
      error: 'DATABASE_UNAVAILABLE',
      message: 'PostgreSQL connection unavailable. Please verify PostgreSQL service and environment configuration.',
      details: {
        host: status.host,
        port: status.port,
        database: status.database,
        lastError: status.error,
        instruction: 'Execute "npm run db:setup" once PostgreSQL server is operational.'
      }
    });
  }

  next();
}

module.exports = { requireDb };

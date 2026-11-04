const express = require('express');
const router = express.Router();

const { getDbStatus, checkConnection } = require('../config/db');
const { requireDb } = require('../middleware/dbCheck');

const playersController = require('../controllers/playersController');
const dashboardController = require('../controllers/dashboardController');
const inventoryController = require('../controllers/inventoryController');
const catalogController = require('../controllers/catalogController');
const storeController = require('../controllers/storeController');
const marketplaceController = require('../controllers/marketplaceController');
const tradesController = require('../controllers/tradesController');
const walletsController = require('../controllers/walletsController');
const auditController = require('../controllers/auditController');
const dbLabController = require('../controllers/dbLabController');
const wheelRoutes = require('./wheelRoutes');

// 1. Health & Connection Diagnostics (Never blocks when DB is down)
router.get('/health', async (req, res) => {
  const status = await checkConnection();
  res.json({
    success: true,
    data: status,
  });
});

// 2. Demonstration Players
router.get('/players', requireDb, playersController.getPlayers);
router.get('/players/:id', requireDb, playersController.getPlayerById);
router.post('/players/:id/status', requireDb, playersController.updatePlayerStatus);

// 3. Command Dashboard & Admin Operations
router.get('/dashboard', requireDb, dashboardController.getDashboardData);
router.get('/admin/metrics', requireDb, dashboardController.getAdminMetrics);

// 4. Currencies & Wallets
router.get('/currencies', requireDb, walletsController.getCurrencies);
router.get('/wallets', requireDb, walletsController.getPlayerWallets);
router.post('/wallets/fund', requireDb, walletsController.fundWallet);
router.get('/wallets/transactions', requireDb, walletsController.getWalletTransactions);

// 5. Armory Inventory
router.get('/inventory', requireDb, inventoryController.getInventory);
router.post('/inventory/equip', requireDb, inventoryController.toggleEquip);
router.post('/inventory/repair', requireDb, inventoryController.repairItem);

// 6. Item Catalog
router.get('/catalog', requireDb, catalogController.getCatalog);
router.post('/catalog', requireDb, catalogController.createCatalogItem);

// 7. Store / Supply Depot
router.get('/store', requireDb, storeController.getStoreOffers);
router.post('/store', requireDb, storeController.createStoreOffer);
router.put('/store/:id', requireDb, storeController.restockStoreOffer);
router.post('/store/purchase', requireDb, storeController.purchaseStoreOffer);

// 8. P2P Marketplace
router.get('/marketplace', requireDb, marketplaceController.getMarketListings);
router.post('/marketplace/list', requireDb, marketplaceController.createMarketListing);
router.post('/marketplace/cancel', requireDb, marketplaceController.cancelMarketListing);
router.post('/marketplace/buy', requireDb, marketplaceController.buyMarketListing);

// 9. Bilateral Trades
router.get('/trades', requireDb, tradesController.getTrades);
router.post('/trades', requireDb, tradesController.createTrade);
router.post('/trades/:id/accept', requireDb, tradesController.acceptTrade);
router.post('/trades/:id/decline', requireDb, tradesController.declineTrade);
router.post('/trades/:id/cancel', requireDb, tradesController.cancelTrade);

// 10. Audit Logs
router.get('/audit-logs', requireDb, auditController.getAuditLogs);

// 11. Academic Database Lab
router.get('/db-lab/categories', dbLabController.getLabCategories);
router.post('/db-lab/execute', requireDb, dbLabController.executeLabQuery);

// 12. Black Market // Luck Royale
router.use('/wheel', requireDb, wheelRoutes);

module.exports = router;

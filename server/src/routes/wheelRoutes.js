const express = require('express');
const router = express.Router();
const wheelController = require('../controllers/wheelController');

// Player Endpoints
router.get('/state', wheelController.getWheelState);
router.post('/spin', wheelController.executeSpin);

// Admin Configuration Endpoints
router.get('/admin/config', wheelController.getAdminConfig);
router.post('/admin/reward/:rewardId', wheelController.updateRewardConfig);
router.post('/admin/event', wheelController.updateEventConfig);
router.get('/admin/history', wheelController.getSpinHistory);

module.exports = router;

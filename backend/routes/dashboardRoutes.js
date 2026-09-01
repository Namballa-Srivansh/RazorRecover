const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/kpis', dashboardController.getKPIs);
router.get('/timeline', dashboardController.getRecoveryTimeline);

module.exports = router;

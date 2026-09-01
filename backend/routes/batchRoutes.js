const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');

router.get('/', batchController.getBatches);
router.post('/', batchController.createBatch);

module.exports = router;

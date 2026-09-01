const express = require('express');
const router = express.Router();
const playbookController = require('../controllers/playbookController');

router.get('/', playbookController.getPlaybook);
router.put('/', playbookController.updatePlaybook);

module.exports = router;

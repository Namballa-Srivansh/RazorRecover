const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');

router.get('/', caseController.getCases);
router.get('/audit-logs', caseController.getAuditLogs);
router.get('/:id', caseController.getCaseById);
router.put('/:id', caseController.updateCase);
router.post('/:id/outreach', caseController.generateOutreach);
router.post('/:id/reply', caseController.customerReply);
router.post('/:id/confirm-payment', caseController.confirmPayment);

module.exports = router;

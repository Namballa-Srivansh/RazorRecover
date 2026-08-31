const Batch = require('../models/Batch');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const axios = require('axios');

exports.getBatches = async (req, res) => {
  try {
    const batches = await Batch.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBatch = async (req, res) => {
  try {
    const { name, cases } = req.body;
    
    if (!name || !cases || !Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid batch details.' });
    }

    let totalAmount = 0;
    cases.forEach(c => totalAmount += Number(c.amount));

    const batch = await Batch.create({
      name,
      total_cases: cases.length,
      total_amount: totalAmount,
      status: 'processing'
    });

    const casePromises = cases.map(async (c) => {
      const newCase = await Case.create({
        batch_id: batch._id,
        case_type: c.case_type,
        amount: c.amount,
        customer: c.customer,
        status: 'pending',
        root_cause: 'Unclassified',
        history: [{
          action: 'Ingestion',
          description: `Case ingested under batch "${name}"`
        }]
      });

      await AuditLog.create({
        batch_id: batch._id,
        case_id: newCase._id,
        action: 'Ingestion',
        details: `Failed transaction of ${newCase.amount} INR ingested for customer ${newCase.customer.name}`
      });

      // Call Python Agent to analyze root cause in the background or immediately if reachable
      try {
        const pythonAgentUrl = process.env.PYTHON_AGENT_URL || 'http://127.0.0.1:8000';
        const response = await axios.post(`${pythonAgentUrl}/api/diagnose`, {
          case_id: newCase._id.toString(),
          case_type: newCase.case_type,
          amount: newCase.amount,
          customer_name: newCase.customer.name,
          gateway_log: c.gateway_log || `Transaction failed for ${newCase.customer.name}. Amount: ${newCase.amount}. Error details: code ${c.error_code || '402'} - ${c.error_description || 'payment declined'}`
        }, { timeout: 3000 });

        if (response.data && response.data.root_cause) {
          newCase.root_cause = response.data.root_cause;
          newCase.status = 'in_recovery';
          newCase.history.push({
            action: 'AI Diagnosis',
            description: `AI diagnosed root cause: ${response.data.root_cause}. Recommendation: ${response.data.recommendation}`
          });
          await newCase.save();

          await AuditLog.create({
            batch_id: batch._id,
            case_id: newCase._id,
            action: 'Diagnosis',
            details: `AI diagnosed root cause: ${response.data.root_cause}. Recommends: ${response.data.recommendation}`
          });
        }
      } catch (err) {
        console.error(`Failed to reach Python AI agent for diagnosis on case ${newCase._id}: ${err.message}`);
        // Fallback local diagnosis rules if Python agent is not yet running
        newCase.root_cause = c.error_description || 'Generic Gateway Decline';
        newCase.status = 'in_recovery';
        newCase.history.push({
          action: 'Local Recovery Init',
          description: `Fallback diagnosis initialized: ${newCase.root_cause}. awaiting agent connection.`
        });
        await newCase.save();
      }

      return newCase;
    });

    await Promise.all(casePromises);

    batch.status = 'completed';
    await batch.save();

    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const Case = require('../models/Case');
const Batch = require('../models/Batch');
const AuditLog = require('../models/AuditLog');
const Playbook = require('../models/Playbook');
const axios = require('axios');

const updateBatchStats = async (batchId) => {
  try {
    const cases = await Case.find({ batch_id: batchId });
    const totalCases = cases.length;
    const totalAmount = cases.reduce((acc, c) => acc + c.amount, 0);
    
    const recoveredCases = cases.filter(c => c.status === 'recovered').length;
    const recoveredAmount = cases.filter(c => c.status === 'recovered').reduce((acc, c) => acc + c.amount, 0);

    await Batch.findByIdAndUpdate(batchId, {
      total_cases: totalCases,
      total_amount: totalAmount,
      recovered_cases: recoveredCases,
      recovered_amount: recoveredAmount
    });
  } catch (error) {
    console.error(`Error updating batch stats: ${error.message}`);
  }
};

exports.getCases = async (req, res) => {
  try {
    const { status, batch_id } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (batch_id) filter.batch_id = batch_id;

    const cases = await Case.find(filter).populate('batch_id').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCaseById = async (req, res) => {
  try {
    const kase = await Case.findById(req.params.id).populate('batch_id');
    if (!kase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    res.status(200).json({ success: true, data: kase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCase = async (req, res) => {
  try {
    const { status, root_cause, escalation_stage } = req.body;
    const kase = await Case.findById(req.params.id);
    if (!kase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const oldStatus = kase.status;
    if (status) kase.status = status;
    if (root_cause) kase.root_cause = root_cause;
    if (escalation_stage !== undefined) kase.escalation_stage = escalation_stage;

    if (status && status !== oldStatus) {
      kase.history.push({
        action: 'Status Change',
        description: `Status manually updated from "${oldStatus}" to "${status}"`
      });

      await AuditLog.create({
        case_id: kase._id,
        batch_id: kase.batch_id,
        action: 'Status Update',
        details: `Status changed from ${oldStatus} to ${status}`
      });
    }

    await kase.save();
    
    if (status && status !== oldStatus) {
      await updateBatchStats(kase.batch_id);
    }

    res.status(200).json({ success: true, data: kase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generates agent outreach message
exports.generateOutreach = async (req, res) => {
  try {
    const kase = await Case.findById(req.params.id);
    if (!kase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const playbook = await Playbook.findOne({}) || { tone: 'hinglish', stopping_rules: [] };

    // Increment escalation stage if not first message
    if (kase.conversations.length > 0) {
      kase.escalation_stage = Math.min(kase.escalation_stage + 1, 3);
    }

    // Call Python Agent to generate customized message
    let outreachMessage = '';
    try {
      const pythonAgentUrl = process.env.PYTHON_AGENT_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${pythonAgentUrl}/api/generate_outreach`, {
        case_id: kase._id.toString(),
        case_type: kase.case_type,
        amount: kase.amount,
        customer_name: kase.customer.name,
        root_cause: kase.root_cause,
        escalation_stage: kase.escalation_stage,
        tone: playbook.tone
      });
      outreachMessage = response.data.message;
    } catch (err) {
      console.error(`Error reaching Python Agent to generate outreach: ${err.message}`);
      // Fallback local messaging logic
      const toneMap = {
        hinglish: `Hey ${kase.customer.name}, aapka payment of Rs.${kase.amount} verify nahi ho paya due to: ${kase.root_cause}. Please clarify or pay here to continue services.`,
        formal: `Dear ${kase.customer.name}, we noticed that your recent payment of INR ${kase.amount} has failed due to ${kase.root_cause}. Kindly update your payment details or contact support.`,
        casual: `Hey ${kase.customer.name}! Looks like your payment of INR ${kase.amount} didn't go through. Root cause: ${kase.root_cause}. Could you quickly retry? Let us know if you need help!`
      };
      outreachMessage = toneMap[playbook.tone] || toneMap['hinglish'];
    }

    kase.conversations.push({
      sender: 'agent',
      message: outreachMessage,
      channel: 'email'
    });

    kase.history.push({
      action: 'Agent Outreach',
      description: `Generated and sent Stage ${kase.escalation_stage} recovery message via email.`
    });

    await kase.save();

    await AuditLog.create({
      case_id: kase._id,
      batch_id: kase.batch_id,
      action: 'Outreach Sent',
      details: `Outreach message generated at escalation stage ${kase.escalation_stage}`
    });

    res.status(200).json({ success: true, data: kase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Simulates customer replying
exports.customerReply = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      return res.status(400).json({ success: false, message: 'Reply content is required.' });
    }

    const kase = await Case.findById(req.params.id);
    if (!kase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Add customer reply to conversation
    kase.conversations.push({
      sender: 'customer',
      message: reply,
      channel: 'email'
    });

    // Call Python agent to analyze customer intent
    let parsedResult = {
      opt_out: false,
      promise_to_pay: false,
      promise_date: null,
      sentiment: 'neutral',
      next_agent_response: ''
    };

    const playbook = await Playbook.findOne({}) || { tone: 'hinglish', stopping_rules: ['stop', 'opt-out'] };

    try {
      const pythonAgentUrl = process.env.PYTHON_AGENT_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${pythonAgentUrl}/api/parse_response`, {
        customer_message: reply,
        history: kase.conversations.map(c => ({ sender: c.sender, message: c.message })),
        tone: playbook.tone,
        amount: kase.amount,
        customer_name: kase.customer.name
      });
      parsedResult = response.data;
    } catch (err) {
      console.error(`Error reaching Python Agent for parsing: ${err.message}`);
      // Fallback local rule-based parsing
      const lowercaseReply = reply.toLowerCase();
      
      // 1. Opt out check
      const optOutKeywords = playbook.stopping_rules || ['stop', 'opt-out', 'dnd', 'remove'];
      const matchedKeyword = optOutKeywords.find(k => lowercaseReply.includes(k.toLowerCase()));
      if (matchedKeyword) {
        parsedResult.opt_out = true;
        parsedResult.next_agent_response = "Aapke request ke mutabik humne communications band kar diye hain. Inconvenience ke liye maafi.";
      } 
      // 2. Promise to Pay check
      else if (lowercaseReply.includes('pay') || lowercaseReply.includes('payment') || lowercaseReply.includes('kal') || lowercaseReply.includes('parso') || lowercaseReply.includes('deta hu') || lowercaseReply.includes('promise') || lowercaseReply.includes('salary')) {
        parsedResult.promise_to_pay = true;
        // Mock a promise date 2 days from now
        const promiseDate = new Date();
        promiseDate.setDate(promiseDate.getDate() + 2);
        parsedResult.promise_date = promiseDate.toISOString();
        parsedResult.next_agent_response = `Dhanyawaad confirm karne ke liye. Humne note kar liya hai ki aap payment ${promiseDate.toLocaleDateString()} tak complete kar denge.`;
      } 
      // 3. Simple text reply response
      else {
        parsedResult.next_agent_response = "Aapka message mil gaya hai. Please check the Razorpay portal to complete the payment, or let us know if you face any issues.";
      }
    }

    // Process analysis
    if (parsedResult.opt_out) {
      kase.status = 'paused';
      kase.history.push({
        action: 'Compliance Triggered',
        description: `Customer requested stop. Agent paused recovery process automatically.`
      });

      await AuditLog.create({
        case_id: kase._id,
        batch_id: kase.batch_id,
        action: 'Compliance Opt-Out',
        details: `Recovery paused automatically. Message matched stopping rules.`,
        compliance_check: true
      });
    } else if (parsedResult.promise_to_pay) {
      kase.promise_to_pay_date = parsedResult.promise_date ? new Date(parsedResult.promise_date) : new Date(Date.now() + 86400000 * 2);
      kase.history.push({
        action: 'Promise-to-Pay Logged',
        description: `Customer promised payment. Scheduled next retry follow-up after promise date: ${kase.promise_to_pay_date.toDateString()}`
      });

      await AuditLog.create({
        case_id: kase._id,
        batch_id: kase.batch_id,
        action: 'Promise to Pay',
        details: `Customer promised to pay on ${kase.promise_to_pay_date.toDateString()}`
      });
    }

    // Add agent's automatic reply response
    if (parsedResult.next_agent_response) {
      kase.conversations.push({
        sender: 'agent',
        message: parsedResult.next_agent_response,
        channel: 'email'
      });
    }

    await kase.save();
    await updateBatchStats(kase.batch_id);

    res.status(200).json({ success: true, data: kase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Simulated Direct Link/Gateway payment confirmation
exports.confirmPayment = async (req, res) => {
  try {
    const kase = await Case.findById(req.params.id);
    if (!kase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    if (kase.status === 'recovered') {
      return res.status(400).json({ success: false, message: 'Payment already recovered' });
    }

    kase.status = 'recovered';
    kase.history.push({
      action: 'Payment Recovered',
      description: `Payment of ${kase.amount} ${kase.currency} successfully completed via Razorpay link.`
    });

    await kase.save();
    await updateBatchStats(kase.batch_id);

    await AuditLog.create({
      case_id: kase._id,
      batch_id: kase.batch_id,
      action: 'Recovery Success',
      details: `Recovered ${kase.amount} INR from customer ${kase.customer.name}`
    });

    res.status(200).json({ success: true, data: kase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { case_id } = req.query;
    const filter = {};
    if (case_id) filter.case_id = case_id;

    const logs = await AuditLog.find(filter).populate('case_id').populate('batch_id').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

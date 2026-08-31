const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['agent', 'customer', 'system'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'whatsapp', 'call_sim'],
    default: 'email'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const HistorySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const CaseSchema = new mongoose.Schema({
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  case_type: {
    type: String,
    enum: ['payment_failure', 'checkout_abandonment', 'subscription_failed', 'overdue_invoice'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'in_recovery', 'recovered', 'failed', 'paused'],
    default: 'pending'
  },
  root_cause: {
    type: String,
    default: 'Unclassified'
  },
  escalation_stage: {
    type: Number,
    default: 0 // 0: Alert, 1: Soft Follow-up, 2: Negotiation, 3: Hard / Pause
  },
  retry_count: {
    type: Number,
    default: 0
  },
  next_action_due: {
    type: Date,
    default: Date.now
  },
  promise_to_pay_date: {
    type: Date,
    default: null
  },
  conversations: [ConversationSchema],
  history: [HistorySchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Case', CaseSchema);

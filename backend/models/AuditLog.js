const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  case_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  actor: {
    type: String,
    default: 'AI Recovery Agent'
  },
  compliance_check: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);

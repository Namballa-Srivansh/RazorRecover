const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed'],
    default: 'processing'
  },
  total_cases: {
    type: Number,
    default: 0
  },
  recovered_cases: {
    type: Number,
    default: 0
  },
  total_amount: {
    type: Number,
    default: 0
  },
  recovered_amount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Batch', BatchSchema);

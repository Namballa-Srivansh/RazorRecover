const mongoose = require('mongoose');

const PlaybookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    default: 'Default Recovery Playbook'
  },
  tone: {
    type: String,
    enum: ['formal', 'casual', 'hinglish'],
    default: 'hinglish'
  },
  stopping_rules: {
    type: [String],
    default: ['opt-out', 'do not contact', 'stop', 'fraud', 'legal', 'dnd']
  },
  retry_sequence: {
    type: [Number], // minutes/hours/days relative intervals for retry sequencing
    default: [60, 180, 1440] // retry at 1 hour, 3 hours, 24 hours
  },
  channels: {
    type: [String],
    default: ['email', 'sms', 'whatsapp']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Playbook', PlaybookSchema);

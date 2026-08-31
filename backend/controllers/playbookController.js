const Playbook = require('../models/Playbook');

exports.getPlaybook = async (req, res) => {
  try {
    let playbook = await Playbook.findOne({});
    if (!playbook) {
      playbook = await Playbook.create({
        name: 'Default Recovery Playbook',
        tone: 'hinglish',
        stopping_rules: ['opt-out', 'do not contact', 'stop', 'dnd', 'remove me', 'abuse'],
        retry_sequence: [60, 180, 1440]
      });
    }
    res.status(200).json({ success: true, data: playbook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePlaybook = async (req, res) => {
  try {
    let playbook = await Playbook.findOne({});
    if (!playbook) {
      playbook = new Playbook({});
    }

    const { tone, stopping_rules, retry_sequence } = req.body;
    
    if (tone) playbook.tone = tone;
    if (stopping_rules) playbook.stopping_rules = stopping_rules;
    if (retry_sequence) playbook.retry_sequence = retry_sequence;

    await playbook.save();
    res.status(200).json({ success: true, data: playbook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

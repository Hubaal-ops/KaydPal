const express = require('express');
const SystemSetting = require('../models/SystemSetting');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all system settings
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await SystemSetting.find();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json({ success: true, data: settingsObj });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

// Update system settings (bulk)
router.put('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const keys = Object.keys(updates);
    for (const key of keys) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { value: updates[key] },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/protected/admin/audit-logs
router.get('/admin/audit-logs', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { action: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { 'user.name': { $regex: search, $options: 'i' } }
          ]
        }
      : {};
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await AuditLog.countDocuments(query);
    res.json({ success: true, data: logs, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: err.message });
  }
});

module.exports = router;

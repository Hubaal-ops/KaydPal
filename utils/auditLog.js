const AuditLog = require('../models/AuditLog');

async function logAudit({ action, description, user, status = 'success', ip }) {
  try {
    await AuditLog.create({
      action,
      description,
      user: user ? { id: user._id, name: user.name, email: user.email } : undefined,
      status,
      ip
    });
  } catch (err) {
    // Optionally log error to console
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: { type: String },
  user: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String
  },
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now }
});

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

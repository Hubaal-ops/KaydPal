const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  category: { type: String, default: 'general' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional: for user-specific notifications
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);

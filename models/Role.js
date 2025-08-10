const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  key: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: {
    type: Map,
    of: [String], // e.g. { userManagement: ['read', 'create'] }
    default: {}
  },
  userCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);

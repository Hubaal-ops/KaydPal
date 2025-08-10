const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplier_no: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  balance: { type: Number, default: 0 },

  created_at: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Supplier', supplierSchema); 
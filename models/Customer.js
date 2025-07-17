const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customer_no: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  bal: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema); 
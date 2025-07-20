const mongoose = require('mongoose');

const PurchaseReturnSchema = new mongoose.Schema({
  return_no: { type: Number, unique: true, required: true },
  product_no: { type: Number, required: true },
  supplier_no: { type: Number, required: true },
  store_no: { type: Number, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  amount: { type: Number, required: true },
  paid: { type: Number, required: true },
  reason: { type: String },
  date: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PurchaseReturn', PurchaseReturnSchema); 
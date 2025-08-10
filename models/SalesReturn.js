const mongoose = require('mongoose');

const salesReturnSchema = new mongoose.Schema({
  return_no: { type: Number, unique: true, required: true },
  sel_no: { type: Number, required: true },
  product_no: { type: Number, required: true },
  customer_no: { type: Number, required: true },
  store_no: { type: Number, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  amount: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  reason: { type: String, default: '' },
  account_id: { type: Number },
  date: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },

  updated_at: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('SalesReturn', salesReturnSchema); 
const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product_no: { type: Number, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  subtotal: { type: Number, required: true }
}, { _id: false });


const saleSchema = new mongoose.Schema({
  sel_no: { type: Number, required: true, unique: true },
  items: [saleItemSchema],
  amount: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  account_id: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  sel_date: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer_no: { type: Number },
  customer_name: { type: String }
});

module.exports = mongoose.model('Sale', saleSchema); 
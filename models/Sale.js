const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  sel_no: { type: Number, unique: true, required: true },
  product_no: { type: Number, required: true },
  customer_no: { type: Number, required: true },
  store_no: { type: Number, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  account_id: { type: Number, required: true },
  sel_date: { type: Date, default: Date.now }
  // Add more fields as needed
});

module.exports = mongoose.model('Sale', saleSchema, 'sales'); 
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_no: { type: Number, unique: true, required: true },
  product_name: { type: String, required: true },
  product_code: { type: String },
  price: { type: Number },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);

const mongoose = require('mongoose');

const StoreProductSchema = new mongoose.Schema({
  store_product_no: { type: Number, unique: true, required: true },
  product_no: { type: Number, required: true, ref: 'Product' },
  store_no: { type: Number, required: true, ref: 'Store' },
  qty: { type: Number, required: true, default: 0 },
  created_at: { type: Date, default: Date.now },

  updated_at: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

StoreProductSchema.index({ product_no: 1, store_no: 1 }, { unique: true });

module.exports = mongoose.model('StoreProduct', StoreProductSchema); 
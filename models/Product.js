const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  product_no: { type: Number, unique: true, required: true },
  product_name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, default: null },
  price: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  sku: { type: String, default: '' },
  barcode: { type: String, default: '' },
  storing_balance: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.Mixed, required: true }, // Allow both string and ObjectId
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index for performance
ProductSchema.index({ product_no: 1, userId: 1 });
ProductSchema.index({ product_name: 1, userId: 1 });

// Explicitly specify collection name to match existing data
module.exports = mongoose.model('Product', ProductSchema, 'products');

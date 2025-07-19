const mongoose = require('mongoose');

const StockAdjustmentSchema = new mongoose.Schema({
  adj_no: { type: Number, unique: true, required: true },
  pro_no: { type: Number, required: true },
  store_no: { type: Number, required: true },
  qty: { type: Number, required: true },
  adj_type: { type: String, enum: ['add', 'subtract'], required: true },
  adj_desc: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockAdjustment', StockAdjustmentSchema); 
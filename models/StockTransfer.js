const mongoose = require('mongoose');

const StockTransferSchema = new mongoose.Schema({
  transfer_id: { type: Number, unique: true, required: true },
  from_store: { type: Number, required: true },
  to_store: { type: Number, required: true },
  product_no: { type: Number, required: true },
  qty: { type: Number, required: true },
  transfer_desc: { type: String },
  status: { type: String, default: 'pending' },
  created_at: { type: Date, default: Date.now },

  updated_at: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('StockTransfer', StockTransferSchema); 
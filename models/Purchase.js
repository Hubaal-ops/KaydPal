const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchase_id: { type: Number, unique: true, required: true },
  purchase_no: { type: String, unique: true, required: true },
  product_no: { type: Number, required: true },
  supplier_no: { type: Number, required: true },
  store_no: { type: Number, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  account_id: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },

  updated_at: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Purchase', purchaseSchema); 
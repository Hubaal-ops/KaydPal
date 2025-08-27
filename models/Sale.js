const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product_no: { type: Number, required: true },
  product_name: { type: String, default: '' },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  subtotal: { type: Number, required: true }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  sale_id: { type: Number, unique: true, required: true },
  sale_no: { type: String, unique: true, required: true },
  sel_no: { type: Number, required: true, unique: true }, // Keep for backward compatibility
  customer_no: { type: Number, required: true },
  customer_name: { type: String, default: '' },
  store_no: { type: Number, required: true },
  store_name: { type: String, default: '' },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  total_discount: { type: Number, default: 0 },
  total_tax: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  balance_due: { type: Number, default: 0 },
  account_id: { type: Number, required: true },
  account_name: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'confirmed', 'delivered', 'cancelled'], 
    default: 'draft' 
  },
  sel_date: { type: Date, default: Date.now },
  delivery_date: { type: Date },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Legacy fields for backward compatibility
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 }
});

// Index for better query performance
saleSchema.index({ userId: 1, sale_no: 1 });
saleSchema.index({ userId: 1, status: 1 });
saleSchema.index({ userId: 1, customer_no: 1 });
saleSchema.index({ userId: 1, store_no: 1 });

module.exports = mongoose.model('Sale', saleSchema); 
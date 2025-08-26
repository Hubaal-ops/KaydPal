const mongoose = require('mongoose');

// Subdocument schema for individual purchase line items
const purchaseItemSchema = new mongoose.Schema({
  product_no: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  purchase_id: { type: Number, unique: true, required: true },
  purchase_no: { type: String, unique: true, required: true },
  supplier_no: { type: Number, required: true },
  supplier_name: { type: String }, // Denormalized for quick access
  store_no: { type: Number, required: true },
  items: [purchaseItemSchema], // Array of products being purchased
  subtotal: { type: Number, required: true, default: 0 },
  total_discount: { type: Number, default: 0, min: 0 },
  total_tax: { type: Number, default: 0, min: 0 },
  amount: { type: Number, required: true, min: 0 }, // Total amount
  paid: { type: Number, default: 0, min: 0 },
  balance_due: { type: Number, default: 0, min: 0 },
  account_id: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'approved', 'received', 'cancelled'], 
    default: 'pending' 
  },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Middleware to update the updated_at field
purchaseSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index for better query performance
purchaseSchema.index({ supplier_no: 1, userId: 1 });
purchaseSchema.index({ created_at: -1 });
purchaseSchema.index({ status: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema); 
const mongoose = require('mongoose');
const invoiceSchema = new mongoose.Schema({
  invoice_no: { type: Number, unique: true, required: true },
  sale_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  date: { type: Date, default: Date.now },
  customer: {
    customer_no: Number,
    name: String,
    address: String,
    phone: String,
    email: String
  },
  businessInfo: {
    name: String,
    logo: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
    email: String,
    website: String,
    taxId: String,
    registrationNumber: String
  },
  items: [{
    product_no: Number,
    name: String,
    qty: Number,
    price: Number,
    discount: Number,
    tax: Number,
    subtotal: Number
  }],
  subtotal: Number,
  total_discount: Number,
  total_tax: Number,
  total: Number,
  paid: Number,
  balance_due: Number,
  status: { type: String, default: 'Unpaid' },
  notes: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
module.exports = mongoose.model('Invoice', invoiceSchema);
const mongoose = require('mongoose');

const paymentOutSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  supplier_no: {
    type: Number,
    required: true
  },
  account_id: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('PaymentOut', paymentOutSchema); 
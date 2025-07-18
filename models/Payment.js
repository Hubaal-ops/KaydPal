const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  customer_id: {
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
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema); 
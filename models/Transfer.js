const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  from_account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  to_account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  transfer_date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transfer', transferSchema); 
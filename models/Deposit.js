const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  deposit_date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Deposit', depositSchema); 
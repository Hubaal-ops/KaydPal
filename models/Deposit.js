const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  deposit_id: {
    type: Number,
    unique: true,
    required: true
  },
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
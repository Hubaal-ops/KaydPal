const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  withdrawal_id: {
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

  withdrawal_date: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema); 
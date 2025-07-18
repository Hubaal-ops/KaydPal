const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expense_id: {
    type: Number,
    unique: true,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
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
  description: {
    type: String,
    trim: true
  },
  expense_date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', expenseSchema); 
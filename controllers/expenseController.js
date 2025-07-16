const Expense = require('../models/Expense');
const Account = require('../models/Account');
const ExpenseCategory = require('../models/ExpenseCategory');

// Get all expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('category', 'name')
      .populate('account', 'name bank');
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('category', 'name')
      .populate('account', 'name bank');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new expense
exports.createExpense = async (req, res) => {
  try {
    const { category, account, amount, description, expense_date } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    const accountDoc = await Account.findById(account);
    if (!accountDoc) return res.status(404).json({ error: 'Account does not exist' });
    const categoryDoc = await ExpenseCategory.findById(category);
    if (!categoryDoc) return res.status(404).json({ error: 'Category does not exist' });
    if (accountDoc.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
    const expense = new Expense({ category, account, amount, description, expense_date });
    await expense.save();
    // Update account balance
    accountDoc.balance -= amount;
    await accountDoc.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { category, account, amount, description, expense_date } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    // Reverse old expense
    const oldAccount = await Account.findById(expense.account);
    if (oldAccount) {
      oldAccount.balance += expense.amount;
      await oldAccount.save();
    }
    // Apply new expense
    const newAccount = await Account.findById(account);
    if (!newAccount) return res.status(404).json({ error: 'Account does not exist' });
    if (newAccount.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
    newAccount.balance -= amount;
    await newAccount.save();
    expense.category = category;
    expense.account = account;
    expense.amount = amount;
    expense.description = description;
    expense.expense_date = expense_date;
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    // Refund account balance
    const account = await Account.findById(expense.account);
    if (account) {
      account.balance += expense.amount;
      await account.save();
    }
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
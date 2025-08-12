const ExpenseCategory = require('../models/ExpenseCategory');

exports.getAllExpenseCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get expense category by ID
exports.getExpenseCategoryById = async (req, res) => {
  try {
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Expense category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new expense category
exports.createExpenseCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newCategory = new ExpenseCategory({ name, description });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update expense category
exports.updateExpenseCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedCategory = await ExpenseCategory.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );
    if (!updatedCategory) return res.status(404).json({ error: 'Expense category not found' });
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete expense category
exports.deleteExpenseCategory = async (req, res) => {
  try {
    const deletedCategory = await ExpenseCategory.findByIdAndDelete(req.params.id);
    if (!deletedCategory) return res.status(404).json({ error: 'Expense category not found' });
    res.json({ message: 'Expense category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
// Get all expense categories
exports.getAllExpenseCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({ userId: req.user.id });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get expense category by ID
exports.getExpenseCategoryById = async (req, res) => {
  try {
    const category = await ExpenseCategory.findOne({ _id: req.params.id, userId: req.user.id });
    if (!category) return res.status(404).json({ error: 'Expense category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new expense category
exports.createExpenseCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newCategory = new ExpenseCategory({ name, description, userId: req.user.id });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update expense category
exports.updateExpenseCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedCategory = await ExpenseCategory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, description },
      { new: true, runValidators: true }
    );
    if (!updatedCategory) return res.status(404).json({ error: 'Expense category not found' });
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete expense category
exports.deleteExpenseCategory = async (req, res) => {
  try {
    const deletedCategory = await ExpenseCategory.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedCategory) return res.status(404).json({ error: 'Expense category not found' });
    res.json({ message: 'Expense category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
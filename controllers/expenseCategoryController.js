const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertExpenseCategory(categoryData) {
  const db = await connectDB();
  const categories = db.collection('expense_categories');

  // Validate required fields
  if (!categoryData.exp_cat_name || categoryData.exp_cat_name.trim() === '') {
    throw new Error('Expense category name is required.');
  }

  // Check if category name already exists
  const existingCategory = await categories.findOne({ 
    exp_cat_name: categoryData.exp_cat_name.trim() 
  });
  
  if (existingCategory) {
    throw new Error('Expense category with this name already exists.');
  }

  // Generate exp_cat_id using counter
  const exp_cat_id = await getNextSequence('exp_cat_id');
  if (!exp_cat_id) {
    throw new Error("❌ Failed to get a valid expense category ID.");
  }

  const newCategory = {
    exp_cat_id,
    exp_cat_name: categoryData.exp_cat_name.trim()
  };

  await categories.insertOne(newCategory);

  return {
    message: "✅ Expense category inserted successfully.",
    exp_cat_id
  };
}

async function getAllExpenseCategories() {
  const db = await connectDB();
  
  const categories = await db.collection('expense_categories')
    .find({})
    .sort({ exp_cat_name: 1 })
    .toArray();

  return categories;
}

async function getExpenseCategoryById(exp_cat_id) {
  const db = await connectDB();
  
  const category = await db.collection('expense_categories').findOne({ exp_cat_id });
  if (!category) {
    throw new Error('Expense category not found.');
  }

  return category;
}

async function updateExpenseCategory(exp_cat_id, updatedData) {
  const db = await connectDB();
  
  const existingCategory = await db.collection('expense_categories').findOne({ exp_cat_id });
  if (!existingCategory) {
    throw new Error('Expense category not found.');
  }

  // Validate category name
  if (!updatedData.exp_cat_name || updatedData.exp_cat_name.trim() === '') {
    throw new Error('Expense category name is required.');
  }

  // Check if new name already exists (excluding current category)
  const duplicateCategory = await db.collection('expense_categories').findOne({ 
    exp_cat_name: updatedData.exp_cat_name.trim(),
    exp_cat_id: { $ne: exp_cat_id }
  });
  
  if (duplicateCategory) {
    throw new Error('Expense category with this name already exists.');
  }

  await db.collection('expense_categories').updateOne(
    { exp_cat_id },
    { $set: { exp_cat_name: updatedData.exp_cat_name.trim() } }
  );

  return {
    message: "✅ Expense category updated successfully.",
    exp_cat_id
  };
}

async function deleteExpenseCategory(exp_cat_id) {
  const db = await connectDB();
  
  const category = await db.collection('expense_categories').findOne({ exp_cat_id });
  if (!category) {
    throw new Error('Expense category not found.');
  }

  // Check if category is being used by any expenses
  const expensesUsingCategory = await db.collection('expenses').findOne({ exp_cat_id });
  if (expensesUsingCategory) {
    throw new Error('Cannot delete category. It is being used by existing expenses.');
  }

  await db.collection('expense_categories').deleteOne({ exp_cat_id });

  return {
    message: "✅ Expense category deleted successfully.",
    exp_cat_id
  };
}

module.exports = {
  insertExpenseCategory,
  getAllExpenseCategories,
  getExpenseCategoryById,
  updateExpenseCategory,
  deleteExpenseCategory
}; 
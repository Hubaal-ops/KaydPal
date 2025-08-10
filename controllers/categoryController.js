const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertCategory(categoryData) {
  const db = await connectDB();
  const categories = db.collection('categories');

  // Validate required fields
  if (!categoryData.category_name || categoryData.category_name.trim() === '') {
    throw new Error('Category name is required.');
  }

  // Check if category name already exists for this user
  if (!categoryData.userId) {
    throw new Error('userId is required for multi-tenancy.');
  }
  const existingCategory = await categories.findOne({ 
    category_name: categoryData.category_name.trim(),
    userId: categoryData.userId
  });
  
  if (existingCategory) {
    throw new Error('Category with this name already exists.');
  }

  // Generate category_id using counter
  const category_id = await getNextSequence('category_id');
  if (!category_id) {
    throw new Error("❌ Failed to get a valid category ID.");
  }

  const newCategory = {
    category_id,
    category_name: categoryData.category_name.trim(),
    description: categoryData.description || '',
    created_at: categoryData.created_at ? new Date(categoryData.created_at) : new Date(),
    userId: categoryData.userId
  };

  await categories.insertOne(newCategory);

  return {
    message: "✅ Category inserted successfully.",
    category_id
  };
}

async function getAllCategories() {
  const db = await connectDB();
  const userId = arguments[0]?.userId;
  if (!userId) {
    throw new Error('userId is required for multi-tenancy.');
  }
  const categories = await db.collection('categories')
    .find({ userId })
    .sort({ category_name: 1 })
    .toArray();
  return categories;
}

async function getCategoryById(category_id) {
  const db = await connectDB();
  const userId = arguments[1]?.userId;
  const category = await db.collection('categories').findOne({ category_id, ...(userId ? { userId } : {}) });
  if (!category) {
    throw new Error('Category not found.');
  }
  return category;
}

async function updateCategory(category_id, updatedData) {
  const db = await connectDB();
  const userId = updatedData.userId;
  const existingCategory = await db.collection('categories').findOne({ category_id, userId });
  if (!existingCategory) {
    throw new Error('Category not found.');
  }
  // Validate category name
  if (!updatedData.category_name || updatedData.category_name.trim() === '') {
    throw new Error('Category name is required.');
  }
  // Check if new name already exists (excluding current category)
  const duplicateCategory = await db.collection('categories').findOne({ 
    category_name: updatedData.category_name.trim(),
    category_id: { $ne: category_id },
    userId
  });
  if (duplicateCategory) {
    throw new Error('Category with this name already exists.');
  }
  const updateFields = {
    category_name: updatedData.category_name.trim(),
    description: updatedData.description || existingCategory.description
  };
  await db.collection('categories').updateOne(
    { category_id, userId },
    { $set: updateFields }
  );
  return {
    message: "✅ Category updated successfully.",
    category_id
  };
}

async function deleteCategory(category_id) {
  const db = await connectDB();
  const userId = arguments[1]?.userId;
  const category = await db.collection('categories').findOne({ category_id, ...(userId ? { userId } : {}) });
  if (!category) {
    throw new Error('Category not found.');
  }
  // Check if category is being used by any products
  const productsUsingCategory = await db.collection('Products').findOne({ category: category.category_name });
  if (productsUsingCategory) {
    throw new Error('Cannot delete category. It is being used by existing products.');
  }
  await db.collection('categories').deleteOne({ category_id, ...(userId ? { userId } : {}) });
  return {
    message: "✅ Category deleted successfully.",
    category_id
  };
}

module.exports = {
  insertCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
}; 
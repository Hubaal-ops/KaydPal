const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertCategory(categoryData) {
  const db = await connectDB();
  const categories = db.collection('categories');

  // Validate required fields
  if (!categoryData.category_name || categoryData.category_name.trim() === '') {
    throw new Error('Category name is required.');
  }

  // Check if category name already exists
  const existingCategory = await categories.findOne({ 
    category_name: categoryData.category_name.trim() 
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
    created_at: categoryData.created_at ? new Date(categoryData.created_at) : new Date()
  };

  await categories.insertOne(newCategory);

  return {
    message: "✅ Category inserted successfully.",
    category_id
  };
}

async function getAllCategories() {
  const db = await connectDB();
  
  const categories = await db.collection('categories')
    .find({})
    .sort({ category_name: 1 })
    .toArray();

  return categories;
}

async function getCategoryById(category_id) {
  const db = await connectDB();
  
  const category = await db.collection('categories').findOne({ category_id });
  if (!category) {
    throw new Error('Category not found.');
  }

  return category;
}

async function updateCategory(category_id, updatedData) {
  const db = await connectDB();
  
  const existingCategory = await db.collection('categories').findOne({ category_id });
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
    category_id: { $ne: category_id }
  });
  
  if (duplicateCategory) {
    throw new Error('Category with this name already exists.');
  }

  const updateFields = {
    category_name: updatedData.category_name.trim(),
    description: updatedData.description || existingCategory.description
  };

  await db.collection('categories').updateOne(
    { category_id },
    { $set: updateFields }
  );

  return {
    message: "✅ Category updated successfully.",
    category_id
  };
}

async function deleteCategory(category_id) {
  const db = await connectDB();
  
  const category = await db.collection('categories').findOne({ category_id });
  if (!category) {
    throw new Error('Category not found.');
  }

  // Check if category is being used by any products
  const productsUsingCategory = await db.collection('Products').findOne({ category: category.category_name });
  if (productsUsingCategory) {
    throw new Error('Cannot delete category. It is being used by existing products.');
  }

  await db.collection('categories').deleteOne({ category_id });

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
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

async function importCategories(file, options) {
  const XLSX = require('xlsx');
  const db = await connectDB();
  const categories = db.collection('categories');
  const userId = options.userId;
  
  if (!userId) {
    throw new Error('userId is required for multi-tenancy.');
  }
  
  try {
    // Read the Excel file from buffer
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error('No data found in the Excel file.');
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    let errors = [];
    
    // Process each row
    for (const [index, row] of jsonData.entries()) {
      try {
        // Extract category data (supporting different column names)
        const categoryName = row.category_name || row.CategoryName || row.name || row.Name || row['Category Name'];
        const description = row.description || row.Description || row.desc || row.Desc || '';
        
        if (!categoryName || categoryName.trim() === '') {
          skippedCount++;
          errors.push(`Row ${index + 1}: Missing category name`);
          continue;
        }
        
        // Check if category already exists
        const existingCategory = await categories.findOne({ 
          category_name: categoryName.trim(),
          userId: userId
        });
        
        if (existingCategory) {
          skippedCount++;
          errors.push(`Row ${index + 1}: Category "${categoryName}" already exists`);
          continue;
        }
        
        // Generate category_id using counter
        const category_id = await getNextSequence('category_id');
        if (!category_id) {
          throw new Error("Failed to get a valid category ID.");
        }
        
        const newCategory = {
          category_id,
          category_name: categoryName.trim(),
          description: description || '',
          created_at: new Date(),
          userId: userId
        };
        
        await categories.insertOne(newCategory);
        importedCount++;
      } catch (error) {
        skippedCount++;
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }
    
    return {
      message: `✅ Import completed. ${importedCount} categories imported, ${skippedCount} skipped.`,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors
    };
  } catch (error) {
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
}

module.exports = {
  insertCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  importCategories
};
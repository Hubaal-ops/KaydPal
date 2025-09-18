const ExpenseCategory = require('../models/ExpenseCategory');
const XLSX = require('xlsx');

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
    
    // Check if category with same name already exists
    const existingCategory = await ExpenseCategory.findOne({ 
      name: name.trim(),
      userId: req.user.id 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        error: 'A category with this name already exists' 
      });
    }
    
    const newCategory = new ExpenseCategory({ 
      name: name.trim(), 
      description: description ? description.trim() : '',
      userId: req.user.id 
    });
    
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    res.status(400).json({ 
      error: 'Failed to create category',
      details: err.message 
    });
  }
};

// Update expense category
exports.updateExpenseCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if another category with the same name exists
    const existingCategory = await ExpenseCategory.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
      userId: req.user.id
    });
    
    if (existingCategory) {
      return res.status(400).json({
        error: 'Another category with this name already exists'
      });
    }
    
    const updatedCategory = await ExpenseCategory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        name: name.trim(), 
        description: description ? description.trim() : '' 
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ error: 'Expense category not found' });
    }
    
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ 
      error: 'Failed to update category',
      details: err.message 
    });
  }
};

// Delete expense category
exports.deleteExpenseCategory = async (req, res) => {
  try {
    // TODO: Check if category is being used in any expenses before deleting
    const deletedCategory = await ExpenseCategory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!deletedCategory) {
      return res.status(404).json({ error: 'Expense category not found' });
    }
    
    res.json({ message: 'Expense category deleted successfully' });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to delete category',
      details: err.message 
    });
  }
};

// Export categories to Excel
exports.exportCategories = async (req, res) => {
  try {
    console.log('Starting export process...');
    
    // Get categories from database
    const categories = await ExpenseCategory.find({ userId: req.user.id })
      .select('name description createdAt')
      .sort({ name: 1 });
    
    if (!categories || categories.length === 0) {
      console.log('No categories found for user:', req.user.id);
      return res.status(404).json({ 
        error: 'No categories found to export',
        code: 'NO_CATEGORIES_FOUND'
      });
    }
    
    console.log(`Found ${categories.length} categories to export`);
    
    try {
      // Format data for Excel
      const data = categories.map((cat, index) => ({
        '#': index + 1,
        'Name': cat.name || '',
        'Description': cat.description || '',
        'Created At': cat.createdAt ? new Date(cat.createdAt).toISOString().split('T')[0] : ''
      }));
      
      console.log('Formatted data for Excel:', JSON.stringify(data, null, 2));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 8 },  // #
        { wch: 30 }, // Name
        { wch: 50 }, // Description
        { wch: 15 }  // Created At
      ];
      ws['!cols'] = wscols;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Expense Categories');
      
      console.log('Excel workbook created');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'buffer',
        bookSST: false
      });
      
      console.log('Excel buffer generated, size:', buffer.length, 'bytes');
      
      // Set headers for file download
      const filename = `expense_categories_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Length', buffer.length);
      
      console.log('Sending file to client...');
      
      // Send the file
      return res.send(buffer);
      
    } catch (excelError) {
      console.error('Error generating Excel file:', excelError);
      throw new Error(`Failed to generate Excel file: ${excelError.message}`);
    }
    
  } catch (err) {
    console.error('Export error:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    
    // Check if headers have already been sent
    if (res.headersSent) {
      console.error('Headers already sent, cannot send error response');
      return res.end();
    }
    
    // Send appropriate error response
    const statusCode = err.statusCode || 500;
    const errorResponse = {
      success: false,
      error: err.message || 'Failed to export categories',
      code: err.code || 'EXPORT_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return res.status(statusCode).json(errorResponse);
  }
};

// Import categories from Excel
exports.importCategories = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Read the Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'No data found in the file' });
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // Process each row
    for (const [index, row] of data.entries()) {
      try {
        const name = row.Name || row.name || '';
        const description = row.Description || row.description || '';
        
        if (!name.trim()) {
          skippedCount++;
          errors.push(`Row ${index + 2}: Missing category name`);
          continue;
        }
        
        // Check if category already exists
        const existingCategory = await ExpenseCategory.findOne({
          name: name.trim(),
          userId: req.user.id
        });
        
        if (existingCategory) {
          skippedCount++;
          errors.push(`Row ${index + 2}: Category "${name}" already exists`);
          continue;
        }
        
        // Create new category
        await ExpenseCategory.create({
          name: name.trim(),
          description: description ? description.trim() : '',
          userId: req.user.id
        });
        
        importedCount++;
      } catch (err) {
        skippedCount++;
        errors.push(`Row ${index + 2}: ${err.message}`);
      }
    }
    
    res.json({
      success: true,
      message: `Import completed. ${importedCount} categories imported, ${skippedCount} skipped.`,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to import categories',
      details: err.message 
    });
  }
};
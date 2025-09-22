const mongoose = require('mongoose');
const Product = require('../models/Product');
const getNextSequence = require('../getNextSequence');
const XLSX = require('xlsx');
const { createNotification } = require('../utils/notificationHelpers');

// Create a new product
async function insertProduct(productData) {
  try {
    // Validate required fields
    if (!productData.product_name || productData.product_name.trim() === '') {
      throw new Error('Product name is required.');
    }

    // Check if product name already exists for this user
    const existingProduct = await Product.findOne({ 
      product_name: productData.product_name.trim(),
      userId: productData.userId
    });
    
    if (existingProduct) {
      throw new Error('Product with this name already exists.');
    }

    // Generate product_no using counter
    const product_no = await getNextSequence('product_no');
    if (!product_no) {
      throw new Error("❌ Failed to get a valid product number.");
    }

    const newProduct = new Product({
      product_no,
      product_name: productData.product_name.trim(),
      description: productData.description || '',
      category: productData.category || null,
      price: Number(productData.price) || 0,
      cost: Number(productData.cost) || 0,
      quantity: Number(productData.quantity) || 0,
      sku: productData.sku || '',
      barcode: productData.barcode || '',
      storing_balance: productData.storing_balance !== undefined ? Number(productData.storing_balance) : 0,
      userId: productData.userId,
      created_at: new Date(),
      updated_at: new Date()
    });

    await newProduct.save();
    
    // Create notification for the user
    try {
      await createNotification(
        userId,
        'New Product Added',
        `A new product "${productData.product_name}" has been added to your inventory.`,
        'success',
        'inventory'
      );
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    return {
      message: "✅ Product created successfully.",
      product_no
    };
  } catch (error) {
    throw error;
  }
}

// Get all products
async function getAllProducts(userId) {
  try {
    const products = await Product.find({ userId })
      .sort({ product_name: 1 })
      .lean();
    return products;
  } catch (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }
}

// Get single product by ID
async function getProductById(product_no, userId) {
  try {
    const product = await Product.findOne({ 
      product_no: Number(product_no), 
      userId 
    }).lean();
    
    if (!product) {
      throw new Error('Product not found.');
    }
    return product;
  } catch (error) {
    throw error;
  }
}

// Update product
async function updateProduct(product_no, updatedData, userId) {
  try {
    const existingProduct = await Product.findOne({ 
      product_no: Number(product_no), 
      userId 
    });
    
    if (!existingProduct) {
      throw new Error('Product not found.');
    }

    // Validate product name if being updated
    if (updatedData.product_name && updatedData.product_name.trim() === '') {
      throw new Error('Product name is required.');
    }

    // Check if new name already exists (excluding current product)
    if (updatedData.product_name) {
      const duplicateProduct = await Product.findOne({ 
        product_name: updatedData.product_name.trim(),
        product_no: { $ne: Number(product_no) },
        userId
      });
      
      if (duplicateProduct) {
        throw new Error('Product with this name already exists.');
      }
    }

    const updateFields = {
      updated_at: new Date()
    };

    // Add fields conditionally with proper type conversion
    if (updatedData.product_name) updateFields.product_name = updatedData.product_name.trim();
    if (updatedData.description !== undefined) updateFields.description = updatedData.description;
    if (updatedData.category !== undefined) updateFields.category = updatedData.category;
    if (updatedData.price !== undefined) updateFields.price = Number(updatedData.price);
    if (updatedData.cost !== undefined) updateFields.cost = Number(updatedData.cost);
    if (updatedData.quantity !== undefined) updateFields.quantity = Number(updatedData.quantity);
    if (updatedData.sku !== undefined) updateFields.sku = updatedData.sku;
    if (updatedData.barcode !== undefined) updateFields.barcode = updatedData.barcode;
    if (updatedData.storing_balance !== undefined) updateFields.storing_balance = Number(updatedData.storing_balance);

    await Product.updateOne(
      { product_no: Number(product_no), userId },
      { $set: updateFields }
    );

    return {
      message: "✅ Product updated successfully.",
      product_no: Number(product_no)
    };
  } catch (error) {
    throw error;
  }
}

// Delete product
async function deleteProduct(product_no, userId) {
  try {
    const result = await Product.deleteOne({ 
      product_no: Number(product_no), 
      userId 
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Product not found.');
    }
    
    return {
      message: "✅ Product deleted successfully.",
      product_no: Number(product_no)
    };
  } catch (error) {
    throw error;
  }
}

// Export products to Excel
async function exportProducts(req, res) {
  try {
    console.log('Starting products export process...');
    
    // Get products from database
    const products = await getAllProducts(req.user.id);
    
    if (!products || products.length === 0) {
      console.log('No products found for user:', req.user.id);
      return res.status(404).json({ 
        error: 'No products found to export',
        code: 'NO_PRODUCTS_FOUND'
      });
    }
    
    console.log(`Found ${products.length} products to export`);
    
    try {
      // Format data for Excel
      const data = products.map((product, index) => ({
        '#': index + 1,
        'Product No': product.product_no || '',
        'Product Name': product.product_name || '',
        'Description': product.description || '',
        'Category': product.category || '',
        'Price': product.price || 0,
        'Cost': product.cost || 0,
        'Quantity': product.quantity || 0,
        'SKU': product.sku || '',
        'Barcode': product.barcode || '',
        'Storing Balance': product.storing_balance || 0
      }));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 8 },   // #
        { wch: 12 },  // Product No
        { wch: 25 },  // Product Name
        { wch: 30 },  // Description
        { wch: 15 },  // Category
        { wch: 12 },  // Price
        { wch: 12 },  // Cost
        { wch: 12 },  // Quantity
        { wch: 15 },  // SKU
        { wch: 15 },  // Barcode
        { wch: 15 }   // Storing Balance
      ];
      ws['!cols'] = wscols;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      
      // Add summary sheet
      const totalProducts = products.length;
      const totalQuantity = products.reduce((sum, product) => sum + (product.quantity || 0), 0);
      const totalValue = products.reduce((sum, product) => sum + (product.quantity || 0) * (product.price || 0), 0);
      
      const summaryData = [
        ['Products Summary'],
        [''],
        ['Total Products', totalProducts],
        ['Total Quantity', totalQuantity],
        ['Total Value', totalValue.toFixed(2)],
        [''],
        ['Generated On', new Date().toISOString().split('T')[0]],
        ['Generated At', new Date().toLocaleTimeString()]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      console.log('Excel workbook created');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'buffer',
        bookSST: false
      });
      
      console.log('Excel buffer generated, size:', buffer.length, 'bytes');
      
      // Set headers for file download
      const filename = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      error: err.message || 'Failed to export products',
      code: err.code || 'EXPORT_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return res.status(statusCode).json(errorResponse);
  }
}

// Import products from Excel
async function importProducts(req, res) {
  try {
    console.log('Starting products import process...');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ 
        error: 'No file uploaded',
        code: 'NO_FILE_UPLOADED'
      });
    }
    
    console.log('Processing uploaded file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // Read the Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (!data || data.length === 0) {
      console.log('No data found in the Excel file');
      return res.status(400).json({
        error: 'No data found in the Excel file',
        code: 'NO_DATA_FOUND'
      });
    }
    
    console.log(`Found ${data.length} records in the Excel file`);
    
    // Get existing products for this user to check for duplicates
    const userId = req.user.id;
    const existingProducts = await Product.find({ userId });
    const existingProductNames = new Set(existingProducts.map(p => p.product_name.toLowerCase()));
    
    // Process each record
    const results = {
      total: data.length,
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel is 1-based and we have a header row
      
      try {
        // Validate required fields
        if (!row['Product Name']) {
          throw new Error('Product Name is required');
        }
        
        // Check for duplicates
        const productName = row['Product Name'].toString().trim();
        if (existingProductNames.has(productName.toLowerCase())) {
          throw new Error(`Product with name "${productName}" already exists`);
        }
        
        // Create new product
        const productData = {
          product_name: productName,
          description: row['Description'] || '',
          category: row['Category'] || '',
          price: parseFloat(row['Price']) || 0,
          cost: parseFloat(row['Cost']) || 0,
          quantity: parseInt(row['Quantity']) || 0,
          sku: row['SKU'] || '',
          barcode: row['Barcode'] || '',
          storing_balance: parseFloat(row['Storing Balance']) || 0,
          userId: userId
        };
        
        await insertProduct(productData);
        results.imported++;
        existingProductNames.add(productName.toLowerCase());
        
      } catch (err) {
        console.error(`Error processing row ${rowNumber}:`, err);
        results.skipped++;
        results.errors.push({
          row: rowNumber,
          message: err.message,
          code: err.code || 'PROCESSING_ERROR'
        });
      }
    }
    
    console.log('Import completed:', results);
    
    // Prepare response
    const response = {
      success: true,
      message: `Import completed: ${results.imported} imported, ${results.skipped} skipped`,
      ...results
    };
    
    // If there were any errors, include them in the response
    if (results.errors.length > 0) {
      response.hasErrors = true;
      response.errorCount = results.errors.length;
    }
    
    res.json(response);
    
  } catch (err) {
    console.error('Import error:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to import products',
      details: err.message,
      code: 'IMPORT_ERROR'
    });
  }
}

// Download product import template
async function downloadTemplate(req, res) {
  try {
    console.log('Generating product import template...');
    
    // Create sample template data
    const templateData = [
      {
        'Product Name': 'Sample Product',
        'Description': 'Sample product description',
        'Category': 'Electronics',
        'Price': 99.99,
        'Cost': 50.00,
        'Quantity': 100,
        'SKU': 'SAMPLE-001',
        'Barcode': '123456789012',
        'Storing Balance': 100
      },
      {
        'Product Name': 'Another Product',
        'Description': 'Another product description',
        'Category': 'Clothing',
        'Price': 29.99,
        'Cost': 15.00,
        'Quantity': 50,
        'SKU': 'SAMPLE-002',
        'Barcode': '234567890123',
        'Storing Balance': 50
      }
    ];
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      { wch: 25 },  // Product Name
      { wch: 30 },  // Description
      { wch: 15 },  // Category
      { wch: 12 },  // Price
      { wch: 12 },  // Cost
      { wch: 12 },  // Quantity
      { wch: 15 },  // SKU
      { wch: 15 },  // Barcode
      { wch: 15 }   // Storing Balance
    ];
    ws['!cols'] = wscols;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    
    // Add instructions sheet
    const instructions = [
      ['Instructions for Importing Products'],
      [''],
      ['1. Fill in the required field: Product Name'],
      ['2. All other fields are optional'],
      ['3. Price, Cost, Quantity, and Storing Balance should be numeric values'],
      ['4. Product names must be unique'],
      ['5. SKU and Barcode should be unique identifiers'],
      [''],
      ['Field Descriptions:'],
      ['Product Name: The name of the product (required, unique)'],
      ['Description: Product description'],
      ['Category: Product category'],
      ['Price: Selling price of the product'],
      ['Cost: Cost price of the product'],
      ['Quantity: Current quantity in stock'],
      ['SKU: Stock Keeping Unit (unique identifier)'],
      ['Barcode: Product barcode'],
      ['Storing Balance: Current storing balance']
    ];
    
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer',
      bookSST: false
    });
    
    console.log('Template generated, size:', buffer.length, 'bytes');
    
    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="product_import_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    
    // Send the file
    return res.send(buffer);
    
  } catch (err) {
    console.error('Template generation error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate template',
      details: err.message,
      code: 'TEMPLATE_ERROR'
    });
  }
}

module.exports = {
  insertProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  exportProducts,
  importProducts,
  downloadTemplate
};

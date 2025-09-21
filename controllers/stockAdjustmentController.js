const connectDB = require('../db');
const StoreProduct = require('../models/StoreProduct');
const Product = require('../models/Product');
const Store = require('../models/Store');
const StockAdjustment = require('../models/StockAdjustment');
const getNextSequence = require('../getNextSequence');
const { recalculateProductBalance, recalculateStoreTotal } = require('./storeProductController');
const XLSX = require('xlsx');

async function getNextSequenceValue(sequenceName) {
  // Use shared getNextSequence
  return await getNextSequence(sequenceName);
}

async function insertStockAdjustment(adjustmentData) {
  const db = await connectDB();
  const {
    product_no,
    store_no,
    qty,
    adj_type,
    adj_desc,
    userId // allow passing userId explicitly for multi-tenancy
  } = adjustmentData;

  // Basic validations
  if (qty <= 0) {
    throw new Error('Adjustment quantity must be greater than 0');
  }
  if (!['add', 'subtract'].includes(adj_type.toLowerCase())) {
    throw new Error('Adjustment type must be either "add" or "subtract"');
  }

  // Validate product exists
  console.log('DEBUG: Looking for product_no:', product_no, typeof product_no);
  const product = await Product.findOne({ product_no });
  if (!product) throw new Error('Product not found');
  // Validate store exists
  const store = await Store.findOne({ store_no });
  if (!store) throw new Error('Store not found');

  // For subtract, validate sufficient stock exists
  if (adj_type.toLowerCase() === 'subtract') {
    const storeProduct = await StoreProduct.findOne({ product_no, store_no });
    if (!storeProduct) throw new Error('Product not found in this store');
    if (storeProduct.qty < qty) throw new Error(`Insufficient stock. Current stock: ${storeProduct.qty}`);
  }

  // Get next adjustment number
  const adj_no = await getNextSequenceValue('stock_adjustment');

  // Create adjustment record
  const newAdjustment = {
    adj_no,
    product_no,
    store_no,
    qty,
    adj_type: adj_type.toLowerCase(),
    adj_desc,
    created_at: new Date(),
    updated_at: new Date(),
    userId // set userId for multi-tenancy
  };

  try {
    // Insert adjustment record
    await db.collection('Stock_Adjustments').insertOne(newAdjustment);

    // Update StoreProduct model
    let storeProduct = await StoreProduct.findOne({ product_no, store_no });
    if (!storeProduct) {
      const store_product_no = await getNextSequence('store_product_no');
      await StoreProduct.create({
        store_product_no,
        product_no,
        store_no,
        qty: adj_type.toLowerCase() === 'add' ? qty : 0,
        created_at: new Date(),
        updated_at: new Date(),
        userId // Add userId here
      });
    } else {
      await StoreProduct.updateOne(
        { product_no, store_no },
        { $inc: { qty: adj_type.toLowerCase() === 'add' ? qty : -qty }, $set: { updated_at: new Date() } }
      );
    }

    // Recalculate product and store summaries
    await recalculateProductBalance(product_no);
    await recalculateStoreTotal(store_no);

    return {
      message: 'Stock adjustment processed successfully',
      adj_no
    };
  } catch (error) {
    // If any operation fails, try to clean up
    try {
      await db.collection('Stock_Adjustments').deleteOne({ adj_no });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    throw error;
  }
}

async function getAllStockAdjustments() {
  const db = await connectDB();
  // Only return adjustments for the authenticated user
  const userId = arguments[0]?.userId || (typeof arguments[0] === 'object' && arguments[0]?.req?.user?.id);
  const filter = userId ? { userId } : {};
  const adjustments = await db.collection('Stock_Adjustments').find(filter).sort({ created_at: -1 }).toArray();
  return adjustments;
}

// Export stock adjustments to Excel
async function exportStockAdjustments(req, res) {
  try {
    console.log('Starting stock adjustments export process...');
    
    // Get adjustments from database
    const adjustments = await getAllStockAdjustments({ userId: req.user.id });
    
    if (!adjustments || adjustments.length === 0) {
      console.log('No stock adjustments found for user:', req.user.id);
      return res.status(404).json({ 
        error: 'No stock adjustments found to export',
        code: 'NO_ADJUSTMENTS_FOUND'
      });
    }
    
    console.log(`Found ${adjustments.length} stock adjustments to export`);
    
    try {
      // Get products and stores for name mapping
      const products = await Product.find({ userId: req.user.id });
      const stores = await Store.find({ userId: req.user.id });
      
      // Create maps for lookup
      const productMap = {};
      const storeMap = {};
      
      products.forEach(p => {
        productMap[p.product_no] = p.product_name;
      });
      
      stores.forEach(s => {
        storeMap[s.store_no] = s.store_name;
      });
      
      // Format data for Excel
      const data = adjustments.map((adj, index) => ({
        '#': index + 1,
        'Adjustment No': adj.adj_no || '',
        'Product Name': productMap[adj.product_no] || adj.product_no,
        'Store Name': storeMap[adj.store_no] || adj.store_no,
        'Quantity': adj.qty || 0,
        'Type': adj.adj_type || '',
        'Description': adj.adj_desc || '',
        'Date': adj.created_at ? new Date(adj.created_at).toISOString().split('T')[0] : ''
      }));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 8 },   // #
        { wch: 15 },  // Adjustment No
        { wch: 25 },  // Product Name
        { wch: 25 },  // Store Name
        { wch: 12 },  // Quantity
        { wch: 12 },  // Type
        { wch: 30 },  // Description
        { wch: 15 }   // Date
      ];
      ws['!cols'] = wscols;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'StockAdjustments');
      
      // Add summary sheet
      const totalAdjustments = adjustments.length;
      const totalQuantity = adjustments.reduce((sum, adj) => sum + (adj.qty || 0), 0);
      const addAdjustments = adjustments.filter(adj => adj.adj_type === 'add').length;
      const subtractAdjustments = adjustments.filter(adj => adj.adj_type === 'subtract').length;
      
      const summaryData = [
        ['Stock Adjustments Summary'],
        [''],
        ['Total Adjustments', totalAdjustments],
        ['Total Quantity', totalQuantity],
        ['Add Adjustments', addAdjustments],
        ['Subtract Adjustments', subtractAdjustments],
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
      const filename = `stock_adjustments_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      error: err.message || 'Failed to export stock adjustments',
      code: err.code || 'EXPORT_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return res.status(statusCode).json(errorResponse);
  }
}

// Import stock adjustments from Excel
async function importStockAdjustments(req, res) {
  try {
    console.log('Starting stock adjustments import process...');
    
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
    
    // Get all products and stores for this user to validate references
    const userId = req.user.id;
    const products = await Product.find({ userId });
    const stores = await Store.find({ userId });
    
    // Create maps for name to ID lookup
    const productNameMap = {};
    const storeNameMap = {};
    
    products.forEach(prod => {
      productNameMap[prod.product_name.toLowerCase()] = prod.product_no;
    });
    
    stores.forEach(store => {
      storeNameMap[store.store_name.toLowerCase()] = store.store_no;
    });
    
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
        if (!row['Product Name'] || !row['Store Name'] || !row['Quantity'] || !row['Type']) {
          throw new Error('Missing required fields (Product Name, Store Name, Quantity, and Type are required)');
        }
        
        // Validate quantity
        const qty = parseFloat(row['Quantity']);
        if (isNaN(qty) || qty <= 0) {
          throw new Error('Quantity must be a positive number');
        }
        
        // Validate type
        const adjType = row['Type'].toString().trim().toLowerCase();
        if (!['add', 'subtract'].includes(adjType)) {
          throw new Error('Type must be either "add" or "subtract"');
        }
        
        // Find product by name
        const productName = row['Product Name'].toString().trim();
        const productNo = productNameMap[productName.toLowerCase()];
        if (!productNo) {
          throw new Error(`Product with name "${productName}" not found. Please make sure the product exists in the system.`);
        }
        
        // Find store by name
        const storeName = row['Store Name'].toString().trim();
        const storeNo = storeNameMap[storeName.toLowerCase()];
        if (!storeNo) {
          throw new Error(`Store with name "${storeName}" not found. Please make sure the store exists in the system.`);
        }
        
        // For subtract, validate sufficient stock exists
        if (adjType === 'subtract') {
          const storeProduct = await StoreProduct.findOne({ product_no: productNo, store_no: storeNo });
          if (!storeProduct) throw new Error(`Product not found in this store`);
          if (storeProduct.qty < qty) throw new Error(`Insufficient stock. Current stock: ${storeProduct.qty}`);
        }
        
        // Create new stock adjustment
        const adjData = {
          product_no: productNo,
          store_no: storeNo,
          qty: qty,
          adj_type: adjType,
          adj_desc: row['Description'] || '',
          userId: userId
        };
        
        await insertStockAdjustment(adjData);
        results.imported++;
        
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
      error: 'Failed to import stock adjustments',
      details: err.message,
      code: 'IMPORT_ERROR'
    });
  }
}

// Download stock adjustment import template
async function downloadTemplate(req, res) {
  try {
    console.log('Generating stock adjustment import template...');
    
    // Get actual products and stores for this user to include in template
    const userId = req.user.id;
    const products = await Product.find({ userId }).limit(5);
    const stores = await Store.find({ userId }).limit(3);
    
    let templateData = [];
    
    // If user has existing data, use it in template
    if (products.length > 0 && stores.length > 0) {
      // Create sample data using actual user data
      templateData = [
        {
          'Product Name': products[0].product_name,
          'Store Name': stores[0].store_name,
          'Quantity': 10,
          'Type': 'add',
          'Description': 'Sample adjustment'
        },
        {
          'Product Name': products.length > 1 ? products[1].product_name : products[0].product_name,
          'Store Name': stores.length > 1 ? stores[1].store_name : stores[0].store_name,
          'Quantity': 5,
          'Type': 'subtract',
          'Description': 'Another adjustment'
        }
      ];
    } else {
      // Fallback to generic template if no data exists
      templateData = [
        {
          'Product Name': 'Sample Product',
          'Store Name': 'Main Store',
          'Quantity': 10,
          'Type': 'add',
          'Description': 'Sample adjustment'
        },
        {
          'Product Name': 'Another Product',
          'Store Name': 'Secondary Store',
          'Quantity': 5,
          'Type': 'subtract',
          'Description': 'Another adjustment'
        }
      ];
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      { wch: 25 },  // Product Name
      { wch: 25 },  // Store Name
      { wch: 12 },  // Quantity
      { wch: 12 },  // Type
      { wch: 30 }   // Description
    ];
    ws['!cols'] = wscols;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'StockAdjustments');
    
    // Add instructions sheet
    const instructions = [
      ['Instructions for Importing Stock Adjustments'],
      [''],
      ['1. Fill in the required fields: Product Name, Store Name, Quantity, and Type'],
      ['2. Description is optional'],
      ['3. Type must be either "add" or "subtract"'],
      ['4. Quantity must be a positive number'],
      ['5. Make sure all products and stores exist in the system'],
      ['6. For subtract adjustments, ensure sufficient stock exists'],
      [''],
      ['Available Products:'],
      ['Product Name'],
      ...products.map(prod => [prod.product_name]),
      [''],
      ['Available Stores:'],
      ['Store Name'],
      ...stores.map(store => [store.store_name])
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
    res.setHeader('Content-Disposition', 'attachment; filename="stock_adjustment_import_template.xlsx"');
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
  insertStockAdjustment, 
  getAllStockAdjustments,
  exportStockAdjustments,
  importStockAdjustments,
  downloadTemplate
};
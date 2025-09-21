const connectDB = require('../db');
const StockTransfer = require('../models/StockTransfer');
const StoreProduct = require('../models/StoreProduct');
const Product = require('../models/Product');
const Store = require('../models/Store');
const getNextSequence = require('../getNextSequence');
const { recalculateProductBalance, recalculateStoreTotal } = require('./storeProductController');
const XLSX = require('xlsx');

async function getNextSequenceValue(sequenceName) {
  return await getNextSequence(sequenceName);
}

async function insertStockTransfer(transferData) {
  const {
    from_store,
    to_store,
    product_no,
    qty,
    transfer_desc,
    userId // allow passing userId explicitly for multi-tenancy
  } = transferData;

  // Basic validations
  if (from_store === to_store) {
    throw new Error('Cannot transfer to the same store');
  }
  if (qty <= 0) {
    throw new Error('Transfer quantity must be greater than 0');
  }

  // Validate stores exist
  const fromStore = await Store.findOne({ store_no: from_store });
  if (!fromStore) throw new Error('Source store not found');
  const toStore = await Store.findOne({ store_no: to_store });
  if (!toStore) throw new Error('Destination store not found');

  // Validate product exists
  const product = await Product.findOne({ product_no });
  if (!product) throw new Error('Product not found');

  // Check if source store has enough stock
  const fromStoreProduct = await StoreProduct.findOne({ product_no, store_no: from_store });
  if (!fromStoreProduct) throw new Error('Product not found in source store');
  if (fromStoreProduct.qty < qty) throw new Error('Insufficient stock in source store');

  // Get next transfer_id
  const transfer_id = await getNextSequenceValue('stock_transfers');

  // Create transfer record
  const newTransfer = new StockTransfer({
    transfer_id,
    from_store,
    to_store,
    product_no,
    qty,
    transfer_desc,
    status: 'completed',
    created_at: new Date(),
    updated_at: new Date(),
    userId // set userId for multi-tenancy
  });

  try {
    await newTransfer.save();

    // Update source store stock
    await StoreProduct.updateOne(
      { product_no, store_no: from_store },
      { $inc: { qty: -qty }, $set: { updated_at: new Date() } }
    );

    // Update source store total items
    await Store.updateOne(
      { store_no: from_store },
      { $inc: { total_items: -qty } }
    );

    // Update/Create destination store product
    let toStoreProduct = await StoreProduct.findOne({ product_no, store_no: to_store });
    if (!toStoreProduct) {
      const store_product_no = await getNextSequence('store_product_no');
      await StoreProduct.create({
        store_product_no,
        product_no,
        store_no: to_store,
        qty,
        created_at: new Date(),
        updated_at: new Date(),
        userId // Add userId here
      });
    } else {
      await StoreProduct.updateOne(
        { product_no, store_no: to_store },
        { $inc: { qty }, $set: { updated_at: new Date() } }
      );
    }

    // Update destination store total items
    await Store.updateOne(
      { store_no: to_store },
      { $inc: { total_items: qty } }
    );

    // Recalculate product and store summaries
    await recalculateProductBalance(product_no);
    await recalculateStoreTotal(from_store);
    await recalculateStoreTotal(to_store);

    return {
      message: 'Stock transfer completed successfully',
      transfer_id
    };
  } catch (error) {
    // If any operation fails, try to clean up
    try {
      await StockTransfer.deleteOne({ transfer_id });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    throw error;
  }
}

async function getAllStockTransfers() {
  const StockTransfer = require('../models/StockTransfer');
  const Product = require('../models/Product');
  const Store = require('../models/Store');
  // Only return transfers for the authenticated user
  const userId = arguments[0]?.userId || (typeof arguments[0] === 'object' && arguments[0]?.req?.user?.id);
  const filter = userId ? { userId } : {};
  const transfers = await StockTransfer.find(filter).sort({ created_at: -1 });
  const products = await Product.find();
  const stores = await Store.find();
  const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
  const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
  return transfers.map(tr => ({
    ...tr.toObject(),
    product_name: productMap[tr.product_no] || '',
    from_store_name: storeMap[tr.from_store] || '',
    to_store_name: storeMap[tr.to_store] || ''
  }));
}

// Export stock transfers to Excel
async function exportStockTransfers(req, res) {
  try {
    console.log('Starting stock transfers export process...');
    
    // Get transfers from database
    const transfers = await getAllStockTransfers({ userId: req.user.id });
    
    if (!transfers || transfers.length === 0) {
      console.log('No stock transfers found for user:', req.user.id);
      return res.status(404).json({ 
        error: 'No stock transfers found to export',
        code: 'NO_TRANSFERS_FOUND'
      });
    }
    
    console.log(`Found ${transfers.length} stock transfers to export`);
    
    try {
      // Format data for Excel
      const data = transfers.map((tr, index) => ({
        '#': index + 1,
        'Transfer ID': tr.transfer_id || '',
        'Product Name': tr.product_name || '',
        'From Store': tr.from_store_name || '',
        'To Store': tr.to_store_name || '',
        'Quantity': tr.qty || 0,
        'Description': tr.transfer_desc || '',
        'Date': tr.created_at ? new Date(tr.created_at).toISOString().split('T')[0] : ''
      }));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 8 },   // #
        { wch: 15 },  // Transfer ID
        { wch: 25 },  // Product Name
        { wch: 25 },  // From Store
        { wch: 25 },  // To Store
        { wch: 12 },  // Quantity
        { wch: 30 },  // Description
        { wch: 15 }   // Date
      ];
      ws['!cols'] = wscols;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'StockTransfers');
      
      // Add summary sheet
      const totalTransfers = transfers.length;
      const totalQuantity = transfers.reduce((sum, tr) => sum + (tr.qty || 0), 0);
      
      const summaryData = [
        ['Stock Transfers Summary'],
        [''],
        ['Total Transfers', totalTransfers],
        ['Total Quantity', totalQuantity],
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
      const filename = `stock_transfers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      error: err.message || 'Failed to export stock transfers',
      code: err.code || 'EXPORT_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return res.status(statusCode).json(errorResponse);
  }
}

// Import stock transfers from Excel
async function importStockTransfers(req, res) {
  try {
    console.log('Starting stock transfers import process...');
    
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
        if (!row['Product Name'] || !row['From Store'] || !row['To Store'] || !row['Quantity']) {
          throw new Error('Missing required fields (Product Name, From Store, To Store, and Quantity are required)');
        }
        
        // Validate quantity
        const qty = parseFloat(row['Quantity']);
        if (isNaN(qty) || qty <= 0) {
          throw new Error('Quantity must be a positive number');
        }
        
        // Find product by name
        const productName = row['Product Name'].toString().trim();
        const productNo = productNameMap[productName.toLowerCase()];
        if (!productNo) {
          throw new Error(`Product with name "${productName}" not found. Please make sure the product exists in the system.`);
        }
        
        // Find from store by name
        const fromStoreName = row['From Store'].toString().trim();
        const fromStoreNo = storeNameMap[fromStoreName.toLowerCase()];
        if (!fromStoreNo) {
          throw new Error(`Store with name "${fromStoreName}" not found. Please make sure the store exists in the system.`);
        }
        
        // Find to store by name
        const toStoreName = row['To Store'].toString().trim();
        const toStoreNo = storeNameMap[toStoreName.toLowerCase()];
        if (!toStoreNo) {
          throw new Error(`Store with name "${toStoreName}" not found. Please make sure the store exists in the system.`);
        }
        
        // Validate stores are different
        if (fromStoreNo === toStoreNo) {
          throw new Error('Cannot transfer to the same store');
        }
        
        // Create new stock transfer
        const transferData = {
          from_store: fromStoreNo,
          to_store: toStoreNo,
          product_no: productNo,
          qty: qty,
          transfer_desc: row['Description'] || '',
          userId: userId
        };
        
        await insertStockTransfer(transferData);
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
      error: 'Failed to import stock transfers',
      details: err.message,
      code: 'IMPORT_ERROR'
    });
  }
}

// Download stock transfer import template
async function downloadTemplate(req, res) {
  try {
    console.log('Generating stock transfer import template...');
    
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
          'From Store': stores[0].store_name,
          'To Store': stores.length > 1 ? stores[1].store_name : stores[0].store_name,
          'Quantity': 10,
          'Description': 'Sample transfer'
        },
        {
          'Product Name': products.length > 1 ? products[1].product_name : products[0].product_name,
          'From Store': stores.length > 1 ? stores[1].store_name : stores[0].store_name,
          'To Store': stores[0].store_name,
          'Quantity': 5,
          'Description': 'Another transfer'
        }
      ];
    } else {
      // Fallback to generic template if no data exists
      templateData = [
        {
          'Product Name': 'Sample Product',
          'From Store': 'Main Store',
          'To Store': 'Secondary Store',
          'Quantity': 10,
          'Description': 'Sample transfer'
        },
        {
          'Product Name': 'Another Product',
          'From Store': 'Secondary Store',
          'To Store': 'Main Store',
          'Quantity': 5,
          'Description': 'Another transfer'
        }
      ];
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      { wch: 25 },  // Product Name
      { wch: 25 },  // From Store
      { wch: 25 },  // To Store
      { wch: 12 },  // Quantity
      { wch: 30 }   // Description
    ];
    ws['!cols'] = wscols;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'StockTransfers');
    
    // Add instructions sheet
    const instructions = [
      ['Instructions for Importing Stock Transfers'],
      [''],
      ['1. Fill in the required fields: Product Name, From Store, To Store, and Quantity'],
      ['2. Description is optional'],
      ['3. Quantity must be a positive number'],
      ['4. From Store and To Store must be different'],
      ['5. Make sure all products and stores exist in the system'],
      ['6. Ensure sufficient stock exists in the source store'],
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
    res.setHeader('Content-Disposition', 'attachment; filename="stock_transfer_import_template.xlsx"');
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
  insertStockTransfer, 
  getAllStockTransfers,
  exportStockTransfers,
  importStockTransfers,
  downloadTemplate
};
const PaymentOut = require('../models/PaymentOut');
const Supplier = require('../models/Supplier');
const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

// Get all payment outs
exports.getAllPaymentsOut = async (req, res) => {
  try {
    const payments = await PaymentOut.find({ userId: req.user.id }).sort({ created_at: -1 });
    res.json({ data: payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get payment out by ID
exports.getPaymentOutById = async (req, res) => {
  try {
    const payment = await PaymentOut.findOne({ id: req.params.id, userId: req.user.id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new payment out
exports.createPaymentOut = async (req, res) => {
  // Use manual rollback for standalone MongoDB (local development)
  let supplier = null;
  let account = null;
  let originalSupplierBalance = 0;
  let originalAccountBalance = 0;
  
  try {
    const { supplier_no, account_id, amount, description } = req.body;
    
    // Enhanced validation with detailed error messages
    if (!supplier_no) {
      return res.status(400).json({ error: 'Supplier number is required' });
    }
    if (!account_id) {
      return res.status(400).json({ error: 'Account ID is required' });
    }
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    // Get next payment out id
    const id = await getNextSequence('payment_out');
    if (!id) {
      return res.status(500).json({ error: 'Failed to generate payment out ID' });
    }

    // Find and validate supplier
    supplier = await Supplier.findOne({ supplier_no: Number(supplier_no), userId: req.user.id });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    if (supplier.balance < amount) {
      return res.status(400).json({ error: 'Supplier does not have enough balance' });
    }
    
    // Find and validate account
    account = await Account.findOne({ account_id: Number(account_id), userId: req.user.id });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Store original balances for potential rollback
    originalSupplierBalance = supplier.balance;
    originalAccountBalance = account.balance;
    
    // Update supplier balance
    supplier.balance = (supplier.balance || 0) - Number(amount);
    await supplier.save();

    // Update account balance
    account.balance = (account.balance || 0) - Number(amount);
    await account.save();

    // Create payment out data
    const paymentData = {
      id, 
      supplier_no: Number(supplier_no), 
      account_id: Number(account_id), 
      amount: Number(amount), 
      description: description || '',
      userId: req.user.id
    };
    
    // Save payment out
    const payment = new PaymentOut(paymentData);
    await payment.save();

    res.status(201).json({ 
      success: true,
      message: 'Payment out created successfully',
      data: payment
    });
  } catch (err) {
    // Manual rollback if payment creation failed after balance updates
    console.error('Payment out creation error, attempting manual rollback:', err);
    
    try {
      if (supplier && originalSupplierBalance !== undefined) {
        supplier.balance = originalSupplierBalance;
        await supplier.save();
        console.log('Supplier balance rolled back');
      }
      
      if (account && originalAccountBalance !== undefined) {
        account.balance = originalAccountBalance;
        await account.save();
        console.log('Account balance rolled back');
      }
    } catch (rollbackErr) {
      console.error('Manual rollback failed:', rollbackErr);
      return res.status(500).json({ 
        error: 'Payment creation failed and rollback failed',
        details: 'Data may be inconsistent. Please check balances manually.',
        originalError: err.message,
        rollbackError: rollbackErr.message
      });
    }
    
    res.status(400).json({ 
      error: 'Failed to create payment out: ' + err.message,
      details: 'Changes have been rolled back manually' 
    });
  }
};

// Update payment out
exports.updatePaymentOut = async (req, res) => {
  try {
    const { supplier_no, account_id, amount, description } = req.body;
    const payment = await PaymentOut.findOneAndUpdate(
      { id: req.params.id, userId: req.user.id },
      { supplier_no, account_id, amount, description, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete payment out
exports.deletePaymentOut = async (req, res) => {
  try {
    const payment = await PaymentOut.findOneAndDelete({ id: req.params.id, userId: req.user.id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export payments out to Excel
exports.exportPaymentsOut = async (req, res) => {
  try {
    console.log('Starting payment out export process...');
    
    // Get payments from database
    const payments = await PaymentOut.find({ userId: req.user.id })
      .sort({ created_at: -1 });
    
    if (!payments || payments.length === 0) {
      console.log('No payments out found for user:', req.user.id);
      return res.status(404).json({ 
        error: 'No payments out found to export',
        code: 'NO_PAYMENTS_FOUND'
      });
    }
    
    console.log(`Found ${payments.length} payments out to export`);
    
    try {
      // Format data for Excel with more detailed information
      const data = payments.map((pay, index) => ({
        '#': index + 1,
        'Payment ID': pay.id || '',
        'Supplier No': pay.supplier_no || '',
        'Account ID': pay.account_id || '',
        'Amount': pay.amount || 0,
        'Description': pay.description || '',
        'Created At': pay.created_at ? new Date(pay.created_at).toISOString().split('T')[0] : '',
        'Created Time': pay.created_at ? new Date(pay.created_at).toLocaleTimeString() : ''
      }));
      
      console.log('Formatted data for Excel:', JSON.stringify(data[0], null, 2));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 8 },   // #
        { wch: 15 },  // Payment ID
        { wch: 15 },  // Supplier No
        { wch: 15 },  // Account ID
        { wch: 15 },  // Amount
        { wch: 25 },  // Description
        { wch: 15 },  // Created At
        { wch: 15 }   // Created Time
      ];
      ws['!cols'] = wscols;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'PaymentsOut');
      
      // Add summary sheet
      const totalAmount = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
      const summaryData = [
        ['Payments Out Summary'],
        [''],
        ['Total Payments', payments.length],
        ['Total Amount', totalAmount],
        ['Average Amount', payments.length > 0 ? (totalAmount / payments.length).toFixed(2) : 0],
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
      const filename = `payments_out_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      error: err.message || 'Failed to export payments out',
      code: err.code || 'EXPORT_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return res.status(statusCode).json(errorResponse);
  }
};

// Import payments out from Excel
exports.importPaymentsOut = async (req, res) => {
  try {
    console.log('Starting payment out import process...');
    
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
    
    // Get all suppliers and accounts for this user to validate references
    const userId = req.user.id;
    const suppliers = await Supplier.find({ userId });
    const accounts = await Account.find({ userId });
    
    // Create maps for name to ID lookup
    const supplierNameMap = {};
    const accountNameMap = {};
    
    suppliers.forEach(supp => {
      supplierNameMap[supp.name.toLowerCase()] = supp.supplier_no;
    });
    
    accounts.forEach(acc => {
      // Use account name, bank, or name field for mapping
      const accountName = acc.account_name || acc.bank || acc.name;
      if (accountName) {
        accountNameMap[accountName.toLowerCase()] = acc.account_id;
      }
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
        // Validate required fields - now using names instead of IDs
        if (!row['Supplier Name'] || !row['Account Name'] || !row['Amount']) {
          throw new Error('Missing required fields (Supplier Name, Account Name, and Amount are required)');
        }
        
        // Validate amount
        const amount = parseFloat(row['Amount']);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        
        // Find supplier by name
        const supplierName = row['Supplier Name'].toString().trim();
        const supplierNo = supplierNameMap[supplierName.toLowerCase()];
        if (!supplierNo) {
          throw new Error(`Supplier with name "${supplierName}" not found. Please make sure the supplier exists in the system.`);
        }
        
        // Find account by name
        const accountName = row['Account Name'].toString().trim();
        const accountId = accountNameMap[accountName.toLowerCase()];
        if (!accountId) {
          throw new Error(`Account with name "${accountName}" not found. Please make sure the account exists in the system.`);
        }
        
        // Validate supplier has enough balance
        const supplier = await Supplier.findOne({ supplier_no: supplierNo, userId });
        if (!supplier) {
          throw new Error(`Supplier with number "${supplierNo}" not found.`);
        }
        if (supplier.balance < amount) {
          throw new Error(`Supplier "${supplierName}" does not have enough balance.`);
        }
        
        // Create new payment out
        const id = await getNextSequence('payment_out');
        if (!id) {
          throw new Error('Failed to generate payment out ID');
        }
        
        // Find account document
        const account = await Account.findOne({ account_id: accountId, userId });
        if (!account) {
          throw new Error(`Account with ID "${accountId}" not found.`);
        }
        
        // Update supplier balance
        supplier.balance = (supplier.balance || 0) - amount;
        await supplier.save();

        // Update account balance
        account.balance = (account.balance || 0) - amount;
        await account.save();

        const payment = new PaymentOut({
          id,
          supplier_no: supplierNo,
          account_id: accountId,
          amount: amount,
          description: row['Description'] || '',
          userId: userId
        });
        
        await payment.save();
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
      error: 'Failed to import payments out',
      details: err.message,
      code: 'IMPORT_ERROR'
    });
  }
};

// Download payment out import template
exports.downloadTemplate = async (req, res) => {
  try {
    console.log('Generating payment out import template...');
    
    // Get actual suppliers and accounts for this user to include in template
    const userId = req.user.id;
    const suppliers = await Supplier.find({ userId }).limit(5);
    const accounts = await Account.find({ userId }).limit(3);
    
    let templateData = [];
    
    // If user has existing data, use it in template
    if (suppliers.length > 0 && accounts.length > 0) {
      // Create sample data using actual user data
      templateData = [
        {
          'Supplier Name': suppliers[0].name,
          'Account Name': accounts[0].account_name || accounts[0].bank || accounts[0].name,
          'Amount': 1000.00,
          'Description': 'Sample payment'
        },
        {
          'Supplier Name': suppliers.length > 1 ? suppliers[1].name : suppliers[0].name,
          'Account Name': accounts.length > 1 ? (accounts[1].account_name || accounts[1].bank || accounts[1].name) : (accounts[0].account_name || accounts[0].bank || accounts[0].name),
          'Amount': 1500.00,
          'Description': 'Another payment'
        }
      ];
    } else {
      // Fallback to generic template if no data exists
      templateData = [
        {
          'Supplier Name': 'ABC Supplier',
          'Account Name': 'Cash Account',
          'Amount': 1000.00,
          'Description': 'Sample payment'
        },
        {
          'Supplier Name': 'XYZ Supplier',
          'Account Name': 'Bank Account',
          'Amount': 1500.00,
          'Description': 'Another payment'
        }
      ];
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      { wch: 25 },  // Supplier Name
      { wch: 25 },  // Account Name
      { wch: 15 },  // Amount
      { wch: 25 }   // Description
    ];
    ws['!cols'] = wscols;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'PaymentsOut');
    
    // Add instructions sheet
    const instructions = [
      ['Instructions for Importing Payments Out'],
      [''],
      ['1. Fill in the required fields: Supplier Name, Account Name, and Amount'],
      ['2. Description is optional'],
      ['3. Make sure all suppliers and accounts exist in the system'],
      ['4. Amount must be a positive number'],
      ['5. Suppliers must have sufficient balance'],
      [''],
      ['Available Suppliers:'],
      ['Supplier Name'],
      ...suppliers.map(supp => [supp.name]),
      [''],
      ['Available Accounts:'],
      ['Account Name'],
      ...accounts.map(acc => [acc.account_name || acc.bank || acc.name])
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
    res.setHeader('Content-Disposition', 'attachment; filename="payment_out_import_template.xlsx"');
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
};
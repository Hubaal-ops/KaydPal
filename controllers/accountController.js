const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('../utils/notificationHelpers');

// Get all accounts (user-specific)
exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get account by ID (user-specific)
exports.getAccountById = async (req, res) => {
  try {
    // Check if the ID is a MongoDB ObjectId or account_id number
    let query;
    const paramId = req.params.id;
    
    // If it looks like a MongoDB ObjectId (24 hex characters), use _id
    if (/^[0-9a-fA-F]{24}$/.test(paramId)) {
      query = { _id: paramId, userId: req.user.id };
    } else {
      // Otherwise, treat it as account_id (numeric)
      const accountIdNum = Number(paramId);
      if (isNaN(accountIdNum)) {
        return res.status(400).json({ error: 'Invalid account ID format' });
      }
      query = { account_id: accountIdNum, userId: req.user.id };
    }
    
    const account = await Account.findOne(query);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new account (user-specific)
exports.createAccount = async (req, res) => {
  try {
    const { name, bank, balance } = req.body;
    
    // Enhanced validation with detailed error messages
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Account name is required and must be a valid string' });
    }
    if (!bank || typeof bank !== 'string' || bank.trim() === '') {
      return res.status(400).json({ error: 'Bank name is required and must be a valid string' });
    }
    
    // Convert and validate balance
    let numericBalance = 0;
    if (balance !== undefined && balance !== null && balance !== '') {
      numericBalance = Number(balance);
      if (isNaN(numericBalance)) {
        return res.status(400).json({ error: 'Balance must be a valid number' });
      }
    }
    
    const account_id = await getNextSequence('account_id');
    if (!account_id) {
      return res.status(500).json({ error: 'Failed to generate account ID' });
    }
    
    const newAccount = new Account({ 
      account_id, 
      name: name.trim(), 
      bank: bank.trim(), 
      balance: numericBalance, 
      userId: req.user.id 
    });
    
    const savedAccount = await newAccount.save();
    
    // Create notification for the user
    try {
      await createNotification(
        req.user.id,
        'New Account Created',
        `A new account "${name}" has been created at ${bank}.`,
        'success',
        'financial'
      );
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the request if notification creation fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: savedAccount
    });
  } catch (err) {
    console.error('Account creation error:', err);
    res.status(400).json({ 
      error: 'Failed to create account: ' + err.message,
      details: err.message 
    });
  }
};

// Update account (user-specific)
exports.updateAccount = async (req, res) => {
  try {
    const { name, bank, balance } = req.body;
    
    // Enhanced validation with detailed error messages
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Account name is required and must be a valid string' });
    }
    if (!bank || typeof bank !== 'string' || bank.trim() === '') {
      return res.status(400).json({ error: 'Bank name is required and must be a valid string' });
    }
    
    // Convert and validate balance
    let numericBalance = 0;
    if (balance !== undefined && balance !== null && balance !== '') {
      numericBalance = Number(balance);
      if (isNaN(numericBalance)) {
        return res.status(400).json({ error: 'Balance must be a valid number' });
      }
    }
    
    // Check if the ID is a MongoDB ObjectId or account_id number
    let query;
    const paramId = req.params.id;
    
    // If it looks like a MongoDB ObjectId (24 hex characters), use _id
    if (/^[0-9a-fA-F]{24}$/.test(paramId)) {
      query = { _id: paramId, userId: req.user.id };
    } else {
      // Otherwise, treat it as account_id (numeric)
      const accountIdNum = Number(paramId);
      if (isNaN(accountIdNum)) {
        return res.status(400).json({ error: 'Invalid account ID format' });
      }
      query = { account_id: accountIdNum, userId: req.user.id };
    }
    
    const updatedAccount = await Account.findOneAndUpdate(
      query,
      { 
        name: name.trim(), 
        bank: bank.trim(), 
        balance: numericBalance 
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Create notification if balance is low
    try {
      if (numericBalance < 100) { // Threshold for low balance
        await createNotification(
          req.user.id,
          'Low Account Balance',
          `Your account "${name}" at ${bank} has a low balance of $${numericBalance.toFixed(2)}.`,
          'warning',
          'financial'
        );
      }
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the request if notification creation fails
    }
    
    res.json({
      success: true,
      message: 'Account updated successfully',
      data: updatedAccount
    });
  } catch (err) {
    console.error('Account update error:', err);
    res.status(400).json({ 
      error: 'Failed to update account: ' + err.message,
      details: err.message 
    });
  }
};

// Delete account (user-specific)
exports.deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export accounts to Excel
exports.exportAccounts = async (req, res) => {
  try {
    console.log('Starting account export process...');
    
    // Get accounts from database
    const accounts = await Account.find({ userId: req.user.id })
      .select('account_id name bank balance createdAt')
      .sort({ name: 1 });
    
    if (!accounts || accounts.length === 0) {
      console.log('No accounts found for user:', req.user.id);
      return res.status(404).json({ 
        error: 'No accounts found to export',
        code: 'NO_ACCOUNTS_FOUND'
      });
    }
    
    console.log(`Found ${accounts.length} accounts to export`);
    
    try {
      // Format data for Excel
      const data = accounts.map((account, index) => ({
        '#': index + 1,
        'Account ID': account.account_id,
        'Name': account.name || '',
        'Bank': account.bank || '',
        'Balance': account.balance || 0,
        'Created At': account.createdAt ? new Date(account.createdAt).toISOString().split('T')[0] : ''
      }));
      
      console.log('Formatted data for Excel:', JSON.stringify(data, null, 2));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 8 },   // #
        { wch: 12 },  // Account ID
        { wch: 30 },  // Name
        { wch: 25 },  // Bank
        { wch: 15 },  // Balance
        { wch: 15 }   // Created At
      ];
      ws['!cols'] = wscols;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Accounts');
      
      console.log('Excel workbook created');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'buffer',
        bookSST: false
      });
      
      console.log('Excel buffer generated, size:', buffer.length, 'bytes');
      
      // Set headers for file download
      const filename = `accounts_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      error: err.message || 'Failed to export accounts',
      code: err.code || 'EXPORT_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return res.status(statusCode).json(errorResponse);
  }
};

// Import accounts from Excel
exports.importAccounts = async (req, res) => {
  try {
    console.log('Starting account import process...');
    
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
        if (!row['Name'] || !row['Bank']) {
          throw new Error('Missing required fields (Name and Bank are required)');
        }
        
        // Check if account with same name already exists for this user
        const existingAccount = await Account.findOne({
          name: row['Name'].toString().trim(),
          userId: req.user.id
        });
        
        if (existingAccount) {
          results.skipped++;
          results.errors.push({
            row: rowNumber,
            message: `Account "${row['Name']}" already exists`,
            code: 'DUPLICATE_ACCOUNT'
          });
          continue;
        }
        
        // Create new account
        const account_id = await getNextSequence('account_id');
        if (!account_id) {
          throw new Error('Failed to generate account ID');
        }
        
        const newAccount = new Account({
          account_id,
          name: row['Name'].toString().trim(),
          bank: row['Bank'] ? row['Bank'].toString().trim() : '',
          balance: row['Balance'] ? parseFloat(row['Balance']) : 0,
          userId: req.user.id
        });
        
        await newAccount.save();
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
      error: 'Failed to import accounts',
      details: err.message,
      code: 'IMPORT_ERROR'
    });
  }
};

// Download account import template
exports.downloadTemplate = async (req, res) => {
  try {
    console.log('Generating account import template...');
    
    // Create sample data for the template
    const templateData = [
      {
        'Name': 'Example Account',
        'Bank': 'Example Bank',
        'Balance': 1000.00
      },
      {
        'Name': 'Another Account',
        'Bank': 'Different Bank',
        'Balance': 5000.00
      }
    ];
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      { wch: 30 },  // Name
      { wch: 25 },  // Bank
      { wch: 15 }   // Balance
    ];
    ws['!cols'] = wscols;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Accounts');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer',
      bookSST: false
    });
    
    console.log('Template generated, size:', buffer.length, 'bytes');
    
    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="account_import_template.xlsx"');
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
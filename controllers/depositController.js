// controllers/depositController.js
const Deposit = require('../models/Deposit');
const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');
const XLSX = require('xlsx');
const path = require('path');

// Get all deposits (user-specific)
exports.getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.user.id }).populate('account', 'name bank');
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get deposit by ID (user-specific)
exports.getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findOne({ _id: req.params.id, userId: req.user.id }).populate('account', 'name bank');
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' });
    res.json(deposit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new deposit (user-specific)
exports.createDeposit = async (req, res) => {
  try {
    const { account, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    const accountDoc = await Account.findById(account);
    if (!accountDoc) return res.status(404).json({ error: 'Account does not exist' });
    const deposit_id = await getNextSequence('deposit_id');
    if (!deposit_id) {
      return res.status(500).json({ error: 'Failed to generate deposit ID' });
    }
    const deposit = new Deposit({ deposit_id, account, amount, userId: req.user.id });
    await deposit.save();
    // Update account balance
    accountDoc.balance += amount;
    await accountDoc.save();
    res.status(201).json(deposit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update deposit (user-specific)
exports.updateDeposit = async (req, res) => {
  try {
    const { account, amount } = req.body;
    const deposit = await Deposit.findOne({ _id: req.params.id, userId: req.user.id });
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' });
    // Adjust account balance if amount or account changes
    if (amount !== undefined && amount !== deposit.amount) {
      const oldAccount = await Account.findById(deposit.account);
      if (oldAccount) {
        oldAccount.balance -= deposit.amount;
        await oldAccount.save();
      }
      const newAccount = await Account.findById(account);
      if (newAccount) {
        newAccount.balance += amount;
        await newAccount.save();
      }
    }
    deposit.account = account;
    deposit.amount = amount;
    await deposit.save();
    res.json(deposit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete deposit (user-specific)
exports.deleteDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' });
    // Adjust account balance
    const account = await Account.findById(deposit.account);
    if (account) {
      account.balance -= deposit.amount;
      await account.save();
    }
    res.json({ message: 'Deposit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Import deposits from Excel/CSV file
exports.importDeposits = async (file, options) => {
  const { userId } = options;
  if (!userId) throw new Error('User authentication required.');
  if (!file || !file.buffer) throw new Error('No file data received.');
  
  try {
    console.log('Starting import for user:', userId);
    console.log('File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Determine file type by extension
    const ext = file.originalname.split('.').pop().toLowerCase();
    let workbook;
    
    try {
      if (ext === 'csv') {
        const data = file.buffer.toString('utf8');
        workbook = XLSX.read(data, { type: 'string', cellDates: true });
      } else {
        workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
      }
    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      throw new Error('Invalid file format. Please upload a valid Excel or CSV file.');
    }
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('No worksheets found in the file.');
    }
    
    console.log('Found sheets:', workbook.SheetNames);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      throw new Error('Could not read the first worksheet in the file.');
    }
    
    // Convert to JSON with raw values to see exactly what's being parsed
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null });
    console.log(`Parsed ${jsonData.length} rows from the file`);
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error('No data rows found in the file.');
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    let errors = [];
    
    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2; // +2 because Excel is 1-based and we have a header row
      
      try {
        // Skip empty rows
        if (!row || Object.keys(row).length === 0) {
          console.log(`Skipping empty row ${rowNumber}`);
          skippedCount++;
          continue;
        }
        
        // Log the raw row data for debugging
        console.log(`Processing row ${rowNumber}:`, JSON.stringify(row, null, 2));
        
        // Normalize keys: lowercase and trim
        const norm = {};
        Object.keys(row).forEach(k => {
          if (k && typeof k === 'string') {
            const cleanKey = k.toString().toLowerCase().trim();
            norm[cleanKey] = row[k];
          }
        });
        
        console.log('Normalized row:', norm);
        
        // Extract fields with flexible column names
        const accountName = norm['account'] || norm['account name'] || norm['account_name'] || '';
        const bankName = norm['bank'] || norm['bank name'] || norm['bank_name'] || '';
        let amount = norm['amount'] || 0;
        
        // Debug: Log extracted values
        console.log('Extracted values:', { accountName, bankName, amount });
        
        // Skip if all fields are empty (might be an empty row)
        if (!accountName && !bankName && !amount) {
          console.log('Skipping empty row');
          continue;
        }
        
        // Validate required fields
        if (!accountName) throw new Error('Account name is required');
        if (!bankName) throw new Error('Bank name is required');
        if (!amount && amount !== 0) throw new Error('Amount is required');
        
        // Convert amount to number
        amount = parseFloat(amount);
        if (isNaN(amount)) throw new Error('Amount must be a number');
        if (amount <= 0) throw new Error('Amount must be greater than zero');
        
        // Find the account
        const account = await Account.findOne({
          name: accountName.trim(),
          bank: bankName.trim(),
          userId
        });
        
        if (!account) {
          throw new Error(`Account '${accountName}' at bank '${bankName}' not found`);
        }
        
        // Generate deposit ID
        const deposit_id = await getNextSequence('deposit_id');
        if (!deposit_id) {
          throw new Error('Failed to generate deposit ID');
        }
        
        // Create deposit
        const deposit = new Deposit({
          deposit_id,
          account: account._id,
          amount,
          deposit_date: new Date(),
          userId
        });
        
        await deposit.save();
        console.log(`Created deposit ${deposit_id} for account ${accountName} (${bankName}): $${amount}`);
        
        // Update account balance
        account.balance += amount;
        await account.save();
        console.log(`Updated account ${accountName} balance to $${account.balance}`);
        
        importedCount++;
      } catch (error) {
        skippedCount++;
        errors.push(`Row ${index + 2}: ${error.message}`);
      }
    }
    
    // Log final import results
    console.log('Import completed:', {
      importedCount,
      skippedCount,
      totalProcessed: importedCount + skippedCount,
      errorCount: errors.length
    });
    
    // Prepare response
    const response = {
      success: true,
      message: importedCount > 0 
        ? `Successfully imported ${importedCount} deposit(s)`
        : 'No new deposits were imported',
      importedCount,
      skippedCount,
      totalCount: importedCount + skippedCount,
      ...(errors.length > 0 && { errors })
    };
    
    console.log('Sending response:', response);
    return response;
  } catch (error) {
    console.error('Import error:', error);
    throw new Error(`Failed to process file: ${error.message}`);
  }
};

// Export deposits to Excel/CSV
exports.exportDeposits = async (userId, format = 'xlsx') => {
  try {
    const deposits = await Deposit.find({ userId })
      .populate('account', 'name bank')
      .sort({ deposit_date: -1 })
      .lean();
    
    if (!deposits || deposits.length === 0) {
      throw new Error('No deposits found to export');
    }
    
    // Prepare data for export
    const exportData = deposits.map(deposit => ({
      'Deposit ID': deposit.deposit_id,
      'Account Name': deposit.account?.name || '',
      'Bank': deposit.account?.bank || '',
      'Amount': deposit.amount,
      'Date': deposit.deposit_date ? new Date(deposit.deposit_date).toISOString().split('T')[0] : '',
      'Created At': new Date(deposit.createdAt).toISOString()
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 10 }, // Deposit ID
      { wch: 25 }, // Account Name
      { wch: 20 }, // Bank
      { wch: 15 }, // Amount
      { wch: 15 }, // Date
      { wch: 25 }  // Created At
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Deposits');
    
    // Generate buffer based on format
    let buffer;
    let mimeType;
    let fileExtension;
    
    if (format === 'csv') {
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else {
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    }
    
    return { buffer, mimeType, fileExtension };
  } catch (error) {
    console.error('Export error:', error);
    throw new Error(`Failed to export deposits: ${error.message}`);
  }
};

// Download deposit import template
exports.downloadDepositTemplate = async (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    
    // Instructions sheet
    const instructions = [
      ['DEPOSIT IMPORT TEMPLATE - INSTRUCTIONS'],
      ['', '', ''],
      ['1. Do not modify the column headers in row 1'],
      ['2. Fill in the data starting from row 2'],
      ['3. Required fields: Account, Bank, and Amount'],
      ['4. Amount must be a positive number'],
      ['5. Account and Bank must match existing records'],
      ['6. Delete the example rows before adding your data'],
      ['', '', ''],
      ['For support, contact your system administrator'],
      ['', '', ''],
    ];
    
    // Data sheet
    const templateData = [
      // Headers
      ['Account', 'Bank', 'Amount'],
      // Example data
      ['Main Account', 'Bank of America', '1000.00'],
      ['Savings', 'Chase', '500.50']
    ];
    
    // Create instructions sheet
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    
    // Create data sheet
    const wsData = XLSX.utils.aoa_to_sheet(templateData);
    
    // Format data sheet
    wsData['!cols'] = [
      { wch: 30 }, // Account
      { wch: 25 }, // Bank
      { wch: 15 }  // Amount
    ];
    
    // Add data validation for amount (must be positive number)
    const amountCol = XLSX.utils.decode_col('C'); // Column C for amount
    wsData['!dataValidations'] = [{
      ref: XLSX.utils.encode_range({
        s: { r: 1, c: amountCol },
        e: { r: 1000, c: amountCol }
      }),
      t: 'custom',
      formulae: ['=C2>0'],
      error: 'Amount must be greater than zero',
      errorStyle: 'warning'
    }];
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions', true);
    XLSX.utils.book_append_sheet(wb, wsData, 'Deposits', false);
    
    // Set the active sheet to the data sheet
    wb.Workbook = wb.Workbook || {};
    wb.Workbook.Views = [{ activeTab: 1 }];
    
    const buffer = XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: true,
      cellDates: true,
      cellStyles: true
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=deposit_import_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Failed to generate template:', error);
    res.status(500).json({ error: 'Failed to generate template: ' + error.message });
  }
};

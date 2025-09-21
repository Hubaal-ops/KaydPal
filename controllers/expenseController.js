const Expense = require('../models/Expense');
const Account = require('../models/Account');
const ExpenseCategory = require('../models/ExpenseCategory');
const getNextSequence = require('../getNextSequence');
const XLSX = require('xlsx');

// Get all expenses (user-specific)
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id })
      .populate('category', 'name')
      .populate('account', 'name bank');
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get expense by ID (user-specific)
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('category', 'name')
      .populate('account', 'name bank');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new expense (user-specific)
exports.createExpense = async (req, res) => {
  try {
    const { category, account, amount, description, expense_date } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    const accountDoc = await Account.findById(account);
    if (!accountDoc) return res.status(404).json({ error: 'Account does not exist' });
    const categoryDoc = await ExpenseCategory.findById(category);
    if (!categoryDoc) return res.status(404).json({ error: 'Category does not exist' });
    if (accountDoc.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
    const expense_id = await getNextSequence('expense_id');
    if (!expense_id) {
      return res.status(500).json({ error: 'Failed to generate expense ID' });
    }
    const expense = new Expense({ expense_id, category, account, amount, description, expense_date, userId: req.user.id });
    await expense.save();
    // Update account balance
    accountDoc.balance -= amount;
    await accountDoc.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update expense (user-specific)
exports.updateExpense = async (req, res) => {
  try {
    const { category, account, amount, description, expense_date } = req.body;
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    // Reverse old expense
    const oldAccount = await Account.findById(expense.account);
    if (oldAccount) {
      oldAccount.balance += expense.amount;
      await oldAccount.save();
    }
    // Apply new expense
    const newAccount = await Account.findById(account);
    if (!newAccount) return res.status(404).json({ error: 'Account does not exist' });
    if (newAccount.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
    newAccount.balance -= amount;
    await newAccount.save();
    expense.category = category;
    expense.account = account;
    expense.amount = amount;
    expense.description = description;
    expense.expense_date = expense_date;
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete expense (user-specific)
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    // Refund account balance
    const account = await Account.findById(expense.account);
    if (account) {
      account.balance += expense.amount;
      await account.save();
    }
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export expenses to Excel
exports.exportExpenses = async (req, res) => {
  try {
    console.log('Starting expense export process...');
    
    // Get expenses from database with populated references
    const expenses = await Expense.find({ userId: req.user.id })
      .populate('category', 'name')
      .populate('account', 'name bank')
      .sort({ expense_date: -1, createdAt: -1 });
    
    if (!expenses || expenses.length === 0) {
      console.log('No expenses found for user:', req.user.id);
      return res.status(404).json({ 
        error: 'No expenses found to export',
        code: 'NO_EXPENSES_FOUND'
      });
    }
    
    console.log(`Found ${expenses.length} expenses to export`);
    
    try {
      // Format data for Excel with more detailed information
      const data = expenses.map((exp, index) => ({
        '#': index + 1,
        'Expense ID': exp.expense_id || '',
        'Category': exp.category?.name || '',
        'Account': exp.account?.name || '',
        'Bank': exp.account?.bank || '',
        'Amount': exp.amount || 0,
        'Description': exp.description || '',
        'Expense Date': exp.expense_date ? new Date(exp.expense_date).toISOString().split('T')[0] : '',
        'Created At': exp.createdAt ? new Date(exp.createdAt).toISOString().split('T')[0] : '',
        'Created Time': exp.createdAt ? new Date(exp.createdAt).toLocaleTimeString() : ''
      }));
      
      console.log('Formatted data for Excel:', JSON.stringify(data[0], null, 2));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 8 },   // #
        { wch: 15 },  // Expense ID
        { wch: 25 },  // Category
        { wch: 25 },  // Account
        { wch: 20 },  // Bank
        { wch: 15 },  // Amount
        { wch: 30 },  // Description
        { wch: 15 },  // Expense Date
        { wch: 15 },  // Created At
        { wch: 15 }   // Created Time
      ];
      ws['!cols'] = wscols;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
      
      // Add summary sheet
      const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const summaryData = [
        ['Expenses Summary'],
        [''],
        ['Total Expenses', expenses.length],
        ['Total Amount', totalAmount],
        ['Average Amount', expenses.length > 0 ? (totalAmount / expenses.length).toFixed(2) : 0],
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
      const filename = `expenses_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      error: err.message || 'Failed to export expenses',
      code: err.code || 'EXPORT_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return res.status(statusCode).json(errorResponse);
  }
};

// Import expenses from Excel
exports.importExpenses = async (req, res) => {
  try {
    console.log('Starting expense import process...');
    
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
    
    // Get all categories and accounts for this user to validate references
    const categories = await ExpenseCategory.find({ userId: req.user.id });
    const accounts = await Account.find({ userId: req.user.id });
    
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat._id;
    });
    
    const accountMap = {};
    accounts.forEach(acc => {
      const key = `${acc.name.toLowerCase()}-${acc.bank.toLowerCase()}`;
      accountMap[key] = acc._id;
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
        if (!row['Category'] || !row['Account'] || !row['Bank'] || !row['Amount']) {
          throw new Error('Missing required fields (Category, Account, Bank, and Amount are required)');
        }
        
        // Validate amount
        const amount = parseFloat(row['Amount']);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        
        // Find category by name
        const categoryName = row['Category'].toString().trim();
        const categoryId = categoryMap[categoryName.toLowerCase()];
        if (!categoryId) {
          throw new Error(`Category "${categoryName}" not found. Please make sure the category exists in the system.`);
        }
        
        // Find account by name and bank
        const accountName = row['Account'].toString().trim();
        const accountBank = row['Bank'].toString().trim();
        const accountKey = `${accountName.toLowerCase()}-${accountBank.toLowerCase()}`;
        const accountId = accountMap[accountKey];
        if (!accountId) {
          // Provide a more helpful error message with available accounts
          const availableAccounts = accounts.map(acc => `${acc.name} (${acc.bank})`).join(', ');
          throw new Error(`Account "${accountName}" with bank "${accountBank}" not found. Available accounts: ${availableAccounts}`);
        }
        
        // Check account balance
        const account = accounts.find(acc => acc._id.toString() === accountId.toString());
        if (account.balance < amount) {
          throw new Error(`Insufficient account balance. Current balance: ${account.balance}`);
        }
        
        // Parse expense date (use current date if not provided or invalid)
        let expenseDate = new Date();
        if (row['Expense Date']) {
          const parsedDate = new Date(row['Expense Date']);
          if (!isNaN(parsedDate.getTime())) {
            expenseDate = parsedDate;
          }
        }
        
        // Create new expense
        const expense_id = await getNextSequence('expense_id');
        if (!expense_id) {
          throw new Error('Failed to generate expense ID');
        }
        
        const expense = new Expense({
          expense_id,
          category: categoryId,
          account: accountId,
          amount: amount,
          description: row['Description'] ? row['Description'].toString().trim() : '',
          expense_date: expenseDate,
          userId: req.user.id
        });
        
        await expense.save();
        
        // Update account balance
        account.balance -= amount;
        await account.save();
        
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
      error: 'Failed to import expenses',
      details: err.message,
      code: 'IMPORT_ERROR'
    });
  }
};

// Download expense import template
exports.downloadTemplate = async (req, res) => {
  try {
    console.log('Generating expense import template...');
    
    // Get actual categories and accounts for this user to include in template
    const categories = await ExpenseCategory.find({ userId: req.user.id }).limit(5);
    const accounts = await Account.find({ userId: req.user.id }).limit(3);
    
    let templateData = [];
    
    // If user has existing data, use it in template
    if (categories.length > 0 && accounts.length > 0) {
      // Create sample data using actual user data
      templateData = [
        {
          'Category': categories[0].name,
          'Account': accounts[0].name,
          'Bank': accounts[0].bank,
          'Amount': 150.00,
          'Description': 'Sample expense description',
          'Expense Date': new Date().toISOString().split('T')[0]
        },
        {
          'Category': categories.length > 1 ? categories[1].name : categories[0].name,
          'Account': accounts.length > 1 ? accounts[1].name : accounts[0].name,
          'Bank': accounts.length > 1 ? accounts[1].bank : accounts[0].bank,
          'Amount': 300.00,
          'Description': 'Another sample expense',
          'Expense Date': new Date().toISOString().split('T')[0]
        }
      ];
    } else {
      // Fallback to generic template if no data exists
      templateData = [
        {
          'Category': 'Office Supplies',
          'Account': 'Business Account',
          'Bank': 'Example Bank',
          'Amount': 150.00,
          'Description': 'Stationery and office supplies',
          'Expense Date': new Date().toISOString().split('T')[0]
        },
        {
          'Category': 'Utilities',
          'Account': 'Business Account',
          'Bank': 'Example Bank',
          'Amount': 300.00,
          'Description': 'Electricity bill',
          'Expense Date': new Date().toISOString().split('T')[0]
        }
      ];
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      { wch: 25 },  // Category
      { wch: 25 },  // Account
      { wch: 20 },  // Bank
      { wch: 15 },  // Amount
      { wch: 30 },  // Description
      { wch: 15 }   // Expense Date
    ];
    ws['!cols'] = wscols;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    
    // Add instructions sheet
    const instructions = [
      ['Instructions for Importing Expenses'],
      [''],
      ['1. Fill in the required fields: Category, Account, Bank, and Amount'],
      ['2. Make sure all categories and accounts exist in the system'],
      ['3. Amount must be a positive number'],
      ['4. Expense Date should be in YYYY-MM-DD format (optional, defaults to today)'],
      ['5. Description is optional'],
      [''],
      ['Available Categories:'],
      ...categories.map(cat => [cat.name]),
      [''],
      ['Available Accounts:'],
      ...accounts.map(acc => [`${acc.name} (${acc.bank})`])
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
    res.setHeader('Content-Disposition', 'attachment; filename="expense_import_template.xlsx"');
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
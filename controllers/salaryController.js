const Salary = require('../models/Salary');
const Account = require('../models/Account');
const Employee = require('../models/Employee');
const getNextSequence = require('../getNextSequence');
const XLSX = require('xlsx');

// Get all salaries
exports.getAllSalaries = async (req, res) => {
  try {
    // Only return salaries created by the current user
    const userId = req.user?._id || req.user?.id;
    const salaries = await Salary.find({ userId })
      .populate('employee', 'name position')
      .populate('account', 'name bank');
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get salary by ID
exports.getSalaryById = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate('employee', 'name position')
      .populate('account', 'name bank');
    if (!salary) return res.status(404).json({ error: 'Salary not found' });
    res.json(salary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new salary
exports.createSalary = async (req, res) => {
  try {
    const { employee, account, amount, pay_date, description } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    const accountDoc = await Account.findById(account);
    if (!accountDoc) return res.status(404).json({ error: 'Account does not exist' });
    const employeeDoc = await Employee.findById(employee);
    if (!employeeDoc) return res.status(404).json({ error: 'Employee does not exist' });
    if (accountDoc.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
    const salary_id = await getNextSequence('salary_id');
    if (!salary_id) {
      return res.status(500).json({ error: 'Failed to generate salary ID' });
    }
    // Attach userId to salary
    const userId = req.user?._id || req.user?.id;
    const salary = new Salary({ salary_id, employee, account, amount, pay_date, description, userId });
    await salary.save();
    // Update account balance
    accountDoc.balance -= amount;
    await accountDoc.save();
    res.status(201).json(salary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update salary
exports.updateSalary = async (req, res) => {
  try {
    const { employee, account, amount, pay_date, description } = req.body;
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ error: 'Salary not found' });
    // Reverse old salary
    const oldAccount = await Account.findById(salary.account);
    if (oldAccount) {
      oldAccount.balance += salary.amount;
      await oldAccount.save();
    }
    // Apply new salary
    const newAccount = await Account.findById(account);
    if (!newAccount) return res.status(404).json({ error: 'Account does not exist' });
    if (newAccount.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
    newAccount.balance -= amount;
    await newAccount.save();
    salary.employee = employee;
    salary.account = account;
    salary.amount = amount;
    salary.pay_date = pay_date;
    salary.description = description;
    await salary.save();
    res.json(salary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete salary
exports.deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) return res.status(404).json({ error: 'Salary not found' });
    // Refund account balance
    const account = await Account.findById(salary.account);
    if (account) {
      account.balance += salary.amount;
      await account.save();
    }
    res.json({ message: 'Salary deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export salaries to Excel
exports.exportSalaries = async (req, res) => {
  try {
    console.log('Starting salary export process...');
    
    // Only return salaries created by the current user
    const userId = req.user?._id || req.user?.id;
    const salaries = await Salary.find({ userId })
      .populate('employee', 'name position')
      .populate('account', 'name bank')
      .sort({ pay_date: -1, createdAt: -1 });
    
    if (!salaries || salaries.length === 0) {
      console.log('No salaries found for user:', userId);
      return res.status(404).json({ 
        error: 'No salaries found to export',
        code: 'NO_SALARIES_FOUND'
      });
    }
    
    console.log(`Found ${salaries.length} salaries to export`);
    
    try {
      // Format data for Excel with more detailed information
      const data = salaries.map((sal, index) => ({
        '#': index + 1,
        'Salary ID': sal.salary_id || '',
        'Employee': sal.employee?.name || '',
        'Position': sal.employee?.position || '',
        'Account': sal.account?.name || '',
        'Bank': sal.account?.bank || '',
        'Amount': sal.amount || 0,
        'Pay Date': sal.pay_date ? new Date(sal.pay_date).toISOString().split('T')[0] : '',
        'Description': sal.description || '',
        'Created At': sal.createdAt ? new Date(sal.createdAt).toISOString().split('T')[0] : '',
        'Created Time': sal.createdAt ? new Date(sal.createdAt).toLocaleTimeString() : ''
      }));
      
      console.log('Formatted data for Excel:', JSON.stringify(data[0], null, 2));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 8 },   // #
        { wch: 15 },  // Salary ID
        { wch: 25 },  // Employee
        { wch: 20 },  // Position
        { wch: 25 },  // Account
        { wch: 20 },  // Bank
        { wch: 15 },  // Amount
        { wch: 15 },  // Pay Date
        { wch: 30 },  // Description
        { wch: 15 },  // Created At
        { wch: 15 }   // Created Time
      ];
      ws['!cols'] = wscols;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Salaries');
      
      // Add summary sheet
      const totalAmount = salaries.reduce((sum, sal) => sum + (sal.amount || 0), 0);
      const summaryData = [
        ['Salaries Summary'],
        [''],
        ['Total Salaries', salaries.length],
        ['Total Amount', totalAmount],
        ['Average Amount', salaries.length > 0 ? (totalAmount / salaries.length).toFixed(2) : 0],
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
      const filename = `salaries_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      error: err.message || 'Failed to export salaries',
      code: err.code || 'EXPORT_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return res.status(statusCode).json(errorResponse);
  }
};

// Import salaries from Excel
exports.importSalaries = async (req, res) => {
  try {
    console.log('Starting salary import process...');
    
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
    
    // Get all employees and accounts for this user to validate references
    const userId = req.user?._id || req.user?.id;
    const employees = await Employee.find({ userId });
    const accounts = await Account.find({ userId });
    
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.name.toLowerCase()] = emp._id;
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
        if (!row['Employee'] || !row['Account'] || !row['Bank'] || !row['Amount'] || !row['Pay Date']) {
          throw new Error('Missing required fields (Employee, Account, Bank, Amount, and Pay Date are required)');
        }
        
        // Validate amount
        const amount = parseFloat(row['Amount']);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        
        // Find employee by name
        const employeeName = row['Employee'].toString().trim();
        const employeeId = employeeMap[employeeName.toLowerCase()];
        if (!employeeId) {
          throw new Error(`Employee "${employeeName}" not found. Please make sure the employee exists in the system.`);
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
        
        // Validate date
        const payDate = new Date(row['Pay Date']);
        if (isNaN(payDate.getTime())) {
          throw new Error('Invalid date format for Pay Date. Please use YYYY-MM-DD format.');
        }
        
        // Create new salary
        const salary_id = await getNextSequence('salary_id');
        if (!salary_id) {
          throw new Error('Failed to generate salary ID');
        }
        
        const salary = new Salary({
          salary_id,
          employee: employeeId,
          account: accountId,
          amount: amount,
          pay_date: payDate,
          description: row['Description'] ? row['Description'].toString().trim() : '',
          userId: userId
        });
        
        await salary.save();
        
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
      error: 'Failed to import salaries',
      details: err.message,
      code: 'IMPORT_ERROR'
    });
  }
};

// Download salary import template
exports.downloadTemplate = async (req, res) => {
  try {
    console.log('Generating salary import template...');
    
    // Get actual employees and accounts for this user to include in template
    const userId = req.user?._id || req.user?.id;
    const employees = await Employee.find({ userId }).limit(5);
    const accounts = await Account.find({ userId }).limit(3);
    
    let templateData = [];
    
    // If user has existing data, use it in template
    if (employees.length > 0 && accounts.length > 0) {
      // Create sample data using actual user data
      templateData = [
        {
          'Employee': employees[0].name,
          'Account': accounts[0].name,
          'Bank': accounts[0].bank,
          'Amount': 2500.00,
          'Pay Date': new Date().toISOString().split('T')[0],
          'Description': 'Monthly salary payment'
        },
        {
          'Employee': employees.length > 1 ? employees[1].name : employees[0].name,
          'Account': accounts.length > 1 ? accounts[1].name : accounts[0].name,
          'Bank': accounts.length > 1 ? accounts[1].bank : accounts[0].bank,
          'Amount': 3000.00,
          'Pay Date': new Date().toISOString().split('T')[0],
          'Description': 'Monthly salary payment'
        }
      ];
    } else {
      // Fallback to generic template if no data exists
      templateData = [
        {
          'Employee': 'John Doe',
          'Account': 'Business Account',
          'Bank': 'Example Bank',
          'Amount': 2500.00,
          'Pay Date': new Date().toISOString().split('T')[0],
          'Description': 'Monthly salary payment'
        },
        {
          'Employee': 'Jane Smith',
          'Account': 'Business Account',
          'Bank': 'Example Bank',
          'Amount': 3000.00,
          'Pay Date': new Date().toISOString().split('T')[0],
          'Description': 'Monthly salary payment'
        }
      ];
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      { wch: 25 },  // Employee
      { wch: 25 },  // Account
      { wch: 20 },  // Bank
      { wch: 15 },  // Amount
      { wch: 15 },  // Pay Date
      { wch: 30 }   // Description
    ];
    ws['!cols'] = wscols;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Salaries');
    
    // Add instructions sheet
    const instructions = [
      ['Instructions for Importing Salaries'],
      [''],
      ['1. Fill in the required fields: Employee, Account, Bank, Amount, and Pay Date'],
      ['2. Make sure all employees and accounts exist in the system'],
      ['3. Amount must be a positive number'],
      ['4. Pay Date should be in YYYY-MM-DD format'],
      ['5. Description is optional'],
      [''],
      ['Available Employees:'],
      ...employees.map(emp => [emp.name]),
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
    res.setHeader('Content-Disposition', 'attachment; filename="salary_import_template.xlsx"');
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

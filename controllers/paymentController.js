const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Account = require('../models/Account');
const Business = require('../models/Business');
const getNextSequence = require('../getNextSequence');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

// Generate receipt number
const generateReceiptNumber = (paymentId) => {
  return `RCP-${String(paymentId).padStart(6, '0')}`;
};

// Get business information for receipts
const getBusinessInfo = async (userId) => {
  try {
    const business = await Business.findOne({ userId });
    
    if (!business) {
      // Return default business info if none found
      return {
        name: 'KaydPal Business Management',
        address: '123 Business Street',
        city: 'City, State 12345',
        phone: '(555) 123-4567',
        email: 'info@kaydpal.com'
      };
    }
    
    // Return business info with proper formatting
    return {
      name: business.name || 'KaydPal Business Management',
      logo: business.logo || '',
      address: business.address || '',
      city: business.city || '',
      state: business.state || '',
      zipCode: business.zipCode || '',
      country: business.country || '',
      phone: business.phone || '',
      email: business.email || '',
      website: business.website || '',
      taxId: business.taxId || '',
      registrationNumber: business.registrationNumber || ''
    };
  } catch (err) {
    // Return default business info if error occurs
    return {
      name: 'KaydPal Business Management',
      address: '123 Business Street',
      city: 'City, State 12345',
      phone: '(555) 123-4567',
      email: 'info@kaydpal.com'
    };
  }
};

/*
 * Receipt API Endpoints:
 * GET /api/payments/:id/receipt - Generate complete receipt with business info
 * GET /api/payments/:id/receipt-data - Get receipt data for frontend rendering
 * 
 * Both endpoints return:
 * - payment: Payment details
 * - customer: Customer information with current balance
 * - account: Account/payment method details
 * - receiptNumber: Formatted receipt number (RCP-000001)
 * - businessInfo: Company details (only in /receipt endpoint)
 */

// Get all payments in
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).sort({ created_at: -1 });
    res.json({ data: payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get payment in by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({ id: req.params.id, userId: req.user.id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new payment in
exports.createPayment = async (req, res) => {
  // Use manual rollback for standalone MongoDB (local development)
  let customer = null;
  let account = null;
  let originalCustomerBalance = 0;
  let originalAccountBalance = 0;
  
  try {
    const { customer_id, account_id, amount } = req.body;
    
    // Enhanced validation with detailed error messages
    if (!customer_id) {
      return res.status(400).json({ error: 'Customer ID is required' });
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
    
    // Get next payment id
    const id = await getNextSequence('payment_in');
    if (!id) {
      return res.status(500).json({ error: 'Failed to generate payment ID' });
    }

    // Find and validate customer
    customer = await Customer.findOne({ customer_no: Number(customer_id), userId: req.user.id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Find and validate account
    account = await Account.findOne({ account_id: Number(account_id), userId: req.user.id });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Store original balances for potential rollback
    originalCustomerBalance = customer.bal || 0;
    originalAccountBalance = account.balance || 0;
    
    // Update customer balance
    customer.bal = (customer.bal || 0) - Number(amount);
    await customer.save();

    // Update account balance
    account.balance = (account.balance || 0) + Number(amount);
    await account.save();

    // Create payment data
    const paymentData = {
      id, 
      customer_id: Number(customer_id), 
      account_id: Number(account_id), 
      amount: Number(amount),
      userId: req.user.id
    };
    
    // Save payment
    const payment = new Payment(paymentData);
    await payment.save();

    // Generate receipt data
    const receiptData = {
      payment: payment.toObject(),
      customer: {
        customer_no: customer.customer_no,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        balance: customer.bal
      },
      account: {
        account_id: account.account_id,
        account_name: account.account_name,
        bank: account.bank,
        name: account.name
      },
      receiptNumber: generateReceiptNumber(id),
      businessInfo: await getBusinessInfo(req.user.id),
      previousBalance: originalCustomerBalance,
      paymentApplied: Number(amount),
      remainingBalance: customer.bal || 0
    };

    res.status(201).json({ 
      success: true,
      message: 'Payment created successfully',
      data: payment,
      receipt: receiptData
    });
  } catch (err) {
    // Manual rollback if payment creation failed after balance updates
    console.error('Payment creation error, attempting manual rollback:', err);
    
    try {
      if (customer && originalCustomerBalance !== undefined) {
        customer.bal = originalCustomerBalance;
        await customer.save();
        console.log('Customer balance rolled back');
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
      error: 'Failed to create payment: ' + err.message,
      details: 'Changes have been rolled back manually' 
    });
  }
};

// Update payment in
exports.updatePayment = async (req, res) => {
  try {
    const { customer_id, account_id, amount } = req.body;
    const payment = await Payment.findOneAndUpdate(
      { id: req.params.id, userId: req.user.id },
      { customer_id, account_id, amount, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete payment in
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({ id: req.params.id, userId: req.user.id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate receipt for a payment
exports.generateReceipt = async (req, res) => {
  try {
    const paymentId = req.params.id;
    
    // Find the payment
    const payment = await Payment.findOne({ id: paymentId, userId: req.user.id });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Find customer and account information
    const customer = await Customer.findOne({ customer_no: payment.customer_id, userId: req.user.id });
    const account = await Account.findOne({ account_id: payment.account_id, userId: req.user.id });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Generate receipt data
    const receiptData = {
      payment: payment.toObject(),
      customer: {
        customer_no: customer.customer_no,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        balance: customer.bal
      },
      account: {
        account_id: account.account_id,
        account_name: account.account_name,
        bank: account.bank,
        name: account.name
      },
      receiptNumber: generateReceiptNumber(paymentId),
      businessInfo: await getBusinessInfo(req.user.id),
      generatedAt: new Date().toISOString(),
      // Calculate previous balance (current + payment amount)
      previousBalance: (customer.bal || 0) + Number(payment.amount),
      paymentApplied: Number(payment.amount),
      remainingBalance: customer.bal || 0
    };

    res.json({
      success: true,
      message: 'Receipt generated successfully',
      receipt: receiptData
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to generate receipt',
      details: err.message 
    });
  }
};

// Get receipt data with customer and account details for frontend
exports.getReceiptData = async (req, res) => {
  try {
    const paymentId = req.params.id;
    
    const payment = await Payment.findOne({ id: paymentId, userId: req.user.id });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const customer = await Customer.findOne({ customer_no: payment.customer_id, userId: req.user.id });
    const account = await Account.findOne({ account_id: payment.account_id, userId: req.user.id });

    if (!customer || !account) {
      return res.status(404).json({ error: 'Customer or account information not found' });
    }

    res.json({
      success: true,
      data: {
        payment: payment.toObject(),
        customer: {
          customer_no: customer.customer_no,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          balance: customer.bal
        },
        account: {
          account_id: account.account_id,
          account_name: account.account_name,
          bank: account.bank,
          name: account.name
        },
        receiptNumber: generateReceiptNumber(paymentId),
        businessInfo: await getBusinessInfo(req.user.id)
      }
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch receipt data',
      details: err.message 
    });
  }
};

// Export payments to Excel
exports.exportPayments = async (req, res) => {
  try {
    console.log('Starting payment export process...');
    
    // Get payments from database
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ created_at: -1 });
    
    if (!payments || payments.length === 0) {
      console.log('No payments found for user:', req.user.id);
      return res.status(404).json({ 
        error: 'No payments found to export',
        code: 'NO_PAYMENTS_FOUND'
      });
    }
    
    console.log(`Found ${payments.length} payments to export`);
    
    try {
      // Format data for Excel with more detailed information
      const data = payments.map((pay, index) => ({
        '#': index + 1,
        'Payment ID': pay.id || '',
        'Customer ID': pay.customer_id || '',
        'Account ID': pay.account_id || '',
        'Amount': pay.amount || 0,
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
        { wch: 15 },  // Customer ID
        { wch: 15 },  // Account ID
        { wch: 15 },  // Amount
        { wch: 15 },  // Created At
        { wch: 15 }   // Created Time
      ];
      ws['!cols'] = wscols;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Payments');
      
      // Add summary sheet
      const totalAmount = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
      const summaryData = [
        ['Payments Summary'],
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
      const filename = `payments_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      error: err.message || 'Failed to export payments',
      code: err.code || 'EXPORT_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return res.status(statusCode).json(errorResponse);
  }
};

// Import payments from Excel
exports.importPayments = async (req, res) => {
  try {
    console.log('Starting payment import process...');
    
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
    
    // Get all customers and accounts for this user to validate references
    const userId = req.user.id;
    const customers = await Customer.find({ userId });
    const accounts = await Account.find({ userId });
    
    // Create maps for name to ID lookup
    const customerNameMap = {};
    const accountNameMap = {};
    
    customers.forEach(cust => {
      customerNameMap[cust.name.toLowerCase()] = cust.customer_no;
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
        if (!row['Customer Name'] || !row['Account Name'] || !row['Amount']) {
          throw new Error('Missing required fields (Customer Name, Account Name, and Amount are required)');
        }
        
        // Validate amount
        const amount = parseFloat(row['Amount']);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        
        // Find customer by name
        const customerName = row['Customer Name'].toString().trim();
        const customerId = customerNameMap[customerName.toLowerCase()];
        if (!customerId) {
          throw new Error(`Customer with name "${customerName}" not found. Please make sure the customer exists in the system.`);
        }
        
        // Find account by name
        const accountName = row['Account Name'].toString().trim();
        const accountId = accountNameMap[accountName.toLowerCase()];
        if (!accountId) {
          throw new Error(`Account with name "${accountName}" not found. Please make sure the account exists in the system.`);
        }
        
        // Create new payment
        const id = await getNextSequence('payment_in');
        if (!id) {
          throw new Error('Failed to generate payment ID');
        }
        
        // Find customer and account documents
        const customer = await Customer.findOne({ customer_no: customerId, userId });
        const account = await Account.findOne({ account_id: accountId, userId });
        
        // Update customer balance
        customer.bal = (customer.bal || 0) - amount;
        await customer.save();

        // Update account balance
        account.balance = (account.balance || 0) + amount;
        await account.save();

        const payment = new Payment({
          id,
          customer_id: customerId,
          account_id: accountId,
          amount: amount,
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
      error: 'Failed to import payments',
      details: err.message,
      code: 'IMPORT_ERROR'
    });
  }
};

// Download payment import template
exports.downloadTemplate = async (req, res) => {
  try {
    console.log('Generating payment import template...');
    
    // Get actual customers and accounts for this user to include in template
    const userId = req.user.id;
    const customers = await Customer.find({ userId }).limit(5);
    const accounts = await Account.find({ userId }).limit(3);
    
    let templateData = [];
    
    // If user has existing data, use it in template
    if (customers.length > 0 && accounts.length > 0) {
      // Create sample data using actual user data
      templateData = [
        {
          'Customer Name': customers[0].name,
          'Account Name': accounts[0].account_name || accounts[0].bank || accounts[0].name,
          'Amount': 1000.00
        },
        {
          'Customer Name': customers.length > 1 ? customers[1].name : customers[0].name,
          'Account Name': accounts.length > 1 ? (accounts[1].account_name || accounts[1].bank || accounts[1].name) : (accounts[0].account_name || accounts[0].bank || accounts[0].name),
          'Amount': 1500.00
        }
      ];
    } else {
      // Fallback to generic template if no data exists
      templateData = [
        {
          'Customer Name': 'John Doe',
          'Account Name': 'Cash Account',
          'Amount': 1000.00
        },
        {
          'Customer Name': 'Jane Smith',
          'Account Name': 'Bank Account',
          'Amount': 1500.00
        }
      ];
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      { wch: 25 },  // Customer Name
      { wch: 25 },  // Account Name
      { wch: 15 }   // Amount
    ];
    ws['!cols'] = wscols;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    
    // Add instructions sheet
    const instructions = [
      ['Instructions for Importing Payments'],
      [''],
      ['1. Fill in the required fields: Customer Name, Account Name, and Amount'],
      ['2. Make sure all customers and accounts exist in the system'],
      ['3. Amount must be a positive number'],
      [''],
      ['Available Customers:'],
      ['Customer Name'],
      ...customers.map(cust => [cust.name]),
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
    res.setHeader('Content-Disposition', 'attachment; filename="payment_import_template.xlsx"');
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

const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Account = require('../models/Account');
const Business = require('../models/Business');
const getNextSequence = require('../getNextSequence');
const mongoose = require('mongoose');

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
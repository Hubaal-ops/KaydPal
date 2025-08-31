const PaymentOut = require('../models/PaymentOut');
const Supplier = require('../models/Supplier');
const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');
const mongoose = require('mongoose');

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
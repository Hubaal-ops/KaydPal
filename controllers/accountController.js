const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');

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
    
    const deletedAccount = await Account.findOneAndDelete(query);
    if (!deletedAccount) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
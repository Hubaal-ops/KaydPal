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
    const account = await Account.findOne({ account_id: Number(req.params.id), userId: req.user.id });
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
    const account_id = await getNextSequence('account_id');
    if (!account_id) {
      return res.status(500).json({ error: 'Failed to generate account ID' });
    }
    const newAccount = new Account({ account_id, name, bank, balance, userId: req.user.id });
    const savedAccount = await newAccount.save();
    res.status(201).json(savedAccount);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update account (user-specific)
exports.updateAccount = async (req, res) => {
  try {
    const { name, bank, balance } = req.body;
    const updatedAccount = await Account.findOneAndUpdate(
      { account_id: Number(req.params.id), userId: req.user.id },
      { name, bank, balance },
      { new: true, runValidators: true }
    );
    if (!updatedAccount) return res.status(404).json({ error: 'Account not found' });
    res.json(updatedAccount);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete account (user-specific)
exports.deleteAccount = async (req, res) => {
  try {
    const deletedAccount = await Account.findOneAndDelete({ account_id: Number(req.params.id), userId: req.user.id });
    if (!deletedAccount) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
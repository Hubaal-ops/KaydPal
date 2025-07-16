const Account = require('../models/Account');

// Get all accounts
exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get account by ID
exports.getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new account
exports.createAccount = async (req, res) => {
  try {
    const { name, bank, balance } = req.body;
    const newAccount = new Account({ name, bank, balance });
    const savedAccount = await newAccount.save();
    res.status(201).json(savedAccount);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update account
exports.updateAccount = async (req, res) => {
  try {
    const { name, bank, balance } = req.body;
    const updatedAccount = await Account.findByIdAndUpdate(
      req.params.id,
      { name, bank, balance },
      { new: true, runValidators: true }
    );
    if (!updatedAccount) return res.status(404).json({ error: 'Account not found' });
    res.json(updatedAccount);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const deletedAccount = await Account.findByIdAndDelete(req.params.id);
    if (!deletedAccount) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
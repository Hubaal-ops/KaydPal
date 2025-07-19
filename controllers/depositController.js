// controllers/depositController.js
const Deposit = require('../models/Deposit');
const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');

// Get all deposits
exports.getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find().populate('account', 'name bank');
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get deposit by ID
exports.getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id).populate('account', 'name bank');
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' });
    res.json(deposit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new deposit
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
    const deposit = new Deposit({ deposit_id, account, amount });
    await deposit.save();
    // Update account balance
    accountDoc.balance += amount;
    await accountDoc.save();
    res.status(201).json(deposit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update deposit
exports.updateDeposit = async (req, res) => {
  try {
    const { account, amount } = req.body;
    const deposit = await Deposit.findById(req.params.id);
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

// Delete deposit
exports.deleteDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findByIdAndDelete(req.params.id);
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

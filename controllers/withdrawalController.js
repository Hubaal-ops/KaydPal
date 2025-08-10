const Withdrawal = require('../models/Withdrawal');
const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');

// Get all withdrawals
exports.getAllWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawals = await Withdrawal.find({ userId }).populate('account', 'name bank');
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get withdrawal by ID
exports.getWithdrawalById = async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawal = await Withdrawal.findOne({ _id: req.params.id, userId }).populate('account', 'name bank');
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new withdrawal
exports.createWithdrawal = async (req, res) => {
  try {
    const { account, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    const accountDoc = await Account.findById(account);
    if (!accountDoc) return res.status(404).json({ error: 'Account does not exist' });
    if (accountDoc.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
    const withdrawal_id = await getNextSequence('withdrawal_id');
    if (!withdrawal_id) {
      return res.status(500).json({ error: 'Failed to generate withdrawal ID' });
    }
  const withdrawal = new Withdrawal({ withdrawal_id, account, amount, userId: req.user.id });
    await withdrawal.save();
    // Update account balance
    accountDoc.balance -= amount;
    await accountDoc.save();
    res.status(201).json(withdrawal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update withdrawal
exports.updateWithdrawal = async (req, res) => {
  try {
    const { account, amount } = req.body;
  const withdrawal = await Withdrawal.findOne({ _id: req.params.id, userId: req.user.id });
  if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    // Adjust account balances if amount or account changes
    if (amount !== undefined && (amount !== withdrawal.amount || account !== String(withdrawal.account))) {
      // Refund old account
      const oldAccount = await Account.findById(withdrawal.account);
      if (oldAccount) {
        oldAccount.balance += withdrawal.amount;
        await oldAccount.save();
      }
      // Deduct from new account
      const newAccount = await Account.findById(account);
      if (!newAccount) return res.status(404).json({ error: 'New account does not exist' });
      if (newAccount.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
      newAccount.balance -= amount;
      await newAccount.save();
    }
    withdrawal.account = account;
    withdrawal.amount = amount;
    await withdrawal.save();
    res.json(withdrawal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete withdrawal
exports.deleteWithdrawal = async (req, res) => {
  try {
  const withdrawal = await Withdrawal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    // Refund account balance
    const account = await Account.findById(withdrawal.account);
    if (account) {
      account.balance += withdrawal.amount;
      await account.save();
    }
    res.json({ message: 'Withdrawal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
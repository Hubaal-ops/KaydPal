const Transfer = require('../models/Transfer');
const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');

// Get all transfers
exports.getAllTransfers = async (req, res) => {
  try {
    const userId = req.user.id;
    const transfers = await Transfer.find({ userId })
      .populate('from_account', 'name bank')
      .populate('to_account', 'name bank');
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get transfer by ID
exports.getTransferById = async (req, res) => {
  try {
    const userId = req.user.id;
    const transfer = await Transfer.findOne({ _id: req.params.id, userId })
      .populate('from_account', 'name bank')
      .populate('to_account', 'name bank');
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    res.json(transfer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new transfer
exports.createTransfer = async (req, res) => {
  try {
    const { from_account, to_account, amount, description } = req.body;
    if (from_account === to_account) return res.status(400).json({ error: 'Cannot transfer to the same account' });
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    const fromAcc = await Account.findById(from_account);
    const toAcc = await Account.findById(to_account);
    if (!fromAcc || !toAcc) return res.status(404).json({ error: 'One or both accounts do not exist' });
    if (fromAcc.balance < amount) return res.status(400).json({ error: 'Insufficient balance in source account' });
    const transfer_id = await getNextSequence('transfer_id');
    if (!transfer_id) {
      return res.status(500).json({ error: 'Failed to generate transfer ID' });
    }
  const transfer = new Transfer({ transfer_id, from_account, to_account, amount, description, userId: req.user.id });
    await transfer.save();
    // Update balances
    fromAcc.balance -= amount;
    toAcc.balance += amount;
    await fromAcc.save();
    await toAcc.save();
    res.status(201).json(transfer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update transfer
exports.updateTransfer = async (req, res) => {
  try {
    const { from_account, to_account, amount, description } = req.body;
  const transfer = await Transfer.findOne({ _id: req.params.id, userId: req.user.id });
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    // Reverse old transfer
    const oldFrom = await Account.findById(transfer.from_account);
    const oldTo = await Account.findById(transfer.to_account);
    if (oldFrom && oldTo) {
      oldFrom.balance += transfer.amount;
      oldTo.balance -= transfer.amount;
      await oldFrom.save();
      await oldTo.save();
    }
    // Apply new transfer
    if (from_account === to_account) return res.status(400).json({ error: 'Cannot transfer to the same account' });
    const newFrom = await Account.findById(from_account);
    const newTo = await Account.findById(to_account);
    if (!newFrom || !newTo) return res.status(404).json({ error: 'One or both accounts do not exist' });
    if (newFrom.balance < amount) return res.status(400).json({ error: 'Insufficient balance in source account' });
    newFrom.balance -= amount;
    newTo.balance += amount;
    await newFrom.save();
    await newTo.save();
    transfer.from_account = from_account;
    transfer.to_account = to_account;
    transfer.amount = amount;
    transfer.description = description;
    await transfer.save();
    res.json(transfer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete transfer
exports.deleteTransfer = async (req, res) => {
  try {
  const transfer = await Transfer.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    // Reverse transfer
    const fromAcc = await Account.findById(transfer.from_account);
    const toAcc = await Account.findById(transfer.to_account);
    if (fromAcc && toAcc) {
      fromAcc.balance += transfer.amount;
      toAcc.balance -= transfer.amount;
      await fromAcc.save();
      await toAcc.save();
    }
    res.json({ message: 'Transfer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

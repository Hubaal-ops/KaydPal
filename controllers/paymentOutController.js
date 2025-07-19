const PaymentOut = require('../models/PaymentOut');
const Supplier = require('../models/Supplier');
const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');

// Get all payment outs
exports.getAllPaymentsOut = async (req, res) => {
  try {
    const payments = await PaymentOut.find().sort({ created_at: -1 });
    res.json({ data: payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get payment out by ID
exports.getPaymentOutById = async (req, res) => {
  try {
    const payment = await PaymentOut.findOne({ id: req.params.id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new payment out
exports.createPaymentOut = async (req, res) => {
  try {
    const { supplier_no, account_id, amount, description } = req.body;
    if (!supplier_no || !account_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'All fields required and amount > 0' });
    }
    // Get next payment out id
    const id = await getNextSequence('payment_out');
    if (!id) {
      return res.status(500).json({ error: 'Failed to generate payment out ID' });
    }

    // Update supplier balance
    const supplier = await Supplier.findOne({ supplier_no: Number(supplier_no) });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    if (supplier.balance < amount) return res.status(400).json({ error: 'Supplier does not have enough balance' });
    supplier.balance = (supplier.balance || 0) - Number(amount);
    await supplier.save();

    // Update account balance
    const account = await Account.findOne({ account_id: Number(account_id) });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    account.balance = (account.balance || 0) - Number(amount);
    await account.save();

    // Save payment out
    const payment = new PaymentOut({ id, supplier_no: Number(supplier_no), account_id: Number(account_id), amount: Number(amount), description });
    await payment.save();

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update payment out
exports.updatePaymentOut = async (req, res) => {
  try {
    const { supplier_no, account_id, amount, description } = req.body;
    const payment = await PaymentOut.findOneAndUpdate(
      { id: req.params.id },
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
    const payment = await PaymentOut.findOneAndDelete({ id: req.params.id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
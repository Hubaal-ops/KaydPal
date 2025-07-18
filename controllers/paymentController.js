const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');

// Get all payments in
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ created_at: -1 });
    res.json({ data: payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get payment in by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({ id: req.params.id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new payment in
exports.createPayment = async (req, res) => {
  try {
    const { customer_id, account_id, amount } = req.body;
    if (!customer_id || !account_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'All fields required and amount > 0' });
    }
    // Get next payment id
    const id = await getNextSequence('payment_in');
    if (!id) {
      return res.status(500).json({ error: 'Failed to generate payment ID' });
    }

    // Update customer balance
    const customer = await Customer.findOne({ customer_no: Number(customer_id) });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    customer.bal = (customer.bal || 0) - Number(amount);
    await customer.save();

    // Update account balance
    const account = await Account.findOne({ account_id: Number(account_id) });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    account.balance = (account.balance || 0) + Number(amount);
    await account.save();

    // Save payment
    const payment = new Payment({ id, customer_id: Number(customer_id), account_id: Number(account_id), amount: Number(amount) });
    await payment.save();

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update payment in
exports.updatePayment = async (req, res) => {
  try {
    const { customer_id, account_id, amount } = req.body;
    const payment = await Payment.findOneAndUpdate(
      { id: req.params.id },
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
    const payment = await Payment.findOneAndDelete({ id: req.params.id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
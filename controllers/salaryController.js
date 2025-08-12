const Salary = require('../models/Salary');
const Account = require('../models/Account');
const Employee = require('../models/Employee');
const getNextSequence = require('../getNextSequence');

// Get all salaries
exports.getAllSalaries = async (req, res) => {
  try {
    // Only return salaries created by the current user
    const userId = req.user?._id || req.user?.id;
    const salaries = await Salary.find({ userId })
      .populate('employee', 'name position')
      .populate('account', 'name bank');
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get salary by ID
exports.getSalaryById = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate('employee', 'name position')
      .populate('account', 'name bank');
    if (!salary) return res.status(404).json({ error: 'Salary not found' });
    res.json(salary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new salary
exports.createSalary = async (req, res) => {
  try {
    const { employee, account, amount, pay_date, description } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    const accountDoc = await Account.findById(account);
    if (!accountDoc) return res.status(404).json({ error: 'Account does not exist' });
    const employeeDoc = await Employee.findById(employee);
    if (!employeeDoc) return res.status(404).json({ error: 'Employee does not exist' });
    if (accountDoc.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
    const salary_id = await getNextSequence('salary_id');
    if (!salary_id) {
      return res.status(500).json({ error: 'Failed to generate salary ID' });
    }
    // Attach userId to salary
    const userId = req.user?._id || req.user?.id;
    const salary = new Salary({ salary_id, employee, account, amount, pay_date, description, userId });
    await salary.save();
    // Update account balance
    accountDoc.balance -= amount;
    await accountDoc.save();
    res.status(201).json(salary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update salary
exports.updateSalary = async (req, res) => {
  try {
    const { employee, account, amount, pay_date, description } = req.body;
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ error: 'Salary not found' });
    // Reverse old salary
    const oldAccount = await Account.findById(salary.account);
    if (oldAccount) {
      oldAccount.balance += salary.amount;
      await oldAccount.save();
    }
    // Apply new salary
    const newAccount = await Account.findById(account);
    if (!newAccount) return res.status(404).json({ error: 'Account does not exist' });
    if (newAccount.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
    newAccount.balance -= amount;
    await newAccount.save();
    salary.employee = employee;
    salary.account = account;
    salary.amount = amount;
    salary.pay_date = pay_date;
    salary.description = description;
    await salary.save();
    res.json(salary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete salary
exports.deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) return res.status(404).json({ error: 'Salary not found' });
    // Refund account balance
    const account = await Account.findById(salary.account);
    if (account) {
      account.balance += salary.amount;
      await account.save();
    }
    res.json({ message: 'Salary deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
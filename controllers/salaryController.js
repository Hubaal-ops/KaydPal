const Salary = require('../models/Salary');
const Account = require('../models/Account');
const Employee = require('../models/Employee');

// Get all salaries
exports.getAllSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find()
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
    const salary = new Salary({ employee, account, amount, pay_date, description });
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
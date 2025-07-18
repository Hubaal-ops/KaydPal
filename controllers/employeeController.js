const Employee = require('../models/Employee');
const getNextSequence = require('../getNextSequence');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employee_id: Number(req.params.id) });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, position, store, contact, date_hired } = req.body;
    const employee_id = await getNextSequence('employee_id');
    if (!employee_id) {
      return res.status(500).json({ error: 'Failed to generate employee ID' });
    }
    const newEmployee = new Employee({ employee_id, name, position, store, contact, date_hired });
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { name, position, store, contact, date_hired } = req.body;
    const updatedEmployee = await Employee.findOneAndUpdate(
      { employee_id: Number(req.params.id) },
      { name, position, store, contact, date_hired },
      { new: true, runValidators: true }
    );
    if (!updatedEmployee) return res.status(404).json({ error: 'Employee not found' });
    res.json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findOneAndDelete({ employee_id: Number(req.params.id) });
    if (!deletedEmployee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
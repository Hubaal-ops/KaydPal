const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertEmployee(employeeData) {
  const db = await connectDB();
  const employees = db.collection('employees');

  // Validate required fields
  if (!employeeData.emp_name || employeeData.emp_name.trim() === '') {
    throw new Error('Employee name is required.');
  }
  if (!employeeData.position || employeeData.position.trim() === '') {
    throw new Error('Employee position is required.');
  }

  // Generate emp_no using counter
  const emp_no = await getNextSequence('emp_no');
  if (!emp_no) {
    throw new Error("❌ Failed to get a valid employee number.");
  }

  const newEmployee = {
    emp_no,
    emp_name: employeeData.emp_name.trim(),
    position: employeeData.position.trim(),
    hire_date: employeeData.hire_date ? new Date(employeeData.hire_date) : new Date(),
    updated_at: new Date()
  };

  await employees.insertOne(newEmployee);

  return {
    message: "✅ Employee inserted successfully.",
    emp_no
  };
}

async function getAllEmployees() {
  const db = await connectDB();
  
  const employees = await db.collection('employees')
    .find({})
    .sort({ emp_name: 1 })
    .toArray();

  return employees;
}

async function getEmployeeById(emp_no) {
  const db = await connectDB();
  
  const employee = await db.collection('employees').findOne({ emp_no });
  if (!employee) {
    throw new Error('Employee not found.');
  }

  return employee;
}

async function updateEmployee(emp_no, updatedData) {
  const db = await connectDB();
  
  const existingEmployee = await db.collection('employees').findOne({ emp_no });
  if (!existingEmployee) {
    throw new Error('Employee not found.');
  }

  // Validate fields
  if (updatedData.emp_name !== undefined && updatedData.emp_name.trim() === '') {
    throw new Error('Employee name is required.');
  }
  if (updatedData.position !== undefined && updatedData.position.trim() === '') {
    throw new Error('Employee position is required.');
  }

  const updateFields = {
    updated_at: new Date()
  };

  if (updatedData.emp_name !== undefined) {
    updateFields.emp_name = updatedData.emp_name.trim();
  }
  if (updatedData.position !== undefined) {
    updateFields.position = updatedData.position.trim();
  }
  if (updatedData.hire_date !== undefined) {
    updateFields.hire_date = new Date(updatedData.hire_date);
  }

  await db.collection('employees').updateOne(
    { emp_no },
    { $set: updateFields }
  );

  return {
    message: "✅ Employee updated successfully.",
    emp_no
  };
}

async function deleteEmployee(emp_no) {
  const db = await connectDB();
  
  const employee = await db.collection('employees').findOne({ emp_no });
  if (!employee) {
    throw new Error('Employee not found.');
  }

  // Check if employee has any salary records
  const salaryRecords = await db.collection('salary').findOne({ emp_no });
  if (salaryRecords) {
    throw new Error('Cannot delete employee. Employee has salary records.');
  }

  await db.collection('employees').deleteOne({ emp_no });

  return {
    message: "✅ Employee deleted successfully.",
    emp_no
  };
}

async function getEmployeesByPosition(position) {
  const db = await connectDB();
  
  const employees = await db.collection('employees')
    .find({ position: { $regex: position, $options: 'i' } })
    .sort({ emp_name: 1 })
    .toArray();

  return employees;
}

module.exports = {
  insertEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByPosition
}; 
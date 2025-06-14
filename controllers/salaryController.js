const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertSalary(salaryData) {
  const db = await connectDB();
  
  const {
    emp_no,
    account_id,
    amount
  } = salaryData;

  // Validate required fields
  if (!emp_no) throw new Error('Employee number is required.');
  if (!account_id) throw new Error('Account ID is required.');
  if (!amount || amount <= 0) throw new Error('Salary amount must be greater than 0.');

  // Check if employee exists
  const employee = await db.collection('employees').findOne({ emp_no });
  if (!employee) throw new Error('Employee not found.');

  // Check if account exists
  const account = await db.collection('Accounts').findOne({ account_id });
  if (!account) throw new Error('Account not found.');

  // Check if account has sufficient balance (BEFORE INSERT trigger logic)
  const currentBalance = account.balance || 0;
  if (currentBalance < amount) {
    throw new Error(`Insufficient balance in the account for salary payment. Account balance: $${currentBalance}, Salary amount: $${amount}`);
  }

  // Generate salary number using counter
  const sal_no = await getNextSequence('sal_no');
  if (!sal_no) {
    throw new Error("❌ Failed to get a valid salary number.");
  }

  const newSalary = {
    sal_no,
    emp_no,
    account_id,
    amount,
    created_at: new Date()
  };

  try {
    // Insert salary record
    await db.collection('salary').insertOne(newSalary);

    // Update account balance (AFTER INSERT trigger logic)
    await db.collection('Accounts').updateOne(
      { account_id },
      { $inc: { balance: -amount } }
    );

    return {
      message: "✅ Salary payment processed successfully.",
      sal_no,
      emp_no,
      emp_name: employee.emp_name,
      account_id,
      amount,
      new_balance: currentBalance - amount
    };

  } catch (error) {
    // If any operation fails, we should clean up
    try {
      // Try to delete the salary record if it was inserted
      await db.collection('salary').deleteOne({ sal_no });
    } catch (cleanupError) {
      console.error("Warning: Could not clean up salary record:", cleanupError.message);
    }
    
    throw new Error(`Salary payment failed: ${error.message}`);
  }
}

async function getAllSalaries() {
  const db = await connectDB();
  
  const salaries = await db.collection('salary')
    .aggregate([
      {
        $lookup: {
          from: 'employees',
          localField: 'emp_no',
          foreignField: 'emp_no',
          as: 'employee'
        }
      },
      {
        $lookup: {
          from: 'Accounts',
          localField: 'account_id',
          foreignField: 'account_id',
          as: 'account'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $unwind: '$account'
      },
      {
        $project: {
          sal_no: 1,
          emp_no: 1,
          emp_name: '$employee.emp_name',
          position: '$employee.position',
          account_id: 1,
          account_name: '$account.account_name',
          amount: 1,
          created_at: 1
        }
      },
      {
        $sort: { created_at: -1 }
      }
    ]).toArray();

  return salaries;
}

async function getSalaryById(sal_no) {
  const db = await connectDB();
  
  const salary = await db.collection('salary').findOne({ sal_no });
  if (!salary) {
    throw new Error('Salary record not found.');
  }

  // Get employee and account details
  const employee = await db.collection('employees').findOne({ emp_no: salary.emp_no });
  const account = await db.collection('Accounts').findOne({ account_id: salary.account_id });

  return {
    ...salary,
    emp_name: employee ? employee.emp_name : 'Unknown',
    position: employee ? employee.position : 'Unknown',
    account_name: account ? account.account_name : 'Unknown'
  };
}

async function updateSalary(sal_no, updatedSalaryData) {
  const db = await connectDB();
  
  const oldSalary = await db.collection('salary').findOne({ sal_no });
  if (!oldSalary) {
    throw new Error('Salary record not found.');
  }

  const {
    emp_no,
    account_id,
    amount
  } = updatedSalaryData;

  // Validate required fields
  if (amount !== undefined && amount <= 0) {
    throw new Error('Salary amount must be greater than 0.');
  }

  // Check if employee exists (if being updated)
  if (emp_no && emp_no !== oldSalary.emp_no) {
    const employee = await db.collection('employees').findOne({ emp_no });
    if (!employee) throw new Error('Employee not found.');
  }

  // Check if account exists (if being updated)
  if (account_id && account_id !== oldSalary.account_id) {
    const account = await db.collection('Accounts').findOne({ account_id });
    if (!account) throw new Error('Account not found.');
  }

  // Calculate adjustment amount
  const newAmount = amount !== undefined ? amount : oldSalary.amount;
  const newAccountId = account_id !== undefined ? account_id : oldSalary.account_id;
  const adjustmentAmount = newAmount - oldSalary.amount;

  // Check if account has sufficient balance (BEFORE UPDATE trigger logic)
  if (newAccountId === oldSalary.account_id) {
    // Same account - check if it has enough for the adjustment
    const account = await db.collection('Accounts').findOne({ account_id: newAccountId });
    const currentBalance = account.balance || 0;
    
    if (adjustmentAmount > 0 && currentBalance < adjustmentAmount) {
      throw new Error(`Not enough funds for salary update. Available: $${currentBalance}, Needed: $${adjustmentAmount}`);
    }
  } else {
    // Different account - check if new account has enough for the full amount
    const newAccount = await db.collection('Accounts').findOne({ account_id: newAccountId });
    const newAccountBalance = newAccount.balance || 0;
    
    if (newAccountBalance < newAmount) {
      throw new Error(`Target account has insufficient balance for updated salary. Available: $${newAccountBalance}, Needed: $${newAmount}`);
    }
  }

  try {
    // Update account balances (AFTER UPDATE trigger logic)
    if (newAccountId === oldSalary.account_id) {
      // Same account - just adjust the balance
      await db.collection('Accounts').updateOne(
        { account_id: newAccountId },
        { $inc: { balance: -adjustmentAmount } }
      );
    } else {
      // Different account - restore old account, deduct from new account
      await db.collection('Accounts').updateOne(
        { account_id: oldSalary.account_id },
        { $inc: { balance: oldSalary.amount } }
      );
      
      await db.collection('Accounts').updateOne(
        { account_id: newAccountId },
        { $inc: { balance: -newAmount } }
      );
    }

    // Update salary record
    await db.collection('salary').updateOne(
      { sal_no },
      { 
        $set: {
          emp_no: emp_no !== undefined ? emp_no : oldSalary.emp_no,
          account_id: newAccountId,
          amount: newAmount
        }
      }
    );

    return {
      message: "✅ Salary updated successfully.",
      sal_no,
      adjustment_amount: adjustmentAmount
    };

  } catch (error) {
    throw new Error(`Salary update failed: ${error.message}`);
  }
}

async function deleteSalary(sal_no) {
  const db = await connectDB();
  
  const salary = await db.collection('salary').findOne({ sal_no });
  if (!salary) {
    throw new Error('Salary record not found.');
  }

  try {
    // Restore account balance (reverse the salary payment)
    await db.collection('Accounts').updateOne(
      { account_id: salary.account_id },
      { $inc: { balance: salary.amount } }
    );

    // Delete salary record
    await db.collection('salary').deleteOne({ sal_no });

    return {
      message: "✅ Salary record deleted successfully.",
      sal_no,
      restored_amount: salary.amount
    };

  } catch (error) {
    throw new Error(`Salary deletion failed: ${error.message}`);
  }
}

async function getSalariesByEmployee(emp_no) {
  const db = await connectDB();
  
  const salaries = await db.collection('salary')
    .find({ emp_no })
    .sort({ created_at: -1 })
    .toArray();

  return salaries;
}

async function getSalariesByAccount(account_id) {
  const db = await connectDB();
  
  const salaries = await db.collection('salary')
    .find({ account_id })
    .sort({ created_at: -1 })
    .toArray();

  return salaries;
}

async function getEmployeeSalaryHistory(emp_no) {
  const db = await connectDB();
  
  const salaryHistory = await db.collection('salary')
    .aggregate([
      {
        $match: { emp_no }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'emp_no',
          foreignField: 'emp_no',
          as: 'employee'
        }
      },
      {
        $lookup: {
          from: 'Accounts',
          localField: 'account_id',
          foreignField: 'account_id',
          as: 'account'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $unwind: '$account'
      },
      {
        $project: {
          sal_no: 1,
          amount: 1,
          account_name: '$account.account_name',
          created_at: 1
        }
      },
      {
        $sort: { created_at: -1 }
      }
    ]).toArray();

  return salaryHistory;
}

module.exports = {
  insertSalary,
  getAllSalaries,
  getSalaryById,
  updateSalary,
  deleteSalary,
  getSalariesByEmployee,
  getSalariesByAccount,
  getEmployeeSalaryHistory
}; 
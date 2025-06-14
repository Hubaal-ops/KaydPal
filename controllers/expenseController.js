const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertExpense(expenseData) {
  const db = await connectDB();
  
  const {
    exp_cat_id,
    account_id,
    amount,
    description
  } = expenseData;

  // Validate required fields
  if (!exp_cat_id) throw new Error('Expense category ID is required.');
  if (!account_id) throw new Error('Account ID is required.');
  if (!amount || amount <= 0) throw new Error('Expense amount must be greater than 0.');
  if (!description || description.trim() === '') throw new Error('Expense description is required.');

  // Check if expense category exists
  const category = await db.collection('expense_categories').findOne({ exp_cat_id });
  if (!category) throw new Error('Expense category not found.');

  // Check if account exists
  const account = await db.collection('Accounts').findOne({ account_id });
  if (!account) throw new Error('Account not found.');

  // Check if account has sufficient balance (BEFORE INSERT trigger logic)
  const currentBalance = account.balance || 0;
  if (currentBalance < amount) {
    throw new Error(`Insufficient balance for expense. Account balance: $${currentBalance}, Expense amount: $${amount}`);
  }

  // Generate expense ID using counter
  const exp_id = await getNextSequence('exp_id');
  if (!exp_id) {
    throw new Error("❌ Failed to get a valid expense ID.");
  }

  const newExpense = {
    exp_id,
    exp_cat_id,
    account_id,
    amount,
    description: description.trim(),
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    // Insert expense record
    await db.collection('expenses').insertOne(newExpense);

    // Update account balance (AFTER INSERT trigger logic)
    await db.collection('Accounts').updateOne(
      { account_id },
      { $inc: { balance: -amount } }
    );

    return {
      message: "✅ Expense inserted successfully.",
      exp_id,
      exp_cat_id,
      account_id,
      amount,
      description: description.trim(),
      new_balance: currentBalance - amount
    };

  } catch (error) {
    // If any operation fails, we should clean up
    try {
      // Try to delete the expense record if it was inserted
      await db.collection('expenses').deleteOne({ exp_id });
    } catch (cleanupError) {
      console.error("Warning: Could not clean up expense record:", cleanupError.message);
    }
    
    throw new Error(`Expense insertion failed: ${error.message}`);
  }
}

async function getAllExpenses() {
  const db = await connectDB();
  
  const expenses = await db.collection('expenses')
    .aggregate([
      {
        $lookup: {
          from: 'expense_categories',
          localField: 'exp_cat_id',
          foreignField: 'exp_cat_id',
          as: 'category'
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
        $unwind: '$category'
      },
      {
        $unwind: '$account'
      },
      {
        $project: {
          exp_id: 1,
          exp_cat_id: 1,
          exp_cat_name: '$category.exp_cat_name',
          account_id: 1,
          account_name: '$account.account_name',
          amount: 1,
          description: 1,
          created_at: 1,
          updated_at: 1
        }
      },
      {
        $sort: { created_at: -1 }
      }
    ]).toArray();

  return expenses;
}

async function getExpenseById(exp_id) {
  const db = await connectDB();
  
  const expense = await db.collection('expenses').findOne({ exp_id });
  if (!expense) {
    throw new Error('Expense not found.');
  }

  // Get category and account details
  const category = await db.collection('expense_categories').findOne({ exp_cat_id: expense.exp_cat_id });
  const account = await db.collection('Accounts').findOne({ account_id: expense.account_id });

  return {
    ...expense,
    category_name: category ? category.exp_cat_name : 'Unknown',
    account_name: account ? account.account_name : 'Unknown'
  };
}

async function updateExpense(exp_id, updatedExpenseData) {
  const db = await connectDB();
  
  const oldExpense = await db.collection('expenses').findOne({ exp_id });
  if (!oldExpense) {
    throw new Error('Expense not found.');
  }

  const {
    exp_cat_id,
    account_id,
    amount,
    description
  } = updatedExpenseData;

  // Validate required fields
  if (amount !== undefined && amount <= 0) {
    throw new Error('Expense amount must be greater than 0.');
  }
  if (description !== undefined && description.trim() === '') {
    throw new Error('Expense description is required.');
  }

  // Check if expense category exists (if being updated)
  if (exp_cat_id && exp_cat_id !== oldExpense.exp_cat_id) {
    const category = await db.collection('expense_categories').findOne({ exp_cat_id });
    if (!category) throw new Error('Expense category not found.');
  }

  // Check if account exists (if being updated)
  if (account_id && account_id !== oldExpense.account_id) {
    const account = await db.collection('Accounts').findOne({ account_id });
    if (!account) throw new Error('Account not found.');
  }

  // Calculate adjustment amount
  const newAmount = amount !== undefined ? amount : oldExpense.amount;
  const newAccountId = account_id !== undefined ? account_id : oldExpense.account_id;
  const adjustmentAmount = newAmount - oldExpense.amount;

  // Check if account has sufficient balance (BEFORE UPDATE trigger logic)
  if (newAccountId === oldExpense.account_id) {
    // Same account - check if it has enough for the adjustment
    const account = await db.collection('Accounts').findOne({ account_id: newAccountId });
    const currentBalance = account.balance || 0;
    
    if (adjustmentAmount > 0 && currentBalance < adjustmentAmount) {
      throw new Error(`Not enough funds for updated expense. Available: $${currentBalance}, Needed: $${adjustmentAmount}`);
    }
  } else {
    // Different account - check if new account has enough for the full amount
    const newAccount = await db.collection('Accounts').findOne({ account_id: newAccountId });
    const newAccountBalance = newAccount.balance || 0;
    
    if (newAccountBalance < newAmount) {
      throw new Error(`Target account has insufficient balance for updated expense. Available: $${newAccountBalance}, Needed: $${newAmount}`);
    }
  }

  try {
    // Update account balances (AFTER UPDATE trigger logic)
    if (newAccountId === oldExpense.account_id) {
      // Same account - just adjust the balance
      await db.collection('Accounts').updateOne(
        { account_id: newAccountId },
        { $inc: { balance: -adjustmentAmount } }
      );
    } else {
      // Different account - restore old account, deduct from new account
      await db.collection('Accounts').updateOne(
        { account_id: oldExpense.account_id },
        { $inc: { balance: oldExpense.amount } }
      );
      
      await db.collection('Accounts').updateOne(
        { account_id: newAccountId },
        { $inc: { balance: -newAmount } }
      );
    }

    // Update expense record
    await db.collection('expenses').updateOne(
      { exp_id },
      { 
        $set: {
          exp_cat_id: exp_cat_id !== undefined ? exp_cat_id : oldExpense.exp_cat_id,
          account_id: newAccountId,
          amount: newAmount,
          description: description !== undefined ? description.trim() : oldExpense.description,
          updated_at: new Date()
        }
      }
    );

    return {
      message: "✅ Expense updated successfully.",
      exp_id,
      adjustment_amount: adjustmentAmount
    };

  } catch (error) {
    throw new Error(`Expense update failed: ${error.message}`);
  }
}

async function deleteExpense(exp_id) {
  const db = await connectDB();
  
  const expense = await db.collection('expenses').findOne({ exp_id });
  if (!expense) {
    throw new Error('Expense not found.');
  }

  try {
    // Restore account balance (reverse the expense)
    await db.collection('Accounts').updateOne(
      { account_id: expense.account_id },
      { $inc: { balance: expense.amount } }
    );

    // Delete expense record
    await db.collection('expenses').deleteOne({ exp_id });

    return {
      message: "✅ Expense deleted successfully.",
      exp_id,
      restored_amount: expense.amount
    };

  } catch (error) {
    throw new Error(`Expense deletion failed: ${error.message}`);
  }
}

async function getExpensesByCategory(exp_cat_id) {
  const db = await connectDB();
  
  const expenses = await db.collection('expenses')
    .find({ exp_cat_id })
    .sort({ created_at: -1 })
    .toArray();

  return expenses;
}

async function getExpensesByAccount(account_id) {
  const db = await connectDB();
  
  const expenses = await db.collection('expenses')
    .find({ account_id })
    .sort({ created_at: -1 })
    .toArray();

  return expenses;
}

module.exports = {
  insertExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpensesByCategory,
  getExpensesByAccount
}; 
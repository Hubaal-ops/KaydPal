const { insertExpense, getAllExpenses, getExpenseById } = require('../controllers/expenseController');

async function runInsertExpenses() {
  try {
    console.log("💰 Creating expenses...\n");

    // Insert multiple expenses
    const expenses = [
      {
        exp_cat_id: 1, // Office Supplies
        account_id: 1,
        amount: 150.00,
        description: 'Purchase of office stationery and paper'
      },
      {
        exp_cat_id: 2, // Utilities
        account_id: 1,
        amount: 300.00,
        description: 'Monthly electricity and water bills'
      },
      // {
      //   exp_cat_id: 3, // Rent
      //   account_id: 1,
      //   amount: 2000.00,
      //   description: 'Monthly office rent payment'
      // },
      // {
      //   exp_cat_id: 4, // Salaries
      //   account_id: 1,
      //   amount: 5000.00,
      //   description: 'Monthly staff salaries'
      // }
    ];

    for (const expense of expenses) {
      try {
        const result = await insertExpense(expense);
        console.log(`✅ ${result.message}`);
        console.log(`   Expense ID: ${result.exp_id}`);
        console.log(`   Amount: $${result.amount}`);
        console.log(`   New Balance: $${result.new_balance}\n`);
      } catch (error) {
        console.log(`❌ Failed to insert expense: ${error.message}\n`);
      }
    }

    // Display all expenses with details
    console.log("📋 All expenses with details:");
    const allExpenses = await getAllExpenses();
    allExpenses.forEach(exp => {
      console.log(`ID: ${exp.exp_id} | Category: ${exp.exp_cat_name} | Account: ${exp.account_name}`);
      console.log(`   Amount: $${exp.amount} | Description: ${exp.description}`);
      console.log(`   Date: ${exp.created_at.toDateString()}\n`);
    });

  } catch (err) {
    console.error("❌ Error in expense insertion:", err.message);
  }
}

// Test expense validation
async function testExpenseValidation() {
  console.log("\n🔍 Testing expense validation...\n");

  try {
    // Test 1: Try to create expense with insufficient balance
    console.log("Test 1: Attempting expense with insufficient balance...");
    try {
      await insertExpense({
        exp_cat_id: 1,
        account_id: 1,
        amount: 100000.00, // Very large amount
        description: 'Test expense'
      });
    } catch (error) {
      console.log(`✅ Expected error caught: ${error.message}`);
    }

    // Test 2: Try to create expense with invalid category
    console.log("\nTest 2: Attempting expense with invalid category...");
    try {
      await insertExpense({
        exp_cat_id: 999, // Non-existent category
        account_id: 1,
        amount: 50.00,
        description: 'Test expense'
      });
    } catch (error) {
      console.log(`✅ Expected error caught: ${error.message}`);
    }

    // Test 3: Try to create expense with zero amount
    console.log("\nTest 3: Attempting expense with zero amount...");
    try {
      await insertExpense({
        exp_cat_id: 1,
        account_id: 1,
        amount: 0,
        description: 'Test expense'
      });
    } catch (error) {
      console.log(`✅ Expected error caught: ${error.message}`);
    }

    // Test 4: Try to create expense without description
    console.log("\nTest 4: Attempting expense without description...");
    try {
      await insertExpense({
        exp_cat_id: 1,
        account_id: 1,
        amount: 50.00,
        description: ''
      });
    } catch (error) {
      console.log(`✅ Expected error caught: ${error.message}`);
    }

  } catch (error) {
    console.error("❌ Error in validation tests:", error.message);
  }
}

// Run the examples
async function runExamples() {
  await runInsertExpenses();
  await testExpenseValidation();
}

runExamples(); 
const { insertSalary, getAllSalaries, getEmployeeSalaryHistory } = require('../controllers/salaryController');

async function runInsertSalaries() {
  try {
    console.log("💰 Processing salary payments...\n");

    // Insert multiple salary payments
    const salaries = [
      {
        emp_no: 1, // John Smith - Manager
        account_id: 1,
        amount: 5000.00
      },
      {
        emp_no: 2, // Sarah Johnson - Accountant
        account_id: 1,
        amount: 4000.00
      },
      {
        emp_no: 3, // Michael Brown - Sales Representative
        account_id: 1,
        amount: 3500.00
      },
      {
        emp_no: 4, // Emily Davis - Administrative Assistant
        account_id: 1,
        amount: 3000.00
      },
      {
        emp_no: 5, // David Wilson - IT Specialist
        account_id: 1,
        amount: 4500.00
      }
    ];

    for (const salary of salaries) {
      try {
        const result = await insertSalary(salary);
        console.log(`✅ ${result.message}`);
        console.log(`   Salary No: ${result.sal_no}`);
        console.log(`   Employee: ${result.emp_name}`);
        console.log(`   Amount: $${result.amount}`);
        console.log(`   New Balance: $${result.new_balance}\n`);
      } catch (error) {
        console.log(`❌ Failed to process salary: ${error.message}\n`);
      }
    }

    // Display all salary payments with details
    console.log("📋 All salary payments with details:");
    const allSalaries = await getAllSalaries();
    allSalaries.forEach(sal => {
      console.log(`No: ${sal.sal_no} | Employee: ${sal.emp_name} (${sal.position})`);
      console.log(`   Account: ${sal.account_name} | Amount: $${sal.amount}`);
      console.log(`   Date: ${sal.created_at.toDateString()}\n`);
    });

  } catch (err) {
    console.error("❌ Error in salary insertion:", err.message);
  }
}

// Test salary validation
async function testSalaryValidation() {
  console.log("\n🔍 Testing salary validation...\n");

  try {
    // Test 1: Try to create salary with insufficient balance
    console.log("Test 1: Attempting salary with insufficient balance...");
    try {
      await insertSalary({
        emp_no: 1,
        account_id: 1,
        amount: 100000.00 // Very large amount
      });
    } catch (error) {
      console.log(`✅ Expected error caught: ${error.message}`);
    }

    // Test 2: Try to create salary with invalid employee
    console.log("\nTest 2: Attempting salary with invalid employee...");
    try {
      await insertSalary({
        emp_no: 999, // Non-existent employee
        account_id: 1,
        amount: 3000.00
      });
    } catch (error) {
      console.log(`✅ Expected error caught: ${error.message}`);
    }

    // Test 3: Try to create salary with zero amount
    console.log("\nTest 3: Attempting salary with zero amount...");
    try {
      await insertSalary({
        emp_no: 1,
        account_id: 1,
        amount: 0
      });
    } catch (error) {
      console.log(`✅ Expected error caught: ${error.message}`);
    }

    // Test 4: Try to create salary with invalid account
    console.log("\nTest 4: Attempting salary with invalid account...");
    try {
      await insertSalary({
        emp_no: 1,
        account_id: 999, // Non-existent account
        amount: 3000.00
      });
    } catch (error) {
      console.log(`✅ Expected error caught: ${error.message}`);
    }

  } catch (error) {
    console.error("❌ Error in validation tests:", error.message);
  }
}

// Test employee salary history
async function testEmployeeSalaryHistory() {
  console.log("\n📊 Employee salary history...\n");

  try {
    // Get salary history for employee 1
    const history = await getEmployeeSalaryHistory(1);
    console.log(`Salary history for Employee #1:`);
    history.forEach(sal => {
      console.log(`   Salary #${sal.sal_no}: $${sal.amount} from ${sal.account_name} on ${sal.created_at.toDateString()}`);
    });

  } catch (error) {
    console.error("❌ Error getting salary history:", error.message);
  }
}

// Run the examples
async function runExamples() {
  await runInsertSalaries();
  await testSalaryValidation();
  await testEmployeeSalaryHistory();
}

runExamples(); 
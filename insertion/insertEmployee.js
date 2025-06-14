const { insertEmployee, getAllEmployees } = require('../controllers/employeeController');

async function runInsertEmployees() {
  try {
    console.log("👥 Creating employees...\n");

    // Insert multiple employees
    const employees = [
      {
        emp_name: 'John Smith',
        position: 'Manager',
        hire_date: '2023-01-15'
      },
      {
        emp_name: 'Sarah Johnson',
        position: 'Accountant',
        hire_date: '2023-02-20'
      },
      {
        emp_name: 'Michael Brown',
        position: 'Sales Representative',
        hire_date: '2023-03-10'
      },
      {
        emp_name: 'Emily Davis',
        position: 'Administrative Assistant',
        hire_date: '2023-04-05'
      },
      {
        emp_name: 'David Wilson',
        position: 'IT Specialist',
        hire_date: '2023-05-12'
      }
    ];

    for (const employee of employees) {
      try {
        const result = await insertEmployee(employee);
        console.log(`✅ ${result.message} - Employee No: ${result.emp_no}`);
      } catch (error) {
        console.log(`❌ Failed to insert "${employee.emp_name}": ${error.message}`);
      }
    }

    // Display all employees
    console.log("\n📋 All employees:");
    const allEmployees = await getAllEmployees();
    allEmployees.forEach(emp => {
      console.log(`No: ${emp.emp_no} | Name: ${emp.emp_name} | Position: ${emp.position}`);
      console.log(`   Hire Date: ${emp.hire_date.toDateString()}\n`);
    });

  } catch (err) {
    console.error("❌ Error in employee insertion:", err.message);
  }
}

runInsertEmployees(); 
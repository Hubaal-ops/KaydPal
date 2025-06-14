const { insertCustomer } = require('../controllers/customerController');

async function runCustomerInsert() {
  try {
    const result = await insertCustomer({
      name: "Amina Yusuf",
      email: "amina@example.com",
      phone: "+252611234567",
      bal: 0
    });

    console.log(result.message, `Customer No: ${result.customer_no}`);
  } catch (err) {
    console.error("❌ Error inserting customer:", err.message);
  }
}

runCustomerInsert();

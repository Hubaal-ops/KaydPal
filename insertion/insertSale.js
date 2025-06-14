const { insertSale } = require('../controllers/salesController');

async function runInsertSale() {
  try {
    const result = await insertSale({
      product_no: 1,       // Existing product_no
      customer_no: 1,      // Existing customer_no
      store_no: 1,         // Existing store_no
      qty: 1,
      price: 100,
      discount: 0,        // 10 discount
      tax: 5,              // 5 tax
      amount: 105,         // (2 * 100) - 10 + 5 = 195
      paid: 105,           // Partial payment
      account_id: 1        // Account ID
    });

    console.log(result.message, `Sales No: ${result.sel_no}`);
  } catch (err) {
    console.error("❌ Error inserting sale:", err.message);
  }
}

runInsertSale();

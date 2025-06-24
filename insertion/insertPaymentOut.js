const { insertPaymentOut } = require('../controllers/paymentOutController');

async function runInsertPaymentOut() {
  try {
    const result = await insertPaymentOut({
      account_id: 1,      // Account ID
      supplier_no: 1,     // Supplier number
      amount: 1000,       // Payment amount
      description: 'Payment for goods received' // Payment description
    });

    console.log(result.message);
    console.log(`Payment ID: ${result.id}`);
    console.log('Account:', result.account);
    console.log('Supplier:', result.supplier);
  } catch (err) {
    console.error("❌ Error processing payment out:", err.message);
  }
}

runInsertPaymentOut(); 
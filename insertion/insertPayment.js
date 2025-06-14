const { insertPayment, getCustomerBalance, getCustomerPayments } = require('../controllers/paymentController');

async function runInsertPayment() {
  try {
    // First, let's check the customer's current balance
    console.log("📊 Checking customer balance before payment...");
    const balanceBefore = await getCustomerBalance(1);
    console.log(`Customer: ${balanceBefore.customer_name}`);
    console.log(`Outstanding Balance: $${balanceBefore.outstanding_balance}`);
    
    // Process a payment
    console.log("\n💳 Processing payment...");
    const result = await insertPayment({
      customer_id: 1,           // Customer ID
      account_id: 1,            // Account ID to receive the payment
      amount: 50                // Payment amount
    });

    console.log(`✅ ${result.message}`);
    console.log(`Payment ID: ${result.id}`);
    console.log(`Amount Paid: $${result.amount}`);
    console.log(`Remaining Balance: $${result.remaining_balance}`);

    // Check customer balance after payment
    console.log("\n📊 Checking customer balance after payment...");
    const balanceAfter = await getCustomerBalance(1);
    console.log(`Outstanding Balance: $${balanceAfter.outstanding_balance}`);

    // Get customer's payment history
    console.log("\n📋 Customer payment history:");
    const payments = await getCustomerPayments(1);
    payments.forEach(payment => {
      console.log(`Payment ID ${payment.id}: $${payment.amount} on ${payment.created_at.toDateString()}`);
    });

  } catch (err) {
    console.error("❌ Error processing payment:", err.message);
  }
}

// Example of processing another payment
async function runInsertAnotherPayment() {
  try {
    console.log("\n💳 Processing another payment...");
    const result = await insertPayment({
      customer_id: 1,
      account_id: 1,
      amount: 25
    });

    console.log(`✅ ${result.message}`);
    console.log(`Payment ID: ${result.id}`);
    console.log(`Amount Paid: $${result.amount}`);
    console.log(`Remaining Balance: $${result.remaining_balance}`);

  } catch (err) {
    console.error("❌ Error processing payment:", err.message);
  }
}

// Run the examples
async function runExamples() {
  await runInsertPayment();
  await runInsertAnotherPayment();
}

runExamples(); 
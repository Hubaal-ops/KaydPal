const { insertSalesReturn } = require('../controllers/salesReturnController');

async function runInsertSalesReturn() {
  try {
    const result = await insertSalesReturn({
      sel_no: 1,          // Original sale number
      product_no: 1,      // Product number
      customer_no: 1,     // Customer number
      store_no: 1,        // Store number
      qty: 1,             // Return quantity
      price: 100,         // Original price
      amount: 100,        // Return amount
      paid: 100,          // Amount paid (refund amount)
      reason: 'Product defect' // Return reason
    });

    console.log(result.message);
    console.log(`Return ID: ${result.return_id}`);
    console.log(`Total Refund Amount: ${result.refundAmount}`);
    console.log(`Debt Reduction: ${result.debtReduction}`);
    console.log(`Account Refund: ${result.accountRefund}`);
  } catch (err) {
    console.error("❌ Error processing sales return:", err.message);
  }
}

runInsertSalesReturn(); 
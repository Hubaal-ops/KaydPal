const { insertPurchaseReturn } = require('../controllers/purchaseReturnController');

async function runPurchaseReturn() {
  try {
    const result = await insertPurchaseReturn({
      pur_no: 'PUR-00007', // Original purchase number
      sup_no: 1,           // Supplier number
      pro_no: 1,           // Product number
      store_no: 1,         // Store number
      qty: 3,              // Return quantity
      price: 200,          // Original price per unit
      amount: 600,         // Total return amount (qty * price)
      paid: 600,           // Amount to be refunded
      reason: 'Defective items', // Return reason
      return_date: new Date()
    });

    console.log(result.message);
    console.log('Return ID:', result.return_id);
    console.log('Debt Reduction:', result.debt_reduction);
    console.log('Refund to Account:', result.refund_to_account);
  } catch (err) {
    console.error(err.message);
  }
}

runPurchaseReturn(); 
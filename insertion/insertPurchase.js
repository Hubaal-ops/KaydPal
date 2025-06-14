// insertion/insertPurchase.js
const { insertPurchase } = require('../controllers/purchaseController');

async function runInsertPurchase() {
  try {
    const result = await insertPurchase({
      product_no: 1,
      supplier_no: 1,
      store_no: 1,
      qty: 5,
      price: 200,
      discount: 20,
      tax: 10,
      paid: 500,
      account_id: 1
    });

    console.log(result.message, `Purchase No: ${result.purchase_no}`);
  } catch (err) {
    console.error('❌ Error inserting purchase:', err.message);
  }
}

runInsertPurchase();

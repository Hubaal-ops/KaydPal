const { insertStockTransfer } = require('../controllers/stockTransferController');

async function runInsertStockTransfer() {
  try {
    const result = await insertStockTransfer({
      from_store: 1,      // Source store number
      to_store: 6,        // Destination store number
      pro_no: 1,          // Product number
      qty: 5,             // Transfer quantity
      transfer_desc: 'Transfer to new location' // Transfer description
    });

    console.log(result.message);
    console.log(`Transfer ID: ${result.transfer_id}`);
    console.log('From Store:', result.from_store);
    console.log('To Store:', result.to_store);
  } catch (err) {
    console.error("❌ Error processing stock transfer:", err.message);
  }
}

runInsertStockTransfer(); 
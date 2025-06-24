const { insertStockAdjustment } = require('../controllers/stockAdjustmentController');

async function runStockAdjustment() {
  try {
    // Choose one action: 'add' or 'subtract'
    const adj_type = 'add'; // Change this to 'subtract' if you want to test subtraction

    const result = await insertStockAdjustment({
      pro_no: 1,           // Product number
      store_no: 1,         // Store number
      qty: 5,             // Quantity to adjust
      adj_type: adj_type,  // Adjustment type
      adj_desc: adj_type === 'add' ? 'Adding stock' : 'Reducing stock' // Description
    });

    console.log(`\n=== ${adj_type.toUpperCase()} Stock Result ===`);
    console.log(result.message);
    console.log(`Adjustment No: ${result.adj_no}`);
    console.log('Product:', result.product);
    console.log('Store:', result.store);

  } catch (err) {
    console.error("❌ Error processing stock adjustment:", err.message);
  }
}

runStockAdjustment(); 
// insertStoreProduct.js
const { insertStoreProduct } = require('../controllers/storeProductController');

async function runInsertStoreProduct() {
  try {
    // Insert store product 1
    const result1 = await insertStoreProduct({
      product_no: 1,
      store_no: 1,
      qty: 5
    });
    console.log(result1.message);
    console.log("Store Product ID:", result1.store_product_ID);

    // Insert store product 2
    const result2 = await insertStoreProduct({
      product_no: 2,
      store_no: 1,
      qty: 12
    });
    console.log(result2.message);
    console.log("Store Product ID:", result2.store_product_ID);

    // Insert store product 3
    const result3 = await insertStoreProduct({
      product_no: 1,
      store_no: 2,
      qty: 3
    });
    console.log(result3.message);
    console.log("Store Product ID:", result3.store_product_ID);

    // Insert store product 4
    const result4 = await insertStoreProduct({
      product_no: 3,
      store_no: 3,
      qty: 8
    });
    console.log(result4.message);
    console.log("Store Product ID:", result4.store_product_ID);

    console.log("✅ All store products inserted successfully!");
  } catch (err) {
    console.error("❌ Error inserting store product:", err.message);
  }
}

// Run the insertion
runInsertStoreProduct(); 
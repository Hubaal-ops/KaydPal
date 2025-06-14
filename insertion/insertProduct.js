const { insertProduct } = require('../controllers/productController');

async function runInsertProduct() {
  try {
    const result = await insertProduct({
      product_name: "Macbook Pro 14",
      category: "Electronics",
      storing_balance: 0,
      created_at: Date()
    });

    console.log(result.message, `Product No: ${result.product_no}`);
  } catch (err) {
    console.error("❌ Error inserting product:", err.message);
  }
}

runInsertProduct();

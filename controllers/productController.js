const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertProduct(productData) {
  const db = await connectDB();
  const products = db.collection('Products');

  // Generate product_no using counter
  const productNo = await getNextSequence('product_no');

  if (!productNo) {
    throw new Error("❌ Failed to get a valid product number.");
  }

  const newProduct = {
    product_no: productNo,
    product_name: productData.product_name,
    category: productData.category,
    storing_balance: productData.storing_balance || 0,
    created_at: productData.created_at ? new Date(productData.created_at) : new Date()
  };

  await products.insertOne(newProduct);

  return {
    message: "✅ Product inserted successfully.",
    product_no: productNo
  };
}

module.exports = {
  insertProduct
};

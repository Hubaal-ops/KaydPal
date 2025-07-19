const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

// Create a new product
async function insertProduct(productData) {
  const db = await connectDB();
  const products = db.collection('products');

  // Validate required fields
  if (!productData.product_name || productData.product_name.trim() === '') {
    throw new Error('Product name is required.');
  }

  // Check if product name already exists
  const existingProduct = await products.findOne({ 
    product_name: productData.product_name.trim() 
  });
  
  if (existingProduct) {
    throw new Error('Product with this name already exists.');
  }

  // Generate product_no using counter
  const product_no = await getNextSequence('product_no');
  if (!product_no) {
    throw new Error("❌ Failed to get a valid product number.");
  }

  const newProduct = {
    product_no,
    product_name: productData.product_name.trim(),
    description: productData.description || '',
    category: productData.category || null,
    price: productData.price || 0,
    cost: productData.cost || 0,
    quantity: productData.quantity || 0,
    sku: productData.sku || '',
    barcode: productData.barcode || '',
    storing_balance: productData.storing_balance !== undefined ? productData.storing_balance : 0,
    created_at: new Date(),
    updated_at: new Date()
  };

  await products.insertOne(newProduct);

  return {
    message: "✅ Product created successfully.",
    product_no
  };
}

// Get all products
async function getAllProducts() {
  const db = await connectDB();
  
  const products = await db.collection('products')
    .find({})
    .sort({ product_name: 1 })
    .toArray();

  return products;
}

// Get single product by ID
async function getProductById(product_no) {
  const db = await connectDB();
  
  const product = await db.collection('products').findOne({ product_no: parseInt(product_no) });
  if (!product) {
    throw new Error('Product not found.');
  }

  return product;
}

// Update product
async function updateProduct(product_no, updatedData) {
  const db = await connectDB();
  
  const existingProduct = await db.collection('products').findOne({ product_no: parseInt(product_no) });
  if (!existingProduct) {
    throw new Error('Product not found.');
  }

  // Validate product name if being updated
  if (updatedData.product_name && updatedData.product_name.trim() === '') {
    throw new Error('Product name is required.');
  }

  // Check if new name already exists (excluding current product)
  if (updatedData.product_name) {
    const duplicateProduct = await db.collection('products').findOne({ 
      product_name: updatedData.product_name.trim(),
      product_no: { $ne: parseInt(product_no) }
    });
    
    if (duplicateProduct) {
      throw new Error('Product with this name already exists.');
    }
  }

  const updateFields = {
    ...(updatedData.product_name && { product_name: updatedData.product_name.trim() }),
    ...(updatedData.description && { description: updatedData.description }),
    ...(updatedData.category && { category: updatedData.category }),
    ...(updatedData.price !== undefined && { price: parseFloat(updatedData.price) }),
    ...(updatedData.cost !== undefined && { cost: parseFloat(updatedData.cost) }),
    ...(updatedData.quantity !== undefined && { quantity: parseInt(updatedData.quantity) }),
    ...(updatedData.sku && { sku: updatedData.sku }),
    ...(updatedData.barcode && { barcode: updatedData.barcode }),
    updated_at: new Date()
  };

  await db.collection('products').updateOne(
    { product_no: parseInt(product_no) },
    { $set: updateFields }
  );

  return {
    message: "✅ Product updated successfully.",
    product_no: parseInt(product_no)
  };
}

// Delete product
async function deleteProduct(product_no) {
  const db = await connectDB();
  
  const result = await db.collection('products').deleteOne({ product_no: parseInt(product_no) });
  
  if (result.deletedCount === 0) {
    throw new Error('Product not found.');
  }

  return {
    message: "✅ Product deleted successfully.",
    product_no: parseInt(product_no)
  };
}

module.exports = {
  insertProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};

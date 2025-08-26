const mongoose = require('mongoose');
const Product = require('../models/Product');
const getNextSequence = require('../getNextSequence');

// Create a new product
async function insertProduct(productData) {
  try {
    // Validate required fields
    if (!productData.product_name || productData.product_name.trim() === '') {
      throw new Error('Product name is required.');
    }

    // Check if product name already exists for this user
    const existingProduct = await Product.findOne({ 
      product_name: productData.product_name.trim(),
      userId: productData.userId
    });
    
    if (existingProduct) {
      throw new Error('Product with this name already exists.');
    }

    // Generate product_no using counter
    const product_no = await getNextSequence('product_no');
    if (!product_no) {
      throw new Error("❌ Failed to get a valid product number.");
    }

    const newProduct = new Product({
      product_no,
      product_name: productData.product_name.trim(),
      description: productData.description || '',
      category: productData.category || null,
      price: Number(productData.price) || 0,
      cost: Number(productData.cost) || 0,
      quantity: Number(productData.quantity) || 0,
      sku: productData.sku || '',
      barcode: productData.barcode || '',
      storing_balance: productData.storing_balance !== undefined ? Number(productData.storing_balance) : 0,
      userId: productData.userId,
      created_at: new Date(),
      updated_at: new Date()
    });

    await newProduct.save();

    return {
      message: "✅ Product created successfully.",
      product_no
    };
  } catch (error) {
    throw error;
  }
}

// Get all products
async function getAllProducts(userId) {
  try {
    const products = await Product.find({ userId })
      .sort({ product_name: 1 })
      .lean();
    return products;
  } catch (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }
}

// Get single product by ID
async function getProductById(product_no, userId) {
  try {
    const product = await Product.findOne({ 
      product_no: Number(product_no), 
      userId 
    }).lean();
    
    if (!product) {
      throw new Error('Product not found.');
    }
    return product;
  } catch (error) {
    throw error;
  }
}

// Update product
async function updateProduct(product_no, updatedData, userId) {
  try {
    const existingProduct = await Product.findOne({ 
      product_no: Number(product_no), 
      userId 
    });
    
    if (!existingProduct) {
      throw new Error('Product not found.');
    }

    // Validate product name if being updated
    if (updatedData.product_name && updatedData.product_name.trim() === '') {
      throw new Error('Product name is required.');
    }

    // Check if new name already exists (excluding current product)
    if (updatedData.product_name) {
      const duplicateProduct = await Product.findOne({ 
        product_name: updatedData.product_name.trim(),
        product_no: { $ne: Number(product_no) },
        userId
      });
      
      if (duplicateProduct) {
        throw new Error('Product with this name already exists.');
      }
    }

    const updateFields = {
      updated_at: new Date()
    };

    // Add fields conditionally with proper type conversion
    if (updatedData.product_name) updateFields.product_name = updatedData.product_name.trim();
    if (updatedData.description !== undefined) updateFields.description = updatedData.description;
    if (updatedData.category !== undefined) updateFields.category = updatedData.category;
    if (updatedData.price !== undefined) updateFields.price = Number(updatedData.price);
    if (updatedData.cost !== undefined) updateFields.cost = Number(updatedData.cost);
    if (updatedData.quantity !== undefined) updateFields.quantity = Number(updatedData.quantity);
    if (updatedData.sku !== undefined) updateFields.sku = updatedData.sku;
    if (updatedData.barcode !== undefined) updateFields.barcode = updatedData.barcode;
    if (updatedData.storing_balance !== undefined) updateFields.storing_balance = Number(updatedData.storing_balance);

    await Product.updateOne(
      { product_no: Number(product_no), userId },
      { $set: updateFields }
    );

    return {
      message: "✅ Product updated successfully.",
      product_no: Number(product_no)
    };
  } catch (error) {
    throw error;
  }
}

// Delete product
async function deleteProduct(product_no, userId) {
  try {
    const result = await Product.deleteOne({ 
      product_no: Number(product_no), 
      userId 
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Product not found.');
    }
    
    return {
      message: "✅ Product deleted successfully.",
      product_no: Number(product_no)
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  insertProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};

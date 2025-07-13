const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

// Insert store product
async function insertStoreProduct(storeProductData) {
  const db = await connectDB();
  const storesProduct = db.collection('Stores_Product');

  // Validate required fields
  if (!storeProductData.product_no || !storeProductData.store_no) {
    throw new Error('Product number and store number are required.');
  }

  if (storeProductData.qty < 0) {
    throw new Error('Quantity cannot be negative.');
  }

  // Check if product exists
  const product = await db.collection('Products').findOne({ product_no: storeProductData.product_no });
  if (!product) {
    throw new Error('Product not found.');
  }

  // Check if store exists
  const store = await db.collection('Stores').findOne({ store_no: storeProductData.store_no });
  if (!store) {
    throw new Error('Store not found.');
  }

  // Check if combination already exists
  const existingStoreProduct = await storesProduct.findOne({ 
    product_no: storeProductData.product_no,
    store_no: storeProductData.store_no
  });
  
  if (existingStoreProduct) {
    throw new Error('This product is already assigned to this store.');
  }

  // Generate store_product_ID using counter
  const store_product_ID = await getNextSequence('store_product_ID');
  if (!store_product_ID) {
    throw new Error("❌ Failed to get a valid store product ID.");
  }

  const newStoreProduct = {
    store_product_ID,
    product_no: storeProductData.product_no,
    store_no: storeProductData.store_no,
    qty: storeProductData.qty || 0,
    created_at: new Date(),
    updated_at: new Date()
  };

  await storesProduct.insertOne(newStoreProduct);

  return {
    message: "✅ Store product inserted successfully.",
    store_product_ID
  };
}

// Get all store products
async function getAllStoreProducts() {
  const db = await connectDB();
  
  const storeProducts = await db.collection('Stores_Product')
    .aggregate([
      {
        $lookup: {
          from: 'Products',
          localField: 'product_no',
          foreignField: 'product_no',
          as: 'product'
        }
      },
      {
        $lookup: {
          from: 'Stores',
          localField: 'store_no',
          foreignField: 'store_no',
          as: 'store'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $unwind: '$store'
      },
      {
        $project: {
          store_product_ID: 1,
          product_no: 1,
          store_no: 1,
          qty: 1,
          created_at: 1,
          updated_at: 1,
          product_name: '$product.product_name',
          store_name: '$store.store_name'
        }
      },
      {
        $sort: { store_product_ID: 1 }
      }
    ]).toArray();

  return storeProducts;
}

// Get store product by ID
async function getStoreProductById(store_product_ID) {
  const db = await connectDB();
  
  const storeProduct = await db.collection('Stores_Product').findOne({ store_product_ID });
  if (!storeProduct) {
    throw new Error('Store product not found.');
  }

  return storeProduct;
}

// Update store product
async function updateStoreProduct(store_product_ID, updatedData) {
  const db = await connectDB();
  
  const existingStoreProduct = await db.collection('Stores_Product').findOne({ store_product_ID });
  if (!existingStoreProduct) {
    throw new Error('Store product not found.');
  }

  // Validate product and store if they're being updated
  if (updatedData.product_no) {
    const product = await db.collection('Products').findOne({ product_no: updatedData.product_no });
    if (!product) {
      throw new Error('Product not found.');
    }
  }

  if (updatedData.store_no) {
    const store = await db.collection('Stores').findOne({ store_no: updatedData.store_no });
    if (!store) {
      throw new Error('Store not found.');
    }
  }

  // Check if new combination already exists (excluding current record)
  if (updatedData.product_no || updatedData.store_no) {
    const newProductNo = updatedData.product_no || existingStoreProduct.product_no;
    const newStoreNo = updatedData.store_no || existingStoreProduct.store_no;
    
    const duplicateStoreProduct = await db.collection('Stores_Product').findOne({ 
      product_no: newProductNo,
      store_no: newStoreNo,
      store_product_ID: { $ne: store_product_ID }
    });
    
    if (duplicateStoreProduct) {
      throw new Error('This product is already assigned to this store.');
    }
  }

  if (updatedData.qty !== undefined && updatedData.qty < 0) {
    throw new Error('Quantity cannot be negative.');
  }

  const updateFields = {
    ...updatedData,
    updated_at: new Date()
  };

  await db.collection('Stores_Product').updateOne(
    { store_product_ID },
    { $set: updateFields }
  );

  return {
    message: "✅ Store product updated successfully.",
    store_product_ID
  };
}

// Delete store product
async function deleteStoreProduct(store_product_ID) {
  const db = await connectDB();
  
  const storeProduct = await db.collection('Stores_Product').findOne({ store_product_ID });
  if (!storeProduct) {
    throw new Error('Store product not found.');
  }

  await db.collection('Stores_Product').deleteOne({ store_product_ID });

  return {
    message: "✅ Store product deleted successfully.",
    store_product_ID
  };
}

// Get store products by store
async function getStoreProductsByStore(store_no) {
  const db = await connectDB();
  
  const storeProducts = await db.collection('Stores_Product')
    .aggregate([
      {
        $match: { store_no: parseInt(store_no) }
      },
      {
        $lookup: {
          from: 'Products',
          localField: 'product_no',
          foreignField: 'product_no',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          store_product_ID: 1,
          product_no: 1,
          store_no: 1,
          qty: 1,
          created_at: 1,
          updated_at: 1,
          product_name: '$product.product_name'
        }
      },
      {
        $sort: { product_name: 1 }
      }
    ]).toArray();

  return storeProducts;
}

// Get store products by product
async function getStoreProductsByProduct(product_no) {
  const db = await connectDB();
  
  const storeProducts = await db.collection('Stores_Product')
    .aggregate([
      {
        $match: { product_no: parseInt(product_no) }
      },
      {
        $lookup: {
          from: 'Stores',
          localField: 'store_no',
          foreignField: 'store_no',
          as: 'store'
        }
      },
      {
        $unwind: '$store'
      },
      {
        $project: {
          store_product_ID: 1,
          product_no: 1,
          store_no: 1,
          qty: 1,
          created_at: 1,
          updated_at: 1,
          store_name: '$store.store_name'
        }
      },
      {
        $sort: { store_name: 1 }
      }
    ]).toArray();

  return storeProducts;
}

module.exports = {
  insertStoreProduct,
  getAllStoreProducts,
  getStoreProductById,
  updateStoreProduct,
  deleteStoreProduct,
  getStoreProductsByStore,
  getStoreProductsByProduct
}; 
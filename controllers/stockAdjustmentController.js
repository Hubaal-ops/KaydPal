const connectDB = require('../db');
const StoreProduct = require('../models/StoreProduct');
const Product = require('../models/Product');
const Store = require('../models/Store');
const getNextSequence = require('../getNextSequence');
const { recalculateProductBalance, recalculateStoreTotal } = require('./storeProductController');

async function getNextSequenceValue(sequenceName) {
  // Use shared getNextSequence
  return await getNextSequence(sequenceName);
}

async function insertStockAdjustment(adjustmentData) {
  const db = await connectDB();
  const {
    product_no,
    store_no,
    qty,
    adj_type,
    adj_desc
  } = adjustmentData;

  // Basic validations
  if (qty <= 0) {
    throw new Error('Adjustment quantity must be greater than 0');
  }
  if (!['add', 'subtract'].includes(adj_type.toLowerCase())) {
    throw new Error('Adjustment type must be either "add" or "subtract"');
  }

  // Validate product exists
  console.log('DEBUG: Looking for product_no:', product_no, typeof product_no);
  const product = await Product.findOne({ product_no });
  if (!product) throw new Error('Product not found');
  // Validate store exists
  const store = await Store.findOne({ store_no });
  if (!store) throw new Error('Store not found');

  // For subtract, validate sufficient stock exists
  if (adj_type.toLowerCase() === 'subtract') {
    const storeProduct = await StoreProduct.findOne({ product_no, store_no });
    if (!storeProduct) throw new Error('Product not found in this store');
    if (storeProduct.qty < qty) throw new Error(`Insufficient stock. Current stock: ${storeProduct.qty}`);
  }

  // Get next adjustment number
  const adj_no = await getNextSequenceValue('stock_adjustment');

  // Create adjustment record
  const newAdjustment = {
    adj_no,
    product_no,
    store_no,
    qty,
    adj_type: adj_type.toLowerCase(),
    adj_desc,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    // Insert adjustment record
    await db.collection('Stock_Adjustments').insertOne(newAdjustment);

    // Update StoreProduct model
    let storeProduct = await StoreProduct.findOne({ product_no, store_no });
    if (!storeProduct) {
      const store_product_no = await getNextSequence('store_product_no');
      await StoreProduct.create({
        store_product_no,
        product_no,
        store_no,
        qty: adj_type.toLowerCase() === 'add' ? qty : 0,
        created_at: new Date(),
        updated_at: new Date()
      });
    } else {
      await StoreProduct.updateOne(
        { product_no, store_no },
        { $inc: { qty: adj_type.toLowerCase() === 'add' ? qty : -qty }, $set: { updated_at: new Date() } }
      );
    }

    // Recalculate product and store summaries
    await recalculateProductBalance(product_no);
    await recalculateStoreTotal(store_no);

    return {
      message: 'Stock adjustment processed successfully',
      adj_no
    };
  } catch (error) {
    // If any operation fails, try to clean up
    try {
      await db.collection('Stock_Adjustments').deleteOne({ adj_no });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    throw error;
  }
}

async function getAllStockAdjustments() {
  const db = await connectDB();
  const adjustments = await db.collection('Stock_Adjustments').find({}).sort({ created_at: -1 }).toArray();
  return adjustments;
}

module.exports = { insertStockAdjustment, getAllStockAdjustments }; 
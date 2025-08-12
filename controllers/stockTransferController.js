const connectDB = require('../db');
const StockTransfer = require('../models/StockTransfer');
const StoreProduct = require('../models/StoreProduct');
const Product = require('../models/Product');
const Store = require('../models/Store');
const getNextSequence = require('../getNextSequence');
const { recalculateProductBalance, recalculateStoreTotal } = require('./storeProductController');

async function getNextSequenceValue(sequenceName) {
  return await getNextSequence(sequenceName);
}

async function insertStockTransfer(transferData) {
  const {
    from_store,
    to_store,
    product_no,
    qty,
    transfer_desc,
    userId // allow passing userId explicitly for multi-tenancy
  } = transferData;

  // Basic validations
  if (from_store === to_store) {
    throw new Error('Cannot transfer to the same store');
  }
  if (qty <= 0) {
    throw new Error('Transfer quantity must be greater than 0');
  }

  // Validate stores exist
  const fromStore = await Store.findOne({ store_no: from_store });
  if (!fromStore) throw new Error('Source store not found');
  const toStore = await Store.findOne({ store_no: to_store });
  if (!toStore) throw new Error('Destination store not found');

  // Validate product exists
  const product = await Product.findOne({ product_no });
  if (!product) throw new Error('Product not found');

  // Check if source store has enough stock
  const fromStoreProduct = await StoreProduct.findOne({ product_no, store_no: from_store });
  if (!fromStoreProduct) throw new Error('Product not found in source store');
  if (fromStoreProduct.qty < qty) throw new Error('Insufficient stock in source store');

  // Get next transfer_id
  const transfer_id = await getNextSequenceValue('stock_transfers');

  // Create transfer record
  const newTransfer = new StockTransfer({
    transfer_id,
    from_store,
    to_store,
    product_no,
    qty,
    transfer_desc,
    status: 'completed',
    created_at: new Date(),
    updated_at: new Date(),
    userId // set userId for multi-tenancy
  });

  try {
    await newTransfer.save();

    // Update source store stock
    await StoreProduct.updateOne(
      { product_no, store_no: from_store },
      { $inc: { qty: -qty }, $set: { updated_at: new Date() } }
    );

    // Update source store total items
    await Store.updateOne(
      { store_no: from_store },
      { $inc: { total_items: -qty } }
    );

    // Update/Create destination store product
    let toStoreProduct = await StoreProduct.findOne({ product_no, store_no: to_store });
    if (!toStoreProduct) {
      const store_product_no = await getNextSequence('store_product_no');
      await StoreProduct.create({
        store_product_no,
        product_no,
        store_no: to_store,
        qty,
        created_at: new Date(),
        updated_at: new Date()
      });
    } else {
      await StoreProduct.updateOne(
        { product_no, store_no: to_store },
        { $inc: { qty }, $set: { updated_at: new Date() } }
      );
    }

    // Update destination store total items
    await Store.updateOne(
      { store_no: to_store },
      { $inc: { total_items: qty } }
    );

    // Recalculate product and store summaries
    await recalculateProductBalance(product_no);
    await recalculateStoreTotal(from_store);
    await recalculateStoreTotal(to_store);

    return {
      message: 'Stock transfer completed successfully',
      transfer_id
    };
  } catch (error) {
    // If any operation fails, try to clean up
    try {
      await StockTransfer.deleteOne({ transfer_id });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    throw error;
  }
}

async function getAllStockTransfers() {
  const StockTransfer = require('../models/StockTransfer');
  const Product = require('../models/Product');
  const Store = require('../models/Store');
  // Only return transfers for the authenticated user
  const userId = arguments[0]?.userId || (typeof arguments[0] === 'object' && arguments[0]?.req?.user?.id);
  const filter = userId ? { userId } : {};
  const transfers = await StockTransfer.find(filter).sort({ created_at: -1 });
  const products = await Product.find();
  const stores = await Store.find();
  const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
  const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
  return transfers.map(tr => ({
    ...tr.toObject(),
    product_name: productMap[tr.product_no] || '',
    from_store_name: storeMap[tr.from_store] || '',
    to_store_name: storeMap[tr.to_store] || ''
  }));
}

module.exports = { insertStockTransfer, getAllStockTransfers }; 
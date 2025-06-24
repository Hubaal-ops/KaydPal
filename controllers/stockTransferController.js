const connectDB = require('../db');

async function getNextSequenceValue(sequenceName) {
  const db = await connectDB();
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return result.value ? result.value.seq : result.seq;
}

async function insertStockTransfer(transferData) {
  const db = await connectDB();
  
  const {
    from_store,
    to_store,
    pro_no,
    qty,
    transfer_desc
  } = transferData;

  // Basic validations
  if (from_store === to_store) {
    throw new Error('Cannot transfer to the same store');
  }
  if (qty <= 0) {
    throw new Error('Transfer quantity must be greater than 0');
  }

  // Validate stores exist
  const fromStore = await db.collection('Stores').findOne({ store_no: from_store });
  if (!fromStore) {
    throw new Error('Source store not found');
  }

  const toStore = await db.collection('Stores').findOne({ store_no: to_store });
  if (!toStore) {
    throw new Error('Destination store not found');
  }

  // Validate product exists
  const product = await db.collection('Products').findOne({ product_no: pro_no });
  if (!product) {
    throw new Error('Product not found');
  }

  // Check if source store has enough stock
  const fromStoreProduct = await db.collection('Stores_Product').findOne({
    pro_no,
    store_no: from_store
  });

  if (!fromStoreProduct) {
    throw new Error('Product not found in source store');
  }

  if (fromStoreProduct.qty < qty) {
    throw new Error('Insufficient stock in source store');
  }

  // Get next transfer_id
  const transfer_id = await getNextSequenceValue('stock_transfers');

  // Create transfer record
  const newTransfer = {
    transfer_id,
    from_store,
    to_store,
    pro_no,
    qty,
    status: 'pending',
    transfer_desc,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    // Insert transfer record
    await db.collection('Stock_Transfers').insertOne(newTransfer);

    // Update source store stock
    await db.collection('Stores_Product').updateOne(
      { pro_no, store_no: from_store },
      { 
        $inc: { qty: -qty },
        $set: { updated_at: new Date() }
      }
    );

    // Update source store total items
    await db.collection('Stores').updateOne(
      { store_no: from_store },
      { $inc: { total_items: -qty } }
    );

    // Check if product exists in destination store
    const toStoreProduct = await db.collection('Stores_Product').findOne({
      pro_no,
      store_no: to_store
    });

    if (toStoreProduct) {
      // Update existing product in destination store
      await db.collection('Stores_Product').updateOne(
        { pro_no, store_no: to_store },
        { 
          $inc: { qty: qty },
          $set: { updated_at: new Date() }
        }
      );
    } else {
      // Create new product record in destination store
      await db.collection('Stores_Product').insertOne({
        pro_no,
        store_no: to_store,
        qty,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Update destination store total items
    await db.collection('Stores').updateOne(
      { store_no: to_store },
      { $inc: { total_items: qty } }
    );

    // Update transfer status to completed
    await db.collection('Stock_Transfers').updateOne(
      { transfer_id },
      { 
        $set: { 
          status: 'completed',
          updated_at: new Date()
        }
      }
    );

    return {
      message: 'Stock transfer completed successfully',
      transfer_id,
      from_store: {
        store_no: from_store,
        remaining_qty: fromStoreProduct.qty - qty
      },
      to_store: {
        store_no: to_store,
        new_qty: toStoreProduct ? toStoreProduct.qty + qty : qty
      }
    };

  } catch (error) {
    // If any operation fails, try to clean up
    try {
      await db.collection('Stock_Transfers').deleteOne({ transfer_id });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    throw error;
  }
}

module.exports = { insertStockTransfer }; 
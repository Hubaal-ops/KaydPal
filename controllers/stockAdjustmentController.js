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

async function insertStockAdjustment(adjustmentData) {
  const db = await connectDB();
  
  const {
    pro_no,
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
  const product = await db.collection('Products').findOne({ product_no: pro_no });
  if (!product) {
    throw new Error('Product not found');
  }

  // Validate store exists
  const store = await db.collection('Stores').findOne({ store_no });
  if (!store) {
    throw new Error('Store not found');
  }

  // For subtract operations, validate sufficient stock exists
  if (adj_type.toLowerCase() === 'subtract') {
    const storeProduct = await db.collection('Stores_Product').findOne({
      pro_no,
      store_no
    });

    if (!storeProduct) {
      throw new Error('Product not found in this store');
    }

    if (storeProduct.qty < qty) {
      throw new Error(`Insufficient stock. Current stock: ${storeProduct.qty}`);
    }
  }

  // Get next adjustment number
  const adj_no = await getNextSequenceValue('stock_adjustment');

  // Create adjustment record
  const newAdjustment = {
    adj_no,
    pro_no,
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

    // Update Products collection
    await db.collection('Products').updateOne(
      { product_no: pro_no },
      { 
        $inc: { 
          storing_balance: adj_type.toLowerCase() === 'add' ? qty : -qty 
        }
      }
    );

    // Update Stores_Product collection
    if (adj_type.toLowerCase() === 'add') {
      await db.collection('Stores_Product').updateOne(
        { pro_no, store_no },
        { 
          $inc: { qty },
          $set: { updated_at: new Date() }
        },
        { upsert: true }
      );
    } else {
      await db.collection('Stores_Product').updateOne(
        { pro_no, store_no },
        { 
          $inc: { qty: -qty },
          $set: { updated_at: new Date() }
        }
      );
    }

    // Update Stores collection
    await db.collection('Stores').updateOne(
      { store_no },
      { 
        $inc: { 
          total_items: adj_type.toLowerCase() === 'add' ? qty : -qty 
        }
      }
    );

    return {
      message: 'Stock adjustment processed successfully',
      adj_no,
      product: {
        product_no: pro_no,
        new_storing_balance: product.storing_balance + (adj_type.toLowerCase() === 'add' ? qty : -qty)
      },
      store: {
        store_no,
        new_total_items: store.total_items + (adj_type.toLowerCase() === 'add' ? qty : -qty)
      }
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

module.exports = { insertStockAdjustment }; 
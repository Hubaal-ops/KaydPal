const connectDB = require('../db');

async function insertPurchaseReturn(returnData) {
  const db = await connectDB();

  const {
    pur_no,
    sup_no,
    pro_no,
    store_no,
    qty,
    price,
    amount,
    paid,
    reason,
    return_date = new Date()
  } = returnData;

  try {
    // 1. Validate the original purchase exists
    const originalPurchase = await db.collection('Purchases').findOne({ purchase_no: pur_no });
    if (!originalPurchase) {
      throw new Error('❌ Original purchase not found');
    }

    // 2. Validate return quantity doesn't exceed original purchase
    if (qty > originalPurchase.qty) {
      throw new Error('❌ Return quantity cannot exceed original purchase quantity');
    }

    // 3. Validate the product, supplier, and store exist
    const [product, supplier, store] = await Promise.all([
      db.collection('Products').findOne({ product_no: pro_no }),
      db.collection('Suppliers').findOne({ supplier_no: sup_no }),
      db.collection('Stores').findOne({ store_no })
    ]);

    if (!product) throw new Error('❌ Product not found');
    if (!supplier) throw new Error('❌ Supplier not found');
    if (!store) throw new Error('❌ Store not found');

    // 4. Calculate amounts
    const returnAmount = qty * price;
    if (amount !== returnAmount) {
      throw new Error('❌ Return amount does not match quantity * price');
    }

    // 5. Get supplier's current balance
    const supplierBalance = supplier.bal || 0;

    // 6. Calculate how much to refund to account
    let refundToAccount = paid;
    let debtReduction = 0;

    if (supplierBalance > 0) {
      // If supplier owes money, reduce their debt first
      debtReduction = Math.min(supplierBalance, returnAmount);
      refundToAccount = Math.max(0, paid - debtReduction);
    }

    // 7. Insert the return record
    const returnDoc = {
      pur_no,
      sup_no,
      pro_no,
      store_no,
      qty,
      price,
      amount: returnAmount,
      paid,
      reason,
      return_date,
      debt_reduction: debtReduction,
      refund_to_account: refundToAccount,
      created_at: new Date()
    };

    await db.collection('PurchaseReturns').insertOne(returnDoc);

    // 8. Update inventory and balances
    await Promise.all([
      // Update Products
      db.collection('Products').updateOne(
        { product_no: pro_no },
        { $inc: { storing_balance: -qty } }
      ),

      // Update Stores
      db.collection('Stores').updateOne(
        { store_no },
        { $inc: { total_items: -qty } }
      ),

      // Update Stores_Product
      db.collection('Stores_Product').updateOne(
        { pro_no, store_no },
        { $inc: { qty: -qty } }
      ),

      // Update Supplier balance if there's debt reduction
      debtReduction > 0 ? db.collection('Suppliers').updateOne(
        { supplier_no: sup_no },
        { $inc: { bal: -debtReduction } }
      ) : Promise.resolve(),

      // Refund to account if applicable
      refundToAccount > 0 ? db.collection('Accounts').updateOne(
        { account_id: originalPurchase.account_id },
        { $inc: { balance: refundToAccount } }
      ) : Promise.resolve()
    ]);

    return {
      message: '✅ Purchase return processed successfully',
      return_id: returnDoc._id,
      debt_reduction: debtReduction,
      refund_to_account: refundToAccount
    };

  } catch (err) {
    throw new Error(`❌ Error processing purchase return: ${err.message}`);
  }
}

module.exports = {
  insertPurchaseReturn
}; 
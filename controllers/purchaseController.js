const mongoose = require('mongoose');
const connectDB = require('../db');
const Purchase = require('../models/Purchase');
const StoreProduct = require('../models/StoreProduct');
const recalculateProductBalance = require('./storeProductController').recalculateProductBalance;
const recalculateStoreTotal = require('./storeProductController').recalculateStoreTotal;
const getNextSequence = require('../getNextSequence');

// 🔧 Fix for getNextSequence function

// 🔁 Insert Purchase
async function insertPurchase(purchase, userId) {
  const db = await connectDB();

  // Convert all inputs to Number to avoid type mismatches
  const product_no = Number(purchase.product_no);
  const supplier_no = Number(purchase.supplier_no);
  const store_no = Number(purchase.store_no);
  const account_id = Number(purchase.account_id);
  const qty = Number(purchase.qty);
  const price = Number(purchase.price);
  const discount = Number(purchase.discount || 0);
  const tax = Number(purchase.tax || 0);
  const paid = Number(purchase.paid || 0);

  // Validate required fields
  if (qty <= 0 || price <= 0) throw new Error('❌ Invalid quantity or price.');

  // Check account balance before proceeding
  const { ObjectId } = require('mongodb');
  let userObjectId = userId;
  if (typeof userId === 'string' && userId.length === 24) {
    try {
      userObjectId = new ObjectId(userId);
    } catch (e) {}
  }
  const account = await db.collection('accounts').findOne({ account_id, userId: userObjectId });
  if (!account) throw new Error('Account not found.');
  if (paid > 0 && account.balance < paid) {
    throw new Error('Insufficient account balance for this purchase.');
  }

  const amount = qty * price - discount + tax;
  if (paid > amount) throw new Error('❌ Paid amount exceeds total.');

  // Get next numeric purchase_id
  const purchase_id = await getNextSequence('purchase_id');
  if (!purchase_id) throw new Error('❌ Failed to get a valid purchase ID.');
  // Keep purchase_no for display
  const sequence = await getNextSequence('purchase_no');
  const purchase_no = `PUR-${String(sequence).padStart(5, '0')}`;

  // Create purchase document using mongoose model
  await Purchase.create({
    purchase_id, purchase_no, product_no, supplier_no, store_no,
    qty, price, discount, tax,
    amount, paid, account_id,
    created_at: new Date(),
    userId
  });

  // Update StoreProduct using mongoose model
  let storeProduct = await StoreProduct.findOne({ product_no, store_no });
  if (!storeProduct) {
    const store_product_no = await getNextSequence('store_product_no');
    storeProduct = new StoreProduct({
      store_product_no,
      product_no,
      store_no,
      qty,
      userId: userObjectId,
      created_at: new Date(),
      updated_at: new Date()
    });
    await storeProduct.save();
  } else {
    storeProduct.qty = (storeProduct.qty || 0) + qty;
    storeProduct.updated_at = new Date();
    await storeProduct.save();
  }

  // Update product's storing_balance
  await db.collection('products').updateOne(
    { product_no },
    [
      {
        $set: {
          storing_balance: {
            $add: [
              { $toDouble: { $ifNull: ["$storing_balance", 0] } },
              qty
            ]
          }
        }
      }
    ]
  );

  // Update store's total_items
  await db.collection('stores').updateOne(
    { store_no },
    { $inc: { total_items: qty } }
  );
  await recalculateProductBalance(product_no);
  await recalculateStoreTotal(store_no);

  const debt = amount - paid;

  if (debt > 0) {
    await db.collection('suppliers').updateOne(
      { supplier_no },
      { $inc: { bal: debt } }
    );
  } else {
    // Haddii la bixiyay lacagta oo dhan, bal waa in la set-gareeyaa 0
    await db.collection('suppliers').updateOne(
      { supplier_no },
      { $set: { bal: 0 } }
    );
  }

  if (paid > 0) {
    const result = await db.collection('accounts').updateOne(
      { account_id },
      { $inc: { balance: -paid } }
    );
    if (result.matchedCount === 0) {
      throw new Error('Account not found or balance not updated.');
    }
  }

  return { message: '✅ Purchase inserted successfully.', purchase_no };
}

// 🔄 Update Purchase
async function updatePurchase(purchase_no, updated) {
  const db = await connectDB();

  // Find old purchase
  const oldPurchase = await Purchase.findOne({ purchase_no });
  if (!oldPurchase) throw new Error('❌ Purchase not found.');

  // Merge old and new data
  const {
    product_no = oldPurchase.product_no,
    supplier_no = oldPurchase.supplier_no,
    store_no = oldPurchase.store_no,
    qty = oldPurchase.qty,
    price = oldPurchase.price,
    discount = oldPurchase.discount,
    tax = oldPurchase.tax,
    paid = oldPurchase.paid,
    account_id = oldPurchase.account_id
  } = { ...oldPurchase.toObject(), ...updated };

  // Validate qty and price
  if (qty <= 0 || price <= 0) throw new Error('❌ Invalid quantity or price.');

  // Calculate new amount
  const newAmount = (qty * price) - discount + tax;

  if (paid > newAmount) throw new Error('❌ Paid amount exceeds total.');

  // Calculate old amount and debt
  const oldAmount = oldPurchase.qty * oldPurchase.price - oldPurchase.discount + oldPurchase.tax;
  const oldDebt = oldAmount - oldPurchase.paid;

  // Reverse old inventory and balances
  await Promise.all([
    db.collection('Stores_Product').updateOne(
      { pro_no: oldPurchase.product_no, store_no: oldPurchase.store_no },
      { $inc: { qty: -oldPurchase.qty }, $set: { updated_at: new Date() } }
    ),
    db.collection('products').updateOne(
      { product_no: oldPurchase.product_no },
      [
        {
          $set: {
            storing_balance: {
              $subtract: [
                { $toDouble: { $ifNull: ["$storing_balance", 0] } },
                oldPurchase.qty
              ]
            }
          }
        }
      ]
    ),
    db.collection('stores').updateOne(
      { store_no: oldPurchase.store_no },
      { $inc: { total_items: -oldPurchase.qty } }
    ),
    db.collection('suppliers').updateOne(
      { supplier_no: oldPurchase.supplier_no },
      { $inc: { bal: -oldDebt } }
    ),
    db.collection('accounts').updateOne(
      { account_id: oldPurchase.account_id },
      { $inc: { balance: oldPurchase.paid } }
    )
  ]);

  // Update purchase document
  await Purchase.findOneAndUpdate(
    { purchase_no },
    {
      product_no,
      supplier_no,
      store_no,
      qty,
      price,
      discount,
      tax,
      amount: newAmount,
      paid,
      account_id,
      updated_at: new Date()
    }
  );

  // Update inventory and balances with new data
  const newDebt = newAmount - paid;

  await Promise.all([
    db.collection('Stores_Product').updateOne(
      { pro_no: product_no, store_no },
      { $inc: { qty }, $set: { updated_at: new Date() } },
      { upsert: true }
    ),
    db.collection('products').updateOne(
      { product_no },
      { $inc: { storing_balance: qty } }
    ),
    db.collection('stores').updateOne(
      { store_no },
      { $inc: { total_items: qty } }
    ),
    newDebt > 0
      ? db.collection('suppliers').updateOne({ supplier_no }, { $inc: { bal: newDebt } })
      : db.collection('suppliers').updateOne({ supplier_no }, { $set: { bal: 0 } }),
    paid > 0
      ? db.collection('accounts').updateOne({ account_id }, { $inc: { balance: -paid } })
      : Promise.resolve()
  ]);

  let storeProduct = await StoreProduct.findOne({ product_no, store_no });
  if (!storeProduct) {
    const store_product_no = await getNextSequence('store_product_no');
    await StoreProduct.create({
      store_product_no,
      product_no,
      store_no,
      qty,
      created_at: new Date(),
      updated_at: new Date()
    });
  } else {
    await StoreProduct.updateOne(
      { product_no, store_no },
      { $inc: { qty }, $set: { updated_at: new Date() } }
    );
  }
  await recalculateProductBalance(product_no);
  await recalculateStoreTotal(store_no);

  return { message: '✅ Purchase updated successfully.' };
}

module.exports = {
  insertPurchase,
  getAllPurchases: async (userId) => {
    const db = await connectDB();
    const purchases = await Purchase.find({ userId }).sort({ created_at: -1 });
    const productNos = [...new Set(purchases.map(p => p.product_no))];
    const supplierNos = [...new Set(purchases.map(p => p.supplier_no))];
    const storeNos = [...new Set(purchases.map(p => p.store_no))];
    const accountIds = [...new Set(purchases.map(p => p.account_id))];
    const [products, suppliers, stores, accounts] = await Promise.all([
      db.collection('products').find({ product_no: { $in: productNos } }).toArray(),
      db.collection('suppliers').find({ supplier_no: { $in: supplierNos } }).toArray(),
      db.collection('stores').find({ store_no: { $in: storeNos } }).toArray(),
      db.collection('accounts').find({ account_id: { $in: accountIds } }).toArray(),
    ]);
    const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
    const supplierMap = Object.fromEntries(suppliers.map(s => [s.supplier_no, s.name]));
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
    const accountMap = Object.fromEntries(accounts.map(a => [a.account_id, a.name || a.account_name || a.bank]));
    return purchases.map(purchase => ({
      ...purchase.toObject(),
      product_name: productMap[purchase.product_no] || '',
      supplier_name: supplierMap[purchase.supplier_no] || '',
      store_name: storeMap[purchase.store_no] || '',
      account_name: accountMap[purchase.account_id] || '',
    }));
  },
  updatePurchase,
  deletePurchase: async (purchase_no) => {
    const db = await connectDB();
    const oldPurchase = await Purchase.findOne({ purchase_no });
    if (!oldPurchase) throw new Error('❌ Purchase not found.');

    const oldAmount = oldPurchase.qty * oldPurchase.price - oldPurchase.discount + oldPurchase.tax;
    const oldDebt = oldAmount - oldPurchase.paid;

    await Promise.all([
      db.collection('Stores_Product').updateOne(
        { pro_no: oldPurchase.product_no, store_no: oldPurchase.store_no },
        { $inc: { qty: -oldPurchase.qty }, $set: { updated_at: new Date() } }
      ),
      db.collection('products').updateOne(
        { product_no: oldPurchase.product_no },
        { $inc: { storing_balance: -oldPurchase.qty } }
      ),
      db.collection('stores').updateOne(
        { store_no: oldPurchase.store_no },
        { $inc: { total_items: -oldPurchase.qty } }
      ),
      db.collection('suppliers').updateOne(
        { supplier_no: oldPurchase.supplier_no },
        { $inc: { bal: -oldDebt } }
      ),
      db.collection('accounts').updateOne(
        { account_id: oldPurchase.account_id },
        { $inc: { balance: oldPurchase.paid } }
      )
    ]);

    await Purchase.deleteOne({ purchase_no });
    await StoreProduct.updateOne(
      { product_no: oldPurchase.product_no, store_no: oldPurchase.store_no },
      { $inc: { qty: -oldPurchase.qty }, $set: { updated_at: new Date() } }
    );
    await recalculateProductBalance(oldPurchase.product_no);
    await recalculateStoreTotal(oldPurchase.store_no);

    return { message: '✅ Purchase deleted successfully.' };
  }
};

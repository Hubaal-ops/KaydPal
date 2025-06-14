const connectDB = require('../db');

// 🔧 Fix for getNextSequence function
async function getNextSequence(name) {
  console.log('Connecting to MongoDB...');
  console.log('Querying sequence:', name);

  const db = await connectDB();

  // Try with returnDocument: 'after' (MongoDB v4+)
  let result = await db.collection('Counters').findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    {
      returnDocument: 'after', // If you're using MongoDB v4+
      upsert: true
    }
  );

  // The result is the document directly, not wrapped in 'value'
  const document = result.value || result;

  if (!document || typeof document.seq !== 'number') {
    throw new Error(`❌ Sequence '${name}' not found or invalid.`);
  }

  return document.seq;
}

// 🔁 Insert Purchase
async function insertPurchase(purchase) {
  const db = await connectDB();

  const {
    product_no, supplier_no, store_no,
    qty, price, discount = 0, tax = 0,
    paid = 0, account_id
  } = purchase;

  if (qty <= 0 || price <= 0) throw new Error('❌ Invalid quantity or price.');

  const [product, supplier, store, account] = await Promise.all([
    db.collection('Products').findOne({ product_no }),
    db.collection('Suppliers').findOne({ supplier_no }),
    db.collection('Stores').findOne({ store_no }),
    db.collection('Accounts').findOne({ account_id })
  ]);

  if (!product) throw new Error('❌ Product not found.');
  if (!supplier) throw new Error('❌ Supplier not found.');
  if (!store) throw new Error('❌ Store not found.');
  if (!account) throw new Error('❌ Account not found.');

  const amount = qty * price - discount + tax;
  if (paid > amount) throw new Error('❌ Paid amount exceeds total.');

  const sequence = await getNextSequence('purchase_no');
  const purchase_no = `PUR-${String(sequence).padStart(5, '0')}`;

  await db.collection('Purchases').insertOne({
    purchase_no, product_no, supplier_no, store_no,
    qty, price, discount, tax,
    amount, paid, account_id,
    created_at: new Date()
  });

  await Promise.all([
    db.collection('Stores_Product').updateOne(
      { pro_no: product_no, store_no },
      { $inc: { qty }, $set: { updated_at: new Date() } },
      { upsert: true }
    ),
    db.collection('Products').updateOne(
      { product_no },
      { $inc: { storing_balance: qty } }
    ),
    db.collection('Stores').updateOne(
      { store_no },
      { $inc: { total_items: qty } }
    )
  ]);

  const debt = amount - paid;

  if (debt > 0) {
    await db.collection('Suppliers').updateOne(
      { supplier_no },
      { $inc: { bal: debt } }
    );
  }

  if (paid > 0) {
    await db.collection('Accounts').updateOne(
      { account_id },
      { $inc: { balance: -paid } }
    );
  }

  return { message: '✅ Purchase inserted successfully.', purchase_no };
}

// 🔁 Update Purchase
async function updatePurchase(purchase_no, updated) {
  const db = await connectDB();

  const oldPurchase = await db.collection('Purchases').findOne({purchase_no});
  if (!oldPurchase) throw new Error('❌ Purchase not found.');

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
  } = { ...oldPurchase, ...updated };

  if (qty <= 0 || price <= 0) throw new Error('❌ Invalid quantity or price.');

  const newAmount = qty * price - discount + tax;
  if (paid > newAmount) throw new Error('❌ Paid amount exceeds total.');

  const oldAmount = oldPurchase.qty * oldPurchase.price - oldPurchase.discount + oldPurchase.tax;
  const oldDebt = oldAmount - oldPurchase.paid;

  await Promise.all([
    db.collection('Stores_Product').updateOne(
      { pro_no: oldPurchase.product_no, store_no: oldPurchase.store_no },
      { $inc: { qty: -oldPurchase.qty }, $set: { updated_at: new Date() } }
    ),
    db.collection('Products').updateOne(
      { product_no: oldPurchase.product_no },
      { $inc: { storing_balance: -oldPurchase.qty } }
    ),
    db.collection('Stores').updateOne(
      { store_no: oldPurchase.store_no },
      { $inc: { total_items: -oldPurchase.qty } }
    ),
    db.collection('Suppliers').updateOne(
      { supplier_no: oldPurchase.supplier_no },
      { $inc: { bal: -oldDebt } }
    ),
    db.collection('Accounts').updateOne(
      { account_id: oldPurchase.account_id },
      { $inc: { balance: oldPurchase.paid } }
    )
  ]);

  await db.collection('Purchases').updateOne(
    { purchase_no },
    {
      $set: {
        product_no, supplier_no, store_no, qty, price, discount, tax,
        amount: newAmount, paid, account_id,
        updated_at: new Date()
      }
    }
  );

  const newDebt = newAmount - paid;

  await Promise.all([
    db.collection('Stores_Product').updateOne(
      { pro_no: product_no, store_no },
      { $inc: { qty }, $set: { updated_at: new Date() } },
      { upsert: true }
    ),
    db.collection('Products').updateOne(
      { product_no },
      { $inc: { storing_balance: qty } }
    ),
    db.collection('Stores').updateOne(
      { store_no },
      { $inc: { total_items: qty } }
    ),
    newDebt > 0
      ? db.collection('Suppliers').updateOne({ supplier_no }, { $inc: { bal: newDebt } })
      : Promise.resolve(),
    paid > 0
      ? db.collection('Accounts').updateOne({ account_id }, { $inc: { balance: -paid } })
      : Promise.resolve()
  ]);

  return { message: '✅ Purchase updated successfully.' };
}

module.exports = {
  insertPurchase,
  updatePurchase
};

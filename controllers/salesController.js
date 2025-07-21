const Sale = require('../models/Sale');
const connectDB = require('../db');
const StoreProduct = require('../models/StoreProduct');
const { recalculateProductBalance, recalculateStoreTotal } = require('./storeProductController');

async function getNextSequenceValue(sequenceName) {
  const db = await connectDB();
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  const document = result.value || result;
  return document.seq;
}

async function insertSale(sale) {
  const db = await connectDB();
  const {
    product_no, customer_no, store_no,
    qty, price, discount = 0, tax = 0,
    paid = 0, account_id,
  } = sale;

  // Convert all inputs to Number to avoid type mismatches
  const nQty = Number(qty);
  const nPrice = Number(price);
  const nDiscount = Number(discount || 0);
  const nTax = Number(tax || 0);
  const nPaid = Number(paid || 0);

  if (nQty <= 0) throw new Error('Sale quantity must be greater than 0.');
  if (nPrice <= 0) throw new Error('Sale price must be greater than 0.');
  const totalCost = nQty * nPrice - nDiscount + nTax;
  if (nPaid > totalCost) throw new Error('Paid amount cannot exceed total amount.');

  // Use correct field for product in stock check
  console.log('Checking stock for:', { pro_no: Number(product_no), store_no: Number(store_no) });
  const stock = await db.collection('Stores_Product').findOne({ pro_no: Number(product_no), store_no: Number(store_no) });
  console.log('Stock found:', stock);
  if (!stock || stock.qty < nQty) throw new Error('Insufficient stock for this product in the selected store.');

  // Get next sel_no
  const sel_no = await getNextSequenceValue('sales');
  const newSale = {
    ...sale,
    qty: nQty,
    price: nPrice,
    discount: nDiscount,
    tax: nTax,
    amount: totalCost,
    paid: nPaid,
    sel_no,
    sel_date: new Date()
  };

  // Use Mongoose model to create the sale
  await Sale.create(newSale);

  // Update legacy collection
  await db.collection('Stores_Product').updateOne(
    { pro_no: Number(product_no), store_no: Number(store_no) },
    { $inc: { qty: -nQty }, $set: { updated_at: new Date() } }
  );
  // Update StoreProduct model
  let storeProduct = await StoreProduct.findOne({ product_no: Number(product_no), store_no: Number(store_no) });
  if (!storeProduct) {
    const getNextSequence = require('../getNextSequence');
    const store_product_no = await getNextSequence('store_product_no');
    await StoreProduct.create({
      store_product_no,
      product_no: Number(product_no),
      store_no: Number(store_no),
      qty: -nQty,
      created_at: new Date(),
      updated_at: new Date()
    });
  } else {
    await StoreProduct.updateOne(
      { product_no: Number(product_no), store_no: Number(store_no) },
      { $inc: { qty: -nQty }, $set: { updated_at: new Date() } }
    );
  }
  await recalculateProductBalance(Number(product_no));
  await recalculateStoreTotal(Number(store_no));

  await db.collection('products').updateOne(
    { product_no: Number(product_no) },
    { $inc: { storing_balance: -nQty } }
  );
  await db.collection('stores').updateOne(
    { store_no: Number(store_no) },
    { $inc: { total_items: -nQty } }
  );
  const debt = totalCost - nPaid;
  if (debt > 0) {
    await db.collection('customers').updateOne(
      { customer_no: Number(customer_no) },
      { $inc: { bal: debt } }
    );
  }
  if (nPaid > 0) {
    await db.collection('accounts').updateOne(
      { account_id: Number(account_id) },
      { $inc: { balance: nPaid } }
    );
  }
  return { message: 'Sale inserted successfully', sel_no };
}

async function updateSale(sel_no, updatedSale) {
  const db = await connectDB();
  const oldSale = await Sale.findOne({ sel_no });
  if (!oldSale) throw new Error('Sale not found.');
  const {
    product_no = oldSale.product_no,
    customer_no = oldSale.customer_no,
    store_no = oldSale.store_no,
    qty = oldSale.qty,
    price = oldSale.price,
    discount = oldSale.discount,
    tax = oldSale.tax,
    paid = oldSale.paid,
    account_id = oldSale.account_id
  } = { ...oldSale.toObject(), ...updatedSale };

  // Convert all inputs to Number to avoid type mismatches
  const nQty = Number(qty);
  const nPrice = Number(price);
  const nDiscount = Number(discount || 0);
  const nTax = Number(tax || 0);
  const nPaid = Number(paid || 0);

  if (nQty <= 0) throw new Error('Sale quantity must be greater than 0.');
  if (nPrice <= 0) throw new Error('Price cannot be negative.');
  const newAmount = nQty * nPrice - nDiscount + nTax;
  if (nPaid > newAmount) throw new Error('Paid amount cannot exceed total amount.');

  if (nQty > oldSale.qty) {
    console.log('Checking stock for update:', { pro_no: Number(product_no), store_no: Number(store_no) });
    const stock = await db.collection('Stores_Product').findOne({ pro_no: Number(product_no), store_no: Number(store_no) });
    console.log('Stock found for update:', stock);
    if (!stock || stock.qty < (nQty - oldSale.qty)) {
      throw new Error('Not enough stock to increase sale quantity.');
    }
  }
  const oldDebt = oldSale.amount - oldSale.paid;
  await db.collection('Stores_Product').updateOne(
    { pro_no: Number(oldSale.product_no), store_no: Number(oldSale.store_no) },
    { $inc: { qty: oldSale.qty }, $set: { updated_at: new Date() } }
  );
  await recalculateProductBalance(Number(oldSale.product_no));
  await recalculateStoreTotal(Number(oldSale.store_no));

  await db.collection('products').updateOne(
    { product_no: Number(oldSale.product_no) },
    { $inc: { storing_balance: oldSale.qty } }
  );
  await db.collection('stores').updateOne(
    { store_no: Number(oldSale.store_no) },
    { $inc: { total_items: oldSale.qty } }
  );
  await db.collection('customers').updateOne(
    { customer_no: Number(oldSale.customer_no) },
    { $inc: { bal: -oldDebt } }
  );
  await db.collection('accounts').updateOne(
    { account_id: Number(oldSale.account_id) },
    { $inc: { balance: -oldSale.paid } }
  );
  const newDebt = newAmount - nPaid;
  await db.collection('Stores_Product').updateOne(
    { pro_no: Number(product_no), store_no: Number(store_no) },
    { $inc: { qty: -nQty }, $set: { updated_at: new Date() } }
  );
  await recalculateProductBalance(Number(product_no));
  await recalculateStoreTotal(Number(store_no));

  if (newDebt > 0) {
    await db.collection('customers').updateOne(
      { customer_no: Number(customer_no) },
      { $inc: { bal: newDebt } }
    );
  }
  if (nPaid > 0) {
    await db.collection('accounts').updateOne(
      { account_id: Number(account_id) },
      { $inc: { balance: nPaid } }
    );
  }
  await Sale.findOneAndUpdate(
    { sel_no },
    {
      product_no,
      customer_no,
      store_no,
      qty: nQty,
      price: nPrice,
      discount: nDiscount,
      tax: nTax,
      amount: newAmount,
      paid: nPaid,
      account_id,
      updated_at: new Date()
    }
  );
  return { message: 'Sale updated successfully' };
}

async function deleteSale(sel_no) {
  const db = await connectDB();
  const oldSale = await Sale.findOne({ sel_no });
  if (!oldSale) throw new Error('Sale not found.');
  const unpaid = oldSale.amount - oldSale.paid;
  // Reverse inventory in StoreProduct
  await StoreProduct.updateOne(
    { product_no: Number(oldSale.product_no), store_no: Number(oldSale.store_no) },
    { $inc: { qty: oldSale.qty }, $set: { updated_at: new Date() } }
  );
  await recalculateProductBalance(Number(oldSale.product_no));
  await recalculateStoreTotal(Number(oldSale.store_no));

  await db.collection('products').updateOne(
    { product_no: Number(oldSale.product_no) },
    { $inc: { storing_balance: oldSale.qty } }
  );
  await db.collection('stores').updateOne(
    { store_no: Number(oldSale.store_no) },
    { $inc: { total_items: oldSale.qty } }
  );
  if (unpaid > 0) {
    await db.collection('customers').updateOne(
      { customer_no: Number(oldSale.customer_no) },
      { $inc: { bal: -unpaid } }
    );
  }
  if (oldSale.paid > 0) {
    await db.collection('accounts').updateOne(
      { account_id: Number(oldSale.account_id) },
      { $inc: { balance: -oldSale.paid } }
    );
  }
  await Sale.deleteOne({ sel_no });
  return { message: 'Sale deleted successfully' };
}

async function getAllSales(req, res) {
  try {
    // Use Mongoose to get all sales
    const sales = await Sale.find().sort({ sel_date: -1 });
    // Fetch all related data in bulk for efficiency
    const db = await connectDB();
    const productNos = [...new Set(sales.map(s => s.product_no))];
    const customerNos = [...new Set(sales.map(s => s.customer_no))];
    const storeNos = [...new Set(sales.map(s => s.store_no))];
    const accountIds = [...new Set(sales.map(s => s.account_id))];
    const [products, customers, stores, accounts] = await Promise.all([
      db.collection('products').find({ product_no: { $in: productNos } }).toArray(),
      db.collection('customers').find({ customer_no: { $in: customerNos } }).toArray(),
      db.collection('stores').find({ store_no: { $in: storeNos } }).toArray(),
      db.collection('accounts').find({ account_id: { $in: accountIds } }).toArray(),
    ]);
    const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
    const customerMap = Object.fromEntries(customers.map(c => [c.customer_no, c.name]));
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
    const accountMap = Object.fromEntries(accounts.map(a => [a.account_id, a.name]));
    const salesWithNames = sales.map(sale => ({
      ...sale.toObject(),
      product_name: productMap[sale.product_no] || '',
      customer_name: customerMap[sale.customer_no] || '',
      store_name: storeMap[sale.store_no] || '',
      account_name: accountMap[sale.account_id] || '',
    }));
    res.json(salesWithNames);
    console.log('API /api/sales returning:', salesWithNames);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
}

module.exports = { insertSale, updateSale, deleteSale, getAllSales };

const Sale = require('../models/Sale');
const connectDB = require('../db');

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
    amount, paid = 0, account_id,
  } = sale;

  if (qty <= 0) throw new Error('Sale quantity must be greater than 0.');
  if (price <= 0) throw new Error('Sale price must be greater than 0.');
  const totalCost = qty * price - discount + tax;
  if (amount !== totalCost) throw new Error('Amount does not match calculation.');
  if (paid > amount) throw new Error('Paid amount cannot exceed total amount.');

  const stock = await db.collection('Stores_Product').findOne({ product_no, store_no });
  if (!stock || stock.qty < qty) throw new Error('Insufficient stock for this product in the selected store.');

  // Get next sel_no
  const sel_no = await getNextSequenceValue('sales');
  const newSale = { ...sale, sel_no, sel_date: new Date() };

  // Use Mongoose model to create the sale
  await Sale.create(newSale);

  await db.collection('Stores_Product').updateOne(
    { product_no, store_no },
    { $inc: { qty: -qty }, $set: { updated_at: new Date() } }
  );
  await db.collection('Products').updateOne(
    { product_no },
    { $inc: { storing_balance: -qty } }
  );
  await db.collection('Stores').updateOne(
    { store_no },
    { $inc: { total_items: -qty } }
  );
  const debt = totalCost - paid;
  if (debt > 0) {
    await db.collection('Customers').updateOne(
      { customer_no },
      { $inc: { bal: debt } }
    );
  }
  if (paid > 0) {
    await db.collection('Accounts').updateOne(
      { account_id },
      { $inc: { balance: paid } }
    );
  }
  return { message: 'Sale inserted successfully', sel_no };
}

async function updateSale(sel_no, updatedSale) {
  const db = await connectDB();
  const oldSale = await Sale.findOne({ sel_no });
  if (!oldSale) throw new Error('Sale not found.');
  const {
    product_no, customer_no, store_no,
    qty, price, discount = 0, tax = 0,
    amount, paid = 0, account_id,
  } = updatedSale;
  if (qty <= 0) throw new Error('Sale quantity must be greater than 0.');
  if (price <= 0) throw new Error('Price cannot be negative.');
  if (amount <= 0) throw new Error('Amount cannot be negative.');
  if (paid < 0) throw new Error('Paid amount cannot be negative.');
  if (paid > amount) throw new Error('Paid amount cannot exceed total amount.');
  if (qty > oldSale.qty) {
    const stock = await db.collection('Stores_Product').findOne({ product_no, store_no });
    if (!stock || stock.qty < (qty - oldSale.qty)) {
      throw new Error('Not enough stock to increase sale quantity.');
    }
  }
  const oldDebt = oldSale.amount - oldSale.paid;
  await db.collection('Stores_Product').updateOne(
    { product_no: oldSale.product_no, store_no: oldSale.store_no },
    { $inc: { qty: oldSale.qty }, $set: { updated_at: new Date() } }
  );
  await db.collection('Products').updateOne(
    { product_no: oldSale.product_no },
    { $inc: { storing_balance: oldSale.qty } }
  );
  await db.collection('Stores').updateOne(
    { store_no: oldSale.store_no },
    { $inc: { total_items: oldSale.qty } }
  );
  await db.collection('Customers').updateOne(
    { customer_no: oldSale.customer_no },
    { $inc: { bal: -oldDebt } }
  );
  await db.collection('Accounts').updateOne(
    { account_id: oldSale.account_id },
    { $inc: { balance: -oldSale.paid } }
  );
  const newDebt = amount - paid;
  await db.collection('Stores_Product').updateOne(
    { product_no, store_no },
    { $inc: { qty: -qty }, $set: { updated_at: new Date() } }
  );
  await db.collection('Products').updateOne(
    { product_no },
    { $inc: { storing_balance: -qty } }
  );
  await db.collection('Stores').updateOne(
    { store_no },
    { $inc: { total_items: -qty } }
  );
  if (newDebt > 0) {
    await db.collection('Customers').updateOne(
      { customer_no },
      { $inc: { bal: newDebt } }
    );
  }
  if (paid > 0) {
    await db.collection('Accounts').updateOne(
      { account_id },
      { $inc: { balance: paid } }
    );
  }
  await Sale.findOneAndUpdate({ sel_no }, updatedSale);
  return { message: 'Sale updated successfully' };
}

async function deleteSale(sel_no) {
  const db = await connectDB();
  const oldSale = await Sale.findOne({ sel_no });
  if (!oldSale) throw new Error('Sale not found.');
  const unpaid = oldSale.amount - oldSale.paid;
  await db.collection('Stores_Product').updateOne(
    { product_no: oldSale.product_no, store_no: oldSale.store_no },
    { $inc: { qty: oldSale.qty }, $set: { updated_at: new Date() } }
  );
  await db.collection('Products').updateOne(
    { product_no: oldSale.product_no },
    { $inc: { storing_balance: oldSale.qty } }
  );
  await db.collection('Stores').updateOne(
    { store_no: oldSale.store_no },
    { $inc: { total_items: oldSale.qty } }
  );
  if (unpaid > 0) {
    await db.collection('Customers').updateOne(
      { customer_no: oldSale.customer_no },
      { $inc: { bal: -unpaid } }
    );
  }
  if (oldSale.paid > 0) {
    await db.collection('Accounts').updateOne(
      { account_id: oldSale.account_id },
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
      db.collection('Customers').find({ customer_no: { $in: customerNos } }).toArray(),
      db.collection('Stores').find({ store_no: { $in: storeNos } }).toArray(),
      db.collection('Accounts').find({ account_id: { $in: accountIds } }).toArray(),
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
}

module.exports = { insertSale, updateSale, deleteSale, getAllSales };

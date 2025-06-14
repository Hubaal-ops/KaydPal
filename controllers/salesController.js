const connectDB = require('../db');

async function getNextSequenceValue(sequenceName) {
  const db = await connectDB();
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  // The result is the document directly, not wrapped in 'value'
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

  await db.collection('sales').insertOne(newSale);

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

  const oldSale = await db.collection('sales').findOne({ sel_no });
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
  await db.collection('products').updateOne(
    { product_no: oldSale.product_no },
    { $inc: { storing_balance: oldSale.qty } }
  );
  await db.collection('stores').updateOne(
    { store_no: oldSale.store_no },
    { $inc: { total_items: oldSale.qty } }
  );
  await db.collection('customers').updateOne(
    { customer_no: oldSale.customer_no },
    { $inc: { bal: -oldDebt } }
  );
  await db.collection('accounts').updateOne(
    { account_id: oldSale.account_id },
    { $inc: { balance: -oldSale.paid } }
  );

  const newDebt = amount - paid;

  await db.collection('Stores_Product').updateOne(
    { product_no, store_no },
    { $inc: { qty: -qty }, $set: { updated_at: new Date() } }
  );
  await db.collection('products').updateOne(
    { product_no },
    { $inc: { storing_balance: -qty } }
  );
  await db.collection('stores').updateOne(
    { store_no },
    { $inc: { total_items: -qty } }
  );

  if (newDebt > 0) {
    await db.collection('customers').updateOne(
      { customer_no },
      { $inc: { bal: newDebt } }
    );
  }

  if (paid > 0) {
    await db.collection('accounts').updateOne(
      { account_id },
      { $inc: { balance: paid } }
    );
  }

  await db.collection('sales').updateOne(
    { sel_no },
    { $set: updatedSale }
  );

  return { message: 'Sale updated successfully' };
}

async function deleteSale(sel_no) {
  const db = await connectDB();

  const oldSale = await db.collection('sales').findOne({ sel_no });
  if (!oldSale) throw new Error('Sale not found.');

  const unpaid = oldSale.amount - oldSale.paid;

  await db.collection('Stores_Product').updateOne(
    { product_no: oldSale.product_no, store_no: oldSale.store_no },
    { $inc: { qty: oldSale.qty }, $set: { updated_at: new Date() } }
  );
  await db.collection('products').updateOne(
    { product_no: oldSale.product_no },
    { $inc: { storing_balance: oldSale.qty } }
  );
  await db.collection('stores').updateOne(
    { store_no: oldSale.store_no },
    { $inc: { total_items: oldSale.qty } }
  );
  if (unpaid > 0) {
    await db.collection('customers').updateOne(
      { customer_no: oldSale.customer_no },
      { $inc: { bal: -unpaid } }
    );
  }
  if (oldSale.paid > 0) {
    await db.collection('accounts').updateOne(
      { account_id: oldSale.account_id },
      { $inc: { balance: -oldSale.paid } }
    );
  }

  await db.collection('sales').deleteOne({ sel_no });

  return { message: 'Sale deleted successfully' };
}

module.exports = { insertSale, updateSale, deleteSale };

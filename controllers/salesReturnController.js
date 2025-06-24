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

async function insertSalesReturn(returnData) {
  const db = await connectDB();
  
  const {
    sel_no,
    product_no,
    customer_no,
    store_no,
    qty,
    price,
    amount,
    paid,
    reason
  } = returnData;

  // Validate input
  if (qty <= 0) throw new Error('Return quantity must be greater than 0');
  if (price <= 0) throw new Error('Price must be greater than 0');
  if (amount <= 0) throw new Error('Amount must be greater than 0');
  if (paid < 0) throw new Error('Paid amount cannot be negative');
  if (paid > amount) throw new Error('Paid amount cannot exceed return amount');

  // Get the original sale
  const originalSale = await db.collection('Sales').findOne({ sel_no });
  if (!originalSale) throw new Error('Sale not found');
  
  // Validate it's the last sale for this product
  const lastSale = await db.collection('Sales')
    .findOne(
      { product_no },
      { sort: { sel_date: -1 } }
    );
  
  if (!lastSale || lastSale.sel_no !== sel_no) {
    throw new Error('Can only return the most recent sale for this product');
  }

  // Validate return quantity doesn't exceed original sale quantity
  if (qty > originalSale.qty) {
    throw new Error('Return quantity cannot exceed original sale quantity');
  }

  // Get customer current balance
  const customer = await db.collection('Customers').findOne({ customer_no });
  if (!customer) throw new Error('Customer not found');

  // Calculate refund amount
  const refundAmount = Math.min(paid, amount);
  
  // Get original sale account
  const originalAccount = await db.collection('Accounts').findOne({ account_id: originalSale.account_id });
  if (!originalAccount) throw new Error('Original sale account not found');

  // Get next return_id
  const return_id = await getNextSequenceValue('sales_returns');

  // Create return record
  const newReturn = {
    return_id,
    sel_no,
    product_no,
    customer_no,
    store_no,
    qty,
    price,
    amount,
    paid,
    reason,
    account_id: originalSale.account_id, // Use original sale's account
    return_date: new Date()
  };

  try {
    // Insert return record
    await db.collection('Sales_Returns').insertOne(newReturn);

    // Update stock - using pro_no for Stores_Product collection
    await db.collection('Stores_Product').updateOne(
      { pro_no: product_no, store_no },
      { $inc: { qty: qty }, $set: { updated_at: new Date() } }
    );

    // Update product storing balance
    await db.collection('Products').updateOne(
      { product_no },
      { $inc: { storing_balance: qty } }
    );

    // Update store total items
    await db.collection('Stores').updateOne(
      { store_no },
      { $inc: { total_items: qty } }
    );

    // Handle refund
    if (refundAmount > 0) {
      // First, reduce customer's debt if they have any
      const debtReduction = Math.min(customer.bal, refundAmount);
      if (debtReduction > 0) {
        await db.collection('Customers').updateOne(
          { customer_no },
          { $inc: { bal: -debtReduction } }
        );
      }

      // If there's still amount to refund, take it from the original sale account
      const remainingRefund = refundAmount - debtReduction;
      if (remainingRefund > 0) {
        // Update account balance for refund
        const accountUpdate = await db.collection('Accounts').updateOne(
          { account_id: originalSale.account_id },
          { $inc: { balance: -remainingRefund } }
        );

        if (accountUpdate.modifiedCount === 0) {
          throw new Error('Failed to update account balance');
        }

        // Verify the account update
        const updatedAccount = await db.collection('Accounts').findOne({ account_id: originalSale.account_id });
        console.log('Account balance before:', originalAccount.balance);
        console.log('Account balance after:', updatedAccount.balance);
        console.log('Refund amount:', remainingRefund);
      }
    }

    return { 
      message: 'Sales return processed successfully',
      return_id,
      refundAmount,
      debtReduction: Math.min(customer.bal, refundAmount),
      accountRefund: Math.max(0, refundAmount - Math.min(customer.bal, refundAmount))
    };
  } catch (error) {
    // If any operation fails, try to clean up
    try {
      await db.collection('Sales_Returns').deleteOne({ return_id });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    throw error;
  }
}

module.exports = { insertSalesReturn }; 
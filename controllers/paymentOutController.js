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

async function insertPaymentOut(paymentData) {
  const db = await connectDB();
  
  const {
    account_id,
    supplier_no,
    amount,
    description
  } = paymentData;

  // Basic validations
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }

  // Validate account exists and has sufficient balance
  const account = await db.collection('Accounts').findOne({ account_id });
  if (!account) {
    throw new Error('Account not found');
  }

  if (account.balance < amount) {
    throw new Error('Insufficient account balance');
  }

  // Validate supplier exists and check their balance
  const supplier = await db.collection('Suppliers').findOne({ supplier_no });
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Check if supplier has any debt
  if (!supplier.bal || supplier.bal <= 0) {
    throw new Error('Supplier has no outstanding balance to pay');
  }

  // Validate payment amount doesn't exceed supplier's debt
  if (amount > supplier.bal) {
    throw new Error(`Payment amount exceeds supplier's debt. Maximum payment allowed: ${supplier.bal}`);
  }

  // Get next payment id
  const id = await getNextSequenceValue('payment_out');

  // Create payment record
  const newPayment = {
    id,
    account_id,
    supplier_no,
    amount,
    description,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    // Insert payment record
    await db.collection('Payment_Out').insertOne(newPayment);

    // Update account balance
    await db.collection('Accounts').updateOne(
      { account_id },
      { $inc: { balance: -amount } }
    );

    // Update supplier balance (reduce their debt)
    await db.collection('Suppliers').updateOne(
      { supplier_no },
      { $inc: { bal: -amount } }
    );

    return {
      message: 'Payment out processed successfully',
      id,
      account: {
        account_id,
        new_balance: account.balance - amount
      },
      supplier: {
        supplier_no,
        new_balance: supplier.bal - amount
      }
    };

  } catch (error) {
    // If any operation fails, try to clean up
    try {
      await db.collection('Payment_Out').deleteOne({ id });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    throw error;
  }
}

module.exports = { insertPaymentOut }; 
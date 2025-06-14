const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertPayment(paymentData) {
  const db = await connectDB();
  
  const {
    customer_id,
    account_id,
    amount
  } = paymentData;

  // Validate required fields
  if (!customer_id) throw new Error('Customer ID is required.');
  if (!account_id) throw new Error('Account ID is required.');
  if (!amount || amount <= 0) throw new Error('Payment amount must be greater than 0.');

  // Check if customer exists
  const customer = await db.collection('Customers').findOne({ customer_no: customer_id });
  if (!customer) throw new Error('Customer not found.');

  // Check if account exists
  const account = await db.collection('Accounts').findOne({ account_id });
  if (!account) throw new Error('Account not found.');

  // Check if customer has outstanding balance
  const currentBalance = customer.bal || 0;
  if (currentBalance <= 0) throw new Error('Customer has no outstanding balance to pay.');

  // Check if payment amount exceeds outstanding balance
  if (amount > currentBalance) {
    throw new Error(`Payment amount (${amount}) exceeds outstanding balance (${currentBalance}).`);
  }

  // Generate payment ID using counter
  const id = await getNextSequence('payment_id');
  if (!id) {
    throw new Error("❌ Failed to get a valid payment ID.");
  }

  const newPayment = {
    id,
    customer_id,
    account_id,
    amount,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    // Insert payment record
    await db.collection('payment_in').insertOne(newPayment);

    // Update customer balance (reduce outstanding balance)
    await db.collection('Customers').updateOne(
      { customer_no: customer_id },
      { $inc: { bal: -amount } }
    );

    // Update account balance (increase account balance)
    await db.collection('Accounts').updateOne(
      { account_id },
      { $inc: { balance: amount } }
    );

    return {
      message: "✅ Payment processed successfully.",
      id,
      customer_id,
      amount,
      remaining_balance: currentBalance - amount
    };

  } catch (error) {
    // If any operation fails, we should clean up
    try {
      // Try to delete the payment record if it was inserted
      await db.collection('payment_in').deleteOne({ id });
    } catch (cleanupError) {
      console.error("Warning: Could not clean up payment record:", cleanupError.message);
    }
    
    throw new Error(`Payment processing failed: ${error.message}`);
  }
}

async function getCustomerPayments(customer_id) {
  const db = await connectDB();
  
  const payments = await db.collection('payment_in')
    .find({ customer_id })
    .sort({ created_at: -1 })
    .toArray();

  return payments;
}

async function getPaymentById(id) {
  const db = await connectDB();
  
  const payment = await db.collection('payment_in').findOne({ id });
  if (!payment) {
    throw new Error('Payment not found.');
  }

  return payment;
}

async function updatePayment(id, updatedPaymentData) {
  const db = await connectDB();
  
  const oldPayment = await db.collection('payment_in').findOne({ id });
  if (!oldPayment) {
    throw new Error('Payment not found.');
  }

  const { amount } = updatedPaymentData;

  // Validate amount
  if (amount && amount <= 0) {
    throw new Error('Payment amount must be greater than 0.');
  }

  // If amount is being changed, we need to adjust balances
  if (amount && amount !== oldPayment.amount) {
    const difference = amount - oldPayment.amount;
    
    // Check if customer has enough balance to cover the difference
    const customer = await db.collection('Customers').findOne({ customer_no: oldPayment.customer_id });
    const currentBalance = customer.bal || 0;
    
    if (difference > 0 && difference > currentBalance) {
      throw new Error('Cannot increase payment amount beyond customer\'s outstanding balance.');
    }

    try {
      // Update customer balance
      await db.collection('Customers').updateOne(
        { customer_no: oldPayment.customer_id },
        { $inc: { bal: -difference } }
      );

      // Update account balance
      await db.collection('Accounts').updateOne(
        { account_id: oldPayment.account_id },
        { $inc: { balance: difference } }
      );

      // Update payment record
      await db.collection('payment_in').updateOne(
        { id },
        { 
          $set: {
            amount,
            updated_at: new Date()
          }
        }
      );

      return {
        message: "✅ Payment updated successfully.",
        id,
        new_amount: amount,
        difference
      };

    } catch (error) {
      throw new Error(`Payment update failed: ${error.message}`);
    }
  } else {
    return {
      message: "✅ No changes to payment amount.",
      id
    };
  }
}

async function deletePayment(id) {
  const db = await connectDB();
  
  const payment = await db.collection('payment_in').findOne({ id });
  if (!payment) {
    throw new Error('Payment not found.');
  }

  try {
    // Restore customer balance
    await db.collection('Customers').updateOne(
      { customer_no: payment.customer_id },
      { $inc: { bal: payment.amount } }
    );

    // Reduce account balance
    await db.collection('Accounts').updateOne(
      { account_id: payment.account_id },
      { $inc: { balance: -payment.amount } }
    );

    // Delete payment record
    await db.collection('payment_in').deleteOne({ id });

    return {
      message: "✅ Payment deleted successfully.",
      id,
      restored_amount: payment.amount
    };

  } catch (error) {
    throw new Error(`Payment deletion failed: ${error.message}`);
  }
}

async function getCustomerBalance(customer_id) {
  const db = await connectDB();
  
  const customer = await db.collection('Customers').findOne({ customer_no: customer_id });
  if (!customer) {
    throw new Error('Customer not found.');
  }

  const balance = customer.bal || 0;
  
  // Get recent payments for this customer
  const recentPayments = await db.collection('payment_in')
    .find({ customer_id })
    .sort({ created_at: -1 })
    .limit(5)
    .toArray();

  return {
    customer_id,
    customer_name: customer.name,
    outstanding_balance: balance,
    recent_payments: recentPayments
  };
}

module.exports = {
  insertPayment,
  getCustomerPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getCustomerBalance
}; 
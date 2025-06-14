const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertCustomer(customerData) {
  const db = await connectDB();
  const customers = db.collection('Customers');

  // Generate customer_no using counter
  const customerNo = await getNextSequence('customer_no');

  if (!customerNo) {
    throw new Error("❌ Failed to get a valid customer number.");
  }

  const newCustomer = {
    customer_no: customerNo,
    name: customerData.name,
    email: customerData.email,
    phone: customerData.phone,
    address: customerData.address,
    bal: 0, // Initialize balance to 0
    created_at: new Date()
  };

  await customers.insertOne(newCustomer);

  return {
    message: "✅ Customer inserted successfully.",
    customer_no: customerNo
  };
}

async function getCustomerBalance(customer_no) {
  const db = await connectDB();
  
  const customer = await db.collection('Customers').findOne({ customer_no });
  if (!customer) {
    throw new Error('Customer not found.');
  }

  const balance = customer.bal || 0;
  
  // Get recent payments for this customer
  const recentPayments = await db.collection('Payments')
    .find({ customer_no })
    .sort({ payment_date: -1 })
    .limit(5)
    .toArray();

  // Get recent sales for this customer
  const recentSales = await db.collection('sales')
    .find({ customer_no })
    .sort({ sel_date: -1 })
    .limit(5)
    .toArray();

  return {
    customer_no,
    customer_name: customer.name,
    outstanding_balance: balance,
    recent_payments: recentPayments,
    recent_sales: recentSales
  };
}

async function getAllCustomers() {
  const db = await connectDB();
  
  const customers = await db.collection('Customers')
    .find({})
    .sort({ name: 1 })
    .toArray();

  return customers;
}

module.exports = {
  insertCustomer,
  getCustomerBalance,
  getAllCustomers
};

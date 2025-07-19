const Customer = require('../models/Customer');
const getNextSequence = require('../getNextSequence');

async function insertCustomer(customerData) {
  // Generate customer_no using counter
  const customerNo = await getNextSequence('customer_no');
  if (!customerNo) {
    throw new Error('❌ Failed to get a valid customer number.');
  }
  const newCustomer = {
    customer_no: customerNo,
    name: customerData.name,
    email: customerData.email,
    phone: customerData.phone,
    address: customerData.address,
    bal: typeof customerData.bal === 'number' ? customerData.bal : 0,
    created_at: new Date()
  };
  await Customer.create(newCustomer);
  return {
    message: '✅ Customer inserted successfully.',
    customer_no: customerNo
  };
}

async function getCustomerBalance(customer_no) {
  const customer = await Customer.findOne({ customer_no: Number(customer_no) });
  if (!customer) {
    throw new Error('Customer not found.');
  }
  const balance = customer.bal || 0;
  // Payments and sales aggregation would need to be updated to use Mongoose if needed
  // For now, just return the customer and balance
  return {
    customer_no: customer.customer_no,
    customer_name: customer.name,
    outstanding_balance: balance,
    recent_payments: [], // Placeholder
    recent_sales: [] // Placeholder
  };
}

async function getAllCustomers() {
  return await Customer.find().sort({ name: 1 });
}

async function updateCustomer(customer_no, updateData) {
  const updateFields = {
    name: updateData.name,
    email: updateData.email,
    phone: updateData.phone,
    address: updateData.address
  };
  if (typeof updateData.bal === 'number') {
    updateFields.bal = updateData.bal;
  }
  const result = await Customer.findOneAndUpdate(
    { customer_no: Number(customer_no) },
    updateFields,
    { new: true }
  );
  if (!result) {
    throw new Error('Customer not found');
  }
  return { message: 'Customer updated successfully' };
}

async function deleteCustomer(customer_no) {
  const result = await Customer.findOneAndDelete({ customer_no: Number(customer_no) });
  if (!result) {
    throw new Error('Customer not found');
  }
  return { message: 'Customer deleted successfully' };
}

module.exports = {
  insertCustomer,
  getCustomerBalance,
  getAllCustomers,
  updateCustomer,
  deleteCustomer
};

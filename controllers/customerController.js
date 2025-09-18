const Customer = require('../models/Customer');
const getNextSequence = require('../getNextSequence');
const XLSX = require('xlsx');

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
    created_at: new Date(),
    userId: customerData.userId
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

async function getAllCustomers(userId) {
  return await Customer.find({ userId }).sort({ name: 1 });
}

async function updateCustomer(customer_no, updateData, userId) {
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
    { customer_no: Number(customer_no), userId },
    updateFields,
    { new: true }
  );
  if (!result) {
    throw new Error('Customer not found');
  }
  return { message: 'Customer updated successfully' };
}

async function deleteCustomer(customer_no, userId) {
  const result = await Customer.findOneAndDelete({ customer_no: Number(customer_no), userId });
  if (!result) {
    throw new Error('Customer not found');
  }
  return { message: 'Customer deleted successfully' };
}

// Import customers from Excel file
async function importCustomers(file, userId) {
  try {
    // Read the Excel file from buffer
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (!jsonData || jsonData.length === 0) {
      return { success: false, message: 'No data found in the Excel file.' };
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    let errors = [];
    
    // Process each row
    for (const [index, row] of jsonData.entries()) {
      try {
        // Extract customer data (supporting different column names)
        const name = row.name || row.Name || row.Customer || row.customer || '';
        const email = row.email || row.Email || '';
        const phone = row.phone || row.Phone || row.Telephone || row.Tel || '';
        const address = row.address || row.Address || '';
        const balance = parseFloat(row.balance || row.Balance || row.bal || row.Bal || 0) || 0;
        
        if (!name || name.trim() === '') {
          skippedCount++;
          errors.push(`Row ${index + 1}: Missing customer name`);
          continue;
        }
        
        // Check if customer already exists by name and phone
        const existingCustomer = await Customer.findOne({
          name: name.trim(),
          phone: phone ? phone.toString().trim() : '',
          userId
        });
        
        if (existingCustomer) {
          skippedCount++;
          errors.push(`Row ${index + 1}: Customer with same name and phone already exists`);
          continue;
        }
        
        // Insert new customer
        await insertCustomer({
          name: name.trim(),
          email: email ? email.trim() : '',
          phone: phone ? phone.toString().trim() : '',
          address: address ? address.trim() : '',
          bal: balance,
          userId
        });
        
        importedCount++;
      } catch (error) {
        skippedCount++;
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }
    
    return {
      success: true,
      message: `✅ Import completed. ${importedCount} customers imported, ${skippedCount} skipped.`,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors
    };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: `Failed to process Excel file: ${error.message}` };
  }
}

module.exports = {
  insertCustomer,
  getCustomerBalance,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  importCustomers  // Add this line to export the import function
};

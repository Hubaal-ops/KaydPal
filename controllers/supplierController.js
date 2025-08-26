// controllers/supplierController.js
const Supplier = require('../models/Supplier');
const getNextSequence = require('../getNextSequence');

async function insertSupplier(supplierData) {
  console.log('Received supplier data:', supplierData);
  console.log('Balance value:', supplierData.balance, 'Type:', typeof supplierData.balance);
  
  const supplierNo = await getNextSequence('supplier_no');
  if (!supplierNo) {
    throw new Error('❌ Failed to get a valid supplier number.');
  }
  
  // Convert balance to number, handle both string and number inputs
  let balance = 0;
  if (supplierData.balance !== undefined && supplierData.balance !== null && supplierData.balance !== '') {
    balance = Number(supplierData.balance);
    if (isNaN(balance)) {
      balance = 0;
    }
  }
  
  console.log('Converted balance:', balance, 'Type:', typeof balance);
  
  const newSupplier = {
    supplier_no: supplierNo,
    name: supplierData.name,
    email: supplierData.email,
    phone: supplierData.phone,
    balance: balance,
    created_at: new Date(),
    userId: supplierData.userId
  };
  
  console.log('Final supplier object:', newSupplier);
  
  await Supplier.create(newSupplier);
  return {
    message: '✅ Supplier inserted successfully.',
    supplier_no: supplierNo
  };
}

async function getAllSuppliers(userId) {
  return await Supplier.find({ userId }).sort({ name: 1 });
}

async function updateSupplier(supplier_no, updateData, userId) {
  console.log('Received update data:', updateData);
  console.log('Balance value:', updateData.balance, 'Type:', typeof updateData.balance);
  
  // Convert balance to number, handle both string and number inputs
  let balance;
  if (updateData.balance !== undefined && updateData.balance !== null && updateData.balance !== '') {
    balance = Number(updateData.balance);
    if (isNaN(balance)) {
      balance = 0;
    }
  }
  
  console.log('Converted balance:', balance, 'Type:', typeof balance);
  
  const updateFields = {
    name: updateData.name,
    email: updateData.email,
    phone: updateData.phone
  };
  
  if (balance !== undefined) {
    updateFields.balance = balance;
  }
  
  console.log('Final update fields:', updateFields);
  
  const result = await Supplier.findOneAndUpdate(
    { supplier_no: Number(supplier_no), userId },
    updateFields,
    { new: true }
  );
  if (!result) {
    throw new Error('Supplier not found');
  }
  return { message: 'Supplier updated successfully' };
}

async function deleteSupplier(supplier_no, userId) {
  const result = await Supplier.findOneAndDelete({ supplier_no: Number(supplier_no), userId });
  if (!result) {
    throw new Error('Supplier not found');
  }
  return { message: 'Supplier deleted successfully' };
}

module.exports = {
  insertSupplier,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier
};

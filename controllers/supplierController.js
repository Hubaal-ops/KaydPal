// controllers/supplierController.js
const Supplier = require('../models/Supplier');
const getNextSequence = require('../getNextSequence');

async function insertSupplier(supplierData) {
  const supplierNo = await getNextSequence('supplier_no');
  if (!supplierNo) {
    throw new Error('❌ Failed to get a valid supplier number.');
  }
  const newSupplier = {
    supplier_no: supplierNo,
    name: supplierData.name,
    email: supplierData.email,
    phone: supplierData.phone,
    balance: typeof supplierData.balance === 'number' ? supplierData.balance : 0,
    created_at: new Date(),
    userId: supplierData.userId
  };
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
  const updateFields = {
    name: updateData.name,
    email: updateData.email,
    phone: updateData.phone
  };
  if (typeof updateData.balance === 'number') {
    updateFields.balance = updateData.balance;
  }
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

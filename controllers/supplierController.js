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
    balance: 0,
    created_at: new Date()
  };
  await Supplier.create(newSupplier);
  return {
    message: '✅ Supplier inserted successfully.',
    supplier_no: supplierNo
  };
}

async function getAllSuppliers() {
  return await Supplier.find().sort({ name: 1 });
}

async function updateSupplier(supplier_no, updateData) {
  const result = await Supplier.findOneAndUpdate(
    { supplier_no: Number(supplier_no) },
    {
      name: updateData.name,
      email: updateData.email,
      phone: updateData.phone
    },
    { new: true }
  );
  if (!result) {
    throw new Error('Supplier not found');
  }
  return { message: 'Supplier updated successfully' };
}

async function deleteSupplier(supplier_no) {
  const result = await Supplier.findOneAndDelete({ supplier_no: Number(supplier_no) });
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

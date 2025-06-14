// controllers/supplierController.js
const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertSupplier(supplierData) {
  const db = await connectDB();
  const suppliers = db.collection('Suppliers');

  const supplierNo = await getNextSequence('supplier_no');
  if (!supplierNo) {
    throw new Error("❌ Failed to get a valid supplier number.");
  }

  const newSupplier = {
    supplier_no: supplierNo,
    supplier_name: supplierData.supplier_name,
    email: supplierData.email,
    phone: supplierData.phone,
    balance: supplierData.balance || 0,
    created_at: new Date()
  };

  await suppliers.insertOne(newSupplier);

  return {
    message: "✅ Supplier inserted successfully.",
    supplier_no: supplierNo
  };
}

module.exports = {
  insertSupplier
};

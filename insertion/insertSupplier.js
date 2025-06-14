// insertion/insertSupplier.js
const { insertSupplier } = require('../controllers/supplierController');

async function runInsertSupplier() {
  try {
    const result = await insertSupplier({
      supplier_name: "SomTech Solutions",
      email: "somtech@gmail.com",
      phone: "0612345678",
      balance: 0,
      created_at: Date()
    });

    console.log(result.message, `Supplier No: ${result.supplier_no}`);
  } catch (err) {
    console.error("❌ Error inserting supplier:", err.message);
  }
}

runInsertSupplier();

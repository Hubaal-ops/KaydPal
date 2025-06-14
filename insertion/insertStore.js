// insertStore.js
const { insertStore } = require('../controllers/storeController');

async function runInsert() {
  try {
    const result = await insertStore({
      store_name: "Main Street Store",
      location: "123 Main St, Springfield",
      manager: "John Doe"
    });
    console.log(result.message);
    console.log("Store No:", result.store_no);
  } catch (err) {
    console.error("❌ Error inserting store:", err.message);
  }
}

runInsert();

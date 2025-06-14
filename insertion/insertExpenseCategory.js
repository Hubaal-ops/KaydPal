const { insertExpenseCategory, getAllExpenseCategories } = require('../controllers/expenseCategoryController');

async function runInsertExpenseCategories() {
  try {
    console.log("📂 Creating expense categories...\n");

    // Insert multiple expense categories
    const categories = [
      { exp_cat_name: 'Office Supplies' },
      { exp_cat_name: 'Utilities' },
      { exp_cat_name: 'Rent' },
      { exp_cat_name: 'Salaries' },
      { exp_cat_name: 'Marketing' },
      { exp_cat_name: 'Travel' },
      { exp_cat_name: 'Equipment' },
      { exp_cat_name: 'Maintenance' }
    ];

    for (const category of categories) {
      try {
        const result = await insertExpenseCategory(category);
        console.log(`✅ ${result.message} - ID: ${result.exp_cat_id}`);
      } catch (error) {
        console.log(`❌ Failed to insert "${category.exp_cat_name}": ${error.message}`);
      }
    }

    // Display all categories
    console.log("\n📋 All expense categories:");
    const allCategories = await getAllExpenseCategories();
    allCategories.forEach(cat => {
      console.log(`ID: ${cat.exp_cat_id} - ${cat.exp_cat_name}`);
    });

  } catch (err) {
    console.error("❌ Error in expense category insertion:", err.message);
  }
}

runInsertExpenseCategories(); 
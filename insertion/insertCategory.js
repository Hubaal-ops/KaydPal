const { insertCategory, getAllCategories } = require('../controllers/categoryController');

async function runInsertCategories() {
  try {
    console.log("📂 Creating categories...\n");

    // Insert multiple categories
    const categories = [
      { 
        category_name: 'Electronics',
        description: 'Electronic devices and gadgets'
      },
      { 
        category_name: 'Clothing',
        description: 'Apparel and fashion items'
      },
      { 
        category_name: 'Books',
        description: 'Books, magazines, and publications'
      },
      
      { 
        category_name: 'Sports & Outdoors',
        description: 'Sports equipment and outdoor gear'
      },
      
      { 
        category_name: 'Health & Beauty',
        description: 'Health products and beauty supplies'
      },
     
      { 
        category_name: 'Food & Beverages',
        description: 'Food items and beverages'
      },
      
    ];

    for (const category of categories) {
      try {
        const result = await insertCategory(category);
        console.log(`✅ ${result.message} - ID: ${result.category_id}`);
      } catch (error) {
        console.log(`❌ Failed to insert "${category.category_name}": ${error.message}`);
      }
    }

    // Display all categories
    console.log("\n📋 All categories:");
    const allCategories = await getAllCategories();
    allCategories.forEach(cat => {
      console.log(`ID: ${cat.category_id} - ${cat.category_name} - ${cat.description}`);
    });

  } catch (err) {
    console.error("❌ Error in category insertion:", err.message);
  }
}

runInsertCategories(); 
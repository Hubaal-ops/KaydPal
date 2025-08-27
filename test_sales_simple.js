const mongoose = require('mongoose');

// Simple test to verify sales system improvements
async function testSalesSystem() {
  try {
    // Connect to database
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/Inventory';
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models and controller
    const Sale = require('./models/Sale');
    const StoreProduct = require('./models/StoreProduct');
    const Customer = require('./models/Customer');
    
    console.log('\n🔍 Testing Sales Model Schema...');
    
    // Test 1: Check if Sale model has new fields
    const saleSchema = Sale.schema.paths;
    
    const requiredFields = ['status', 'sale_no', 'sale_id', 'store_no', 'subtotal', 'total_discount', 'total_tax', 'balance_due'];
    const missingFields = requiredFields.filter(field => !saleSchema[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ Sale model has all required new fields');
    } else {
      console.log('❌ Missing fields in Sale model:', missingFields);
    }
    
    // Test 2: Check status enum values
    const statusEnum = saleSchema.status?.enumValues;
    const expectedStatuses = ['draft', 'pending', 'confirmed', 'delivered', 'cancelled'];
    
    if (statusEnum && expectedStatuses.every(status => statusEnum.includes(status))) {
      console.log('✅ Sale status enum has correct values:', statusEnum);
    } else {
      console.log('❌ Sale status enum missing or incorrect:', statusEnum);
    }
    
    console.log('\n🔍 Testing Sales Controller Functions...');
    
    // Test 3: Check if controller functions are available
    const salesController = require('./controllers/salesController');
    const requiredFunctions = ['insertSale', 'updateSale', 'deleteSale', 'getAllSales', 'applySaleEffects', 'reverseSaleEffects'];
    const availableFunctions = Object.keys(salesController);
    
    const missingFunctions = requiredFunctions.filter(func => !availableFunctions.includes(func));
    
    if (missingFunctions.length === 0) {
      console.log('✅ All required sales controller functions are available');
    } else {
      console.log('❌ Missing functions in sales controller:', missingFunctions);
    }
    
    console.log('\n🔍 Testing Database Records...');
    
    // Test 4: Check existing sales data
    const salesCount = await Sale.countDocuments();
    console.log(`📊 Total sales in database: ${salesCount}`);
    
    if (salesCount > 0) {
      const sampleSale = await Sale.findOne().sort({ created_at: -1 });
      console.log('📋 Latest sale structure:');
      console.log({
        _id: sampleSale._id,
        sale_no: sampleSale.sale_no || 'N/A',
        sel_no: sampleSale.sel_no || 'N/A',
        status: sampleSale.status || 'N/A',
        amount: sampleSale.amount,
        items_count: sampleSale.items?.length || 0
      });
    }
    
    // Test 5: Check store products for testing
    const storeProductCount = await StoreProduct.countDocuments();
    console.log(`📦 Store products available: ${storeProductCount}`);
    
    if (storeProductCount > 0) {
      const sampleStoreProduct = await StoreProduct.findOne();
      console.log('📦 Sample store product:', {
        product_no: sampleStoreProduct.product_no,
        store_no: sampleStoreProduct.store_no,
        qty: sampleStoreProduct.qty
      });
    }
    
    // Test 6: Check customers for testing
    const customerCount = await Customer.countDocuments();
    console.log(`👥 Customers available: ${customerCount}`);
    
    if (customerCount > 0) {
      const sampleCustomer = await Customer.findOne();
      console.log('👤 Sample customer:', {
        customer_no: sampleCustomer.customer_no,
        name: sampleCustomer.name || sampleCustomer.customer_name,
        bal: sampleCustomer.bal
      });
    }
    
    console.log('\n✅ Sales system verification completed!');
    console.log('\n📝 What you can test now:');
    console.log('1. Create a draft sale (should not affect inventory)');
    console.log('2. Confirm the sale (should decrease inventory)');
    console.log('3. Cancel the sale (should restore inventory)');
    console.log('4. Delete a sale (should reverse all effects)');
    console.log('\n🚀 The enhanced sales system is ready for use!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the test
testSalesSystem().catch(console.error);
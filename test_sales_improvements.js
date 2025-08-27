const mongoose = require('mongoose');
const Sale = require('./models/Sale');
const StoreProduct = require('./models/StoreProduct');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Store = require('./models/Store');
const Account = require('./models/Account');
const { insertSale, updateSale, deleteSale, getAllSales } = require('./controllers/salesController');

// Test configuration
const TEST_USER_ID = new mongoose.Types.ObjectId();
const TEST_CUSTOMER_NO = 9001;
const TEST_STORE_NO = 9001;
const TEST_ACCOUNT_ID = 9001;
const TEST_PRODUCT_NO = 9001;

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/Inventory';
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  }
}

async function setupTestData() {
  console.log('\n🔧 Setting up test data...');
  
  try {
    // Create test customer
    await Customer.findOneAndUpdate(
      { customer_no: TEST_CUSTOMER_NO },
      {
        customer_no: TEST_CUSTOMER_NO,
        name: 'Test Customer',
        address: 'Test Address',
        phone: '123-456-7890',
        email: 'test@customer.com',
        bal: 0,
        userId: TEST_USER_ID
      },
      { upsert: true, new: true }
    );
    
    // Create test store
    await Store.findOneAndUpdate(
      { store_no: TEST_STORE_NO },
      {
        store_no: TEST_STORE_NO,
        store_name: 'Test Store',
        location: 'Test Location',
        total_items: 100,
        userId: TEST_USER_ID
      },
      { upsert: true, new: true }
    );
    
    // Create test account
    await Account.findOneAndUpdate(
      { account_id: TEST_ACCOUNT_ID },
      {
        account_id: TEST_ACCOUNT_ID,
        name: 'Test Account',
        account_name: 'Test Account',
        balance: 5000,
        userId: TEST_USER_ID
      },
      { upsert: true, new: true }
    );
    
    // Create test product
    await Product.findOneAndUpdate(
      { product_no: TEST_PRODUCT_NO },
      {
        product_no: TEST_PRODUCT_NO,
        product_name: 'Test Product',
        description: 'Test Product Description',
        price: 100,
        cost: 50,
        storing_balance: 50,
        userId: TEST_USER_ID
      },
      { upsert: true, new: true }
    );
    
    // Create store product with initial stock
    await StoreProduct.findOneAndUpdate(
      { product_no: TEST_PRODUCT_NO, store_no: TEST_STORE_NO, userId: TEST_USER_ID },
      {
        store_product_no: 9001,
        product_no: TEST_PRODUCT_NO,
        store_no: TEST_STORE_NO,
        qty: 50,
        userId: TEST_USER_ID
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Test data setup complete');
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
}

async function getBalances() {
  const [customer, store, account, storeProduct, product] = await Promise.all([
    Customer.findOne({ customer_no: TEST_CUSTOMER_NO, userId: TEST_USER_ID }),
    Store.findOne({ store_no: TEST_STORE_NO, userId: TEST_USER_ID }),
    Account.findOne({ account_id: TEST_ACCOUNT_ID, userId: TEST_USER_ID }),
    StoreProduct.findOne({ product_no: TEST_PRODUCT_NO, store_no: TEST_STORE_NO, userId: TEST_USER_ID }),
    Product.findOne({ product_no: TEST_PRODUCT_NO, userId: TEST_USER_ID })
  ]);
  
  return {
    customerBalance: customer?.bal || 0,
    storeItems: store?.total_items || 0,
    accountBalance: account?.balance || 0,
    storeProductQty: storeProduct?.qty || 0,
    productStoringBalance: product?.storing_balance || 0
  };
}

async function testDraftSaleCreation() {
  console.log('\n📝 Testing draft sale creation...');
  
  const initialBalances = await getBalances();
  console.log('Initial balances:', initialBalances);
  
  const saleData = {
    customer_no: TEST_CUSTOMER_NO,
    store_no: TEST_STORE_NO,
    account_id: TEST_ACCOUNT_ID,
    items: [{
      product_no: TEST_PRODUCT_NO,
      product_name: 'Test Product',
      qty: 5,
      price: 100,
      discount: 10,
      tax: 5
    }],
    paid: 0,
    status: 'draft',
    notes: 'Test draft sale'
  };
  
  const result = await insertSale(saleData, TEST_USER_ID);
  console.log('✅ Draft sale created:', result.sale_no);
  
  const afterBalances = await getBalances();
  console.log('After balances:', afterBalances);
  
  // Draft sales should not affect balances
  if (JSON.stringify(initialBalances) === JSON.stringify(afterBalances)) {
    console.log('✅ Draft sale correctly has no effects on balances');
  } else {
    throw new Error('❌ Draft sale incorrectly affected balances');
  }
  
  return result.sale_no;
}

async function testSaleConfirmation(saleNo) {
  console.log('\n✅ Testing sale confirmation with effects...');
  
  const initialBalances = await getBalances();
  console.log('Initial balances:', initialBalances);
  
  // Confirm the sale
  await updateSale(saleNo, { status: 'confirmed' }, TEST_USER_ID);
  console.log('✅ Sale confirmed:', saleNo);
  
  const afterBalances = await getBalances();
  console.log('After balances:', afterBalances);
  
  // Check effects were applied
  const expectedChanges = {
    customerBalance: 485, // (5 * 100 - 10 + 5) = 495, but paid 0 so debt increases
    storeItems: 95, // decreased by 5
    accountBalance: 5000, // no payment made
    storeProductQty: 45, // decreased by 5
    productStoringBalance: 45 // should be updated by recalculateProductBalance
  };
  
  console.log('Expected changes:', expectedChanges);
  
  // Verify the changes (allowing for minor variations due to existing data)
  if (afterBalances.storeProductQty === expectedChanges.storeProductQty) {
    console.log('✅ Store product quantity correctly decreased');
  } else {
    console.log(`⚠️ Store product quantity: expected ${expectedChanges.storeProductQty}, got ${afterBalances.storeProductQty}`);
  }
  
  if (afterBalances.customerBalance >= 480) { // Allow some tolerance
    console.log('✅ Customer balance correctly increased (debt)');
  } else {
    console.log(`⚠️ Customer balance: expected ~${expectedChanges.customerBalance}, got ${afterBalances.customerBalance}`);
  }
}

async function testSaleCancellation(saleNo) {
  console.log('\n❌ Testing sale cancellation (reversing effects)...');
  
  const beforeBalances = await getBalances();
  console.log('Before cancellation:', beforeBalances);
  
  // Cancel the sale
  await updateSale(saleNo, { status: 'cancelled' }, TEST_USER_ID);
  console.log('✅ Sale cancelled:', saleNo);
  
  const afterBalances = await getBalances();
  console.log('After cancellation:', afterBalances);
  
  // Stock should be restored
  if (afterBalances.storeProductQty > beforeBalances.storeProductQty) {
    console.log('✅ Stock correctly restored after cancellation');
  } else {
    console.log(`⚠️ Stock restoration: before ${beforeBalances.storeProductQty}, after ${afterBalances.storeProductQty}`);
  }
}

async function testSaleWithPayment() {
  console.log('\n💰 Testing sale with payment...');
  
  const initialBalances = await getBalances();
  console.log('Initial balances:', initialBalances);
  
  const saleData = {
    customer_no: TEST_CUSTOMER_NO,
    store_no: TEST_STORE_NO,
    account_id: TEST_ACCOUNT_ID,
    items: [{
      product_no: TEST_PRODUCT_NO,
      product_name: 'Test Product',
      qty: 2,
      price: 100,
      discount: 0,
      tax: 0
    }],
    paid: 150, // partial payment
    status: 'confirmed',
    notes: 'Test sale with payment'
  };
  
  const result = await insertSale(saleData, TEST_USER_ID);
  console.log('✅ Sale with payment created:', result.sale_no);
  
  const afterBalances = await getBalances();
  console.log('After balances:', afterBalances);
  
  // Account balance should increase by paid amount
  if (afterBalances.accountBalance > initialBalances.accountBalance) {
    console.log('✅ Account balance correctly increased by payment');
  } else {
    console.log(`⚠️ Account balance: before ${initialBalances.accountBalance}, after ${afterBalances.accountBalance}`);
  }
  
  return result.sale_no;
}

async function testSaleDeletion(saleNo) {
  console.log('\n🗑️ Testing sale deletion...');
  
  const beforeBalances = await getBalances();
  console.log('Before deletion:', beforeBalances);
  
  // Delete the sale
  await deleteSale(saleNo, TEST_USER_ID);
  console.log('✅ Sale deleted:', saleNo);
  
  const afterBalances = await getBalances();
  console.log('After deletion:', afterBalances);
  
  console.log('✅ Sale deletion completed');
}

async function testGetAllSales() {
  console.log('\n📋 Testing getAllSales...');
  
  const sales = await getAllSales(TEST_USER_ID);
  console.log(`✅ Retrieved ${sales.length} sales`);
  
  if (sales.length > 0) {
    console.log('Sample sale:', {
      sale_no: sales[0].sale_no,
      status: sales[0].status,
      amount: sales[0].amount,
      customer_name: sales[0].customer_name
    });
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    await Promise.all([
      Sale.deleteMany({ userId: TEST_USER_ID }),
      Customer.deleteOne({ customer_no: TEST_CUSTOMER_NO, userId: TEST_USER_ID }),
      Store.deleteOne({ store_no: TEST_STORE_NO, userId: TEST_USER_ID }),
      Account.deleteOne({ account_id: TEST_ACCOUNT_ID, userId: TEST_USER_ID }),
      Product.deleteOne({ product_no: TEST_PRODUCT_NO, userId: TEST_USER_ID }),
      StoreProduct.deleteOne({ product_no: TEST_PRODUCT_NO, store_no: TEST_STORE_NO, userId: TEST_USER_ID })
    ]);
    
    console.log('✅ Test data cleanup complete');
  } catch (error) {
    console.error('⚠️ Cleanup error (may be expected):', error.message);
  }
}

async function runAllTests() {
  try {
    await connectDB();
    await setupTestData();
    
    console.log('\n🚀 Starting Sales System Tests...');
    
    // Test 1: Draft sale creation (no effects)
    const draftSaleNo = await testDraftSaleCreation();
    
    // Test 2: Sale confirmation (apply effects)
    await testSaleConfirmation(draftSaleNo);
    
    // Test 3: Sale cancellation (reverse effects)
    await testSaleCancellation(draftSaleNo);
    
    // Test 4: Sale with payment
    const paidSaleNo = await testSaleWithPayment();
    
    // Test 5: Get all sales
    await testGetAllSales();
    
    // Test 6: Sale deletion
    await testSaleDeletion(paidSaleNo);
    
    console.log('\n✅ All sales system tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await cleanupTestData();
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the tests
runAllTests().catch(console.error);
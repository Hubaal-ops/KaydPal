// controllers/storeController.js
const connectDB = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertStore(storeData) {
  const db = await connectDB();
  const stores = db.collection('Stores');

  const nextStoreNo = await getNextSequence('store_no');

  const storeDoc = {
    store_no: nextStoreNo,
    store_name: storeData.store_name,
    location: storeData.location,
    manager: storeData.manager,
    total_items: 0,
    created_at: new Date()
  };

  await stores.insertOne(storeDoc);

  return {
    message: '✅ Store inserted successfully.',
    store_no: nextStoreNo
  };
}

module.exports = {
  insertStore
};

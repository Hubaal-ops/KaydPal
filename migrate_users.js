const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb://127.0.0.1:27017/Inventory');
  const inventories = mongoose.connection.collection('inventories');
  const users = mongoose.connection.collection('users');

  const allUsers = await inventories.find({}).toArray();
  if (allUsers.length === 0) {
    console.log('No users found in inventories.');
    process.exit();
  }

  // Remove _id to avoid duplicate key error if any _id already exists in users
  const usersToInsert = allUsers.map(u => {
    const { _id, ...rest } = u;
    return rest;
  });

  await users.insertMany(usersToInsert);
  console.log(`Migrated ${usersToInsert.length} users to the users collection.`);
  process.exit();
}

migrate(); 
// db.js
// This file connects ONLY to the Inventory database. Do not use for other databases.
const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('Inventory');
    db.client = client; // Attach client for access to startSession()
    console.log('\u2705 MongoDB connected to Inventory');
  }
  return db;
}

module.exports = connectDB;

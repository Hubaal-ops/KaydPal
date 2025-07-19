// insertion/insertAccount.js
const mongoose = require('mongoose');
const Account = require('../models/Account');
const db = require('../db');
const getNextSequence = require('../getNextSequence');

async function insertAccount() {
  try {
    await db;
    const account_id = await getNextSequence('account_id');
    const account = new Account({
      account_id,
      name: 'Sample Account',
      // createdAt will default to now
    });
    await account.save();
    console.log('Account inserted:', account);
    process.exit(0);
  } catch (error) {
    console.error('Error inserting account:', error);
    process.exit(1);
  }
}

insertAccount(); 
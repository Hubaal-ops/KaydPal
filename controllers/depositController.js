// controllers/depositController.js
const { ObjectId } = require('mongodb');
const connectDB = require('../db');

async function insertDeposit(depositData) {
  const db = await connectDB();
  const accounts = db.collection('Accounts');
  const deposits = db.collection('Deposits');

  const accountId = new ObjectId(depositData.account_id);

  // ✅ 1. Validate account exists
  const account = await accounts.findOne({ _id: accountId });
  if (!account) {
    throw new Error("❌ Account does not exist.");
  }

  // ✅ 2. Validate positive amount
  if (depositData.amount <= 0) {
    throw new Error("❌ Deposit amount must be greater than zero.");
  }

  // ✅ 3. Insert deposit
  const depositDoc = {
    account_id: accountId,
    amount: depositData.amount,
    deposit_date: new Date()
  };

  await deposits.insertOne(depositDoc);

  // ✅ 4. Update account balance
  await accounts.updateOne(
    { _id: accountId },
    { $inc: { balance: depositData.amount } }
  );

  return { message: "✅ Deposit successful and balance updated." };
}

module.exports = {
  insertDeposit
};

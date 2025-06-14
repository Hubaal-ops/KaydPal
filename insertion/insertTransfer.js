const connectDB = require('../db');
const { ObjectId } = require('mongodb');

async function insertTransfer() {
  const db = await connectDB();
  const accounts = db.collection('Accounts');
  const transfers = db.collection('Transfers');

  const fromAccountId = new ObjectId("6847db7215f5a86cdf64f89c"); // Replace with real _id
  const toAccountId = new ObjectId("6847e36b15f5a86cdf64f89e");   // Replace with real _id
  const amount = 25;

  // ✅ 1. Check same account
  if (fromAccountId.equals(toAccountId)) {
    throw new Error("❌ Cannot transfer to the same account.");
  }

  // ✅ 2. Check balance
  const fromAccount = await accounts.findOne({ _id: fromAccountId });
  if (!fromAccount || fromAccount.balance < amount) {
    throw new Error("❌ Insufficient balance.");
  }

  // ✅ 3. Insert transfer
  await transfers.insertOne({
    from_account_id: fromAccountId,
    to_account_id: toAccountId,
    amount,
    transfer_date: new Date()
  });

  // ✅ 4. Update balances
  await accounts.updateOne({ _id: fromAccountId }, { $inc: { balance: -amount } });
  await accounts.updateOne({ _id: toAccountId }, { $inc: { balance: amount } });

  console.log("✅ Transfer completed successfully.");
}

insertTransfer();

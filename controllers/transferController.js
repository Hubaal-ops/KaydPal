const connectDB = require('../db');

async function insertTransfer(transferData) {
  const db = await connectDB();
  const accounts = db.collection('Accounts');
  const transfers = db.collection('Transfers');

  const { from_account_id, to_account_id, amount } = transferData;

  // 1. Basic validation
  if (!from_account_id || !to_account_id || amount <= 0) {
    throw new Error('❌ Invalid transfer data');
  }

  if (from_account_id === to_account_id) {
    throw new Error('❌ Cannot transfer to the same account');
  }

  // 2. Check account existence
  const from = await accounts.findOne({ id: from_account_id });
  const to = await accounts.findOne({ id: to_account_id });

  if (!from || !to) throw new Error('❌ One or both accounts do not exist');
  if (from.balance < amount) throw new Error('❌ Insufficient balance');

  // 3. Insert transfer
  transferData.transfer_date = new Date();
  await transfers.insertOne(transferData);

  // 4. Update balances
  await accounts.updateOne({ id: from_account_id }, { $inc: { balance: -amount } });
  await accounts.updateOne({ id: to_account_id }, { $inc: { balance: +amount } });

  return { message: '✅ Transfer completed successfully' };
}

module.exports = { insertTransfer };

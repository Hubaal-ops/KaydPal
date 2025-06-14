// insertDeposit.js
const { insertDeposit } = require('./depositController');

async function runDeposit() {
  try {
    const result = await insertDeposit({
      account_id: "6847db7215f5a86cdf64f89c", // Replace with a real _id from your Accounts
      amount: 100.00
    });
    console.log(result.message);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

runDeposit();

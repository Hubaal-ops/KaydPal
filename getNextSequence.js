const connectDB = require('./db');

async function getNextSequence(name) {
  const db = await connectDB();
  const counters = db.collection('Counters'); // Confirmed correct from MongoDB screenshot

  // Since your result is already the updated document (not wrapped in `value`)
  const result = await counters.findOneAndUpdate(
  { _id: name },
    { $inc: { seq: 1 } },
    {
      returnDocument: 'after',  // Try this first
      upsert: true
    }
  );

  const value = result.value || result; // <-- This line fixes it

  console.log("Retrieved counter:", value);

  if (!value || typeof value.seq !== 'number') {
    throw new Error("❌ Failed to get a valid sequence number.");
  }

  return value.seq;
}

module.exports = getNextSequence;

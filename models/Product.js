const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  // ...other fields...
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storing_balance: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);

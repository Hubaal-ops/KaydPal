const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  store_no: { type: Number, unique: true, required: true },
  store_name: { type: String, required: true },
  location: { type: String, required: true },
  manager: { type: String, required: true },
  total_items: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Store', storeSchema); 
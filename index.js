const express = require('express');
const dotenv = require('dotenv');
const { insertSale } = require('./salesController');

dotenv.config();
const app = express();
app.use(express.json());

app.post('/sales', async (req, res) => {
  try {
    const result = await insertSale(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add a route for the root path
app.get('/', (req, res) => {
  res.send('Welcome to the Sales & Accounts API!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

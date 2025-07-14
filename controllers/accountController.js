// controllers/accountController.js
// In-memory accounts array
const accounts = [];

// Create a new account
exports.createAccount = (req, res) => {
  const { account_id, name } = req.body;
  if (!account_id || !name) {
    return res.status(400).json({ error: 'account_id and name are required' });
  }
  if (accounts.find(acc => acc.account_id === account_id)) {
    return res.status(409).json({ error: 'Account with this account_id already exists' });
  }
  const account = {
    account_id,
    name,
    createdAt: new Date()
  };
  accounts.push(account);
  res.status(201).json(account);
};

// Get all accounts
exports.getAccounts = (req, res) => {
  res.status(200).json(accounts);
};

// Get a single account by account_id
exports.getAccountById = (req, res) => {
  const account = accounts.find(acc => acc.account_id === req.params.account_id);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.status(200).json(account);
};

// Update an account
exports.updateAccount = (req, res) => {
  const account = accounts.find(acc => acc.account_id === req.params.account_id);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const { name } = req.body;
  if (name) account.name = name;
  res.status(200).json(account);
};

// Delete an account
exports.deleteAccount = (req, res) => {
  const index = accounts.findIndex(acc => acc.account_id === req.params.account_id);
  if (index === -1) return res.status(404).json({ error: 'Account not found' });
  accounts.splice(index, 1);
  res.status(200).json({ message: 'Account deleted' });
}; 
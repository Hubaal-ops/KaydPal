const Withdrawal = require('../models/Withdrawal');
const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');
const XLSX = require('xlsx');
const { createNotification } = require('../utils/notificationHelpers');
// Download withdrawal import template
exports.downloadWithdrawalTemplate = async (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    // Instructions sheet
    const instructions = [
      ['WITHDRAWAL IMPORT TEMPLATE - INSTRUCTIONS'],
      ['', '', ''],
      ['1. Do not modify the column headers in row 1'],
      ['2. Fill in the data starting from row 2'],
      ['3. Required fields: Account, Bank, and Amount'],
      ['4. Amount must be a positive number'],
      ['5. Account and Bank must match existing records'],
      ['6. Delete the example rows before adding your data'],
      ['', '', ''],
      ['For support, contact your system administrator'],
      ['', '', ''],
    ];
    // Data sheet
    const templateData = [
      ['Account', 'Bank', 'Amount'],
      ['Main Account', 'Bank of America', '1000.00'],
      ['Savings', 'Chase', '500.50']
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    const wsData = XLSX.utils.aoa_to_sheet(templateData);
    wsData['!cols'] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions', true);
    XLSX.utils.book_append_sheet(wb, wsData, 'Withdrawals', false);
    wb.Workbook = wb.Workbook || {};
    wb.Workbook.Views = [{ activeTab: 1 }];
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
      bookSST: true,
      cellDates: true,
      cellStyles: true
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=withdrawal_import_template.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate template: ' + error.message });
  }
};

// Import withdrawals from Excel/CSV file
exports.importWithdrawals = async (file, options) => {
  const { userId } = options;
  if (!userId) throw new Error('User authentication required.');
  if (!file || !file.buffer) throw new Error('No file data received.');
  try {
    const ext = file.originalname.split('.').pop().toLowerCase();
    let workbook;
    if (ext === 'csv') {
      const data = file.buffer.toString('utf8');
      workbook = XLSX.read(data, { type: 'string', cellDates: true });
    } else {
      workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    }
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('No worksheets found in the file.');
    }
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error('Could not read the first worksheet in the file.');
    }
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null });
    if (!jsonData || jsonData.length === 0) {
      throw new Error('No data rows found in the file.');
    }
    let importedCount = 0;
    let skippedCount = 0;
    let errors = [];
    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2;
      try {
        if (!row || Object.keys(row).length === 0) {
          skippedCount++;
          continue;
        }
        const norm = {};
        Object.keys(row).forEach(k => {
          if (k && typeof k === 'string') {
            const cleanKey = k.toString().toLowerCase().trim();
            norm[cleanKey] = row[k];
          }
        });
        const accountName = norm['account'] || norm['account name'] || norm['account_name'] || '';
        const bankName = norm['bank'] || norm['bank name'] || norm['bank_name'] || '';
        let amount = norm['amount'] || 0;
        if (!accountName && !bankName && !amount) {
          continue;
        }
        if (!accountName) throw new Error('Account name is required');
        if (!bankName) throw new Error('Bank name is required');
        if (!amount && amount !== 0) throw new Error('Amount is required');
        amount = parseFloat(amount);
        if (isNaN(amount)) throw new Error('Amount must be a number');
        if (amount <= 0) throw new Error('Amount must be greater than zero');
        // Find the account
        const account = await Account.findOne({
          name: accountName.trim(),
          bank: bankName.trim(),
          userId
        });
        if (!account) {
          throw new Error(`Account '${accountName}' at bank '${bankName}' not found`);
        }
        if (account.balance < amount) throw new Error('Insufficient account balance');
        const withdrawal_id = await getNextSequence('withdrawal_id');
        if (!withdrawal_id) {
          throw new Error('Failed to generate withdrawal ID');
        }
        const withdrawal = new Withdrawal({
          withdrawal_id,
          account: account._id,
          amount,
          withdrawal_date: new Date(),
          userId
        });
        await withdrawal.save();
        account.balance -= amount;
        await account.save();
        importedCount++;
      } catch (error) {
        skippedCount++;
        errors.push(`Row ${index + 2}: ${error.message}`);
      }
    }
    
    // Create notification for the user
    try {
      await createNotification(
        userId,
        'Withdrawals Imported',
        `${importedCount} withdrawals have been successfully imported.`,
        'success',
        'financial'
      );
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the request if notification creation fails
    }
    
    return {
      success: true,
      message: importedCount > 0 ? `Successfully imported ${importedCount} withdrawal(s)` : 'No new withdrawals were imported',
      importedCount,
      skippedCount,
      totalCount: importedCount + skippedCount,
      ...(errors.length > 0 && { errors })
    };
  } catch (error) {
    throw new Error(`Failed to process file: ${error.message}`);
  }
};

// Export withdrawals to Excel/CSV
exports.exportWithdrawals = async (userId, format = 'xlsx') => {
  try {
    const withdrawals = await Withdrawal.find({ userId })
      .populate('account', 'name bank')
      .sort({ withdrawal_date: -1 })
      .lean();
    if (!withdrawals || withdrawals.length === 0) {
      throw new Error('No withdrawals found to export');
    }
    const exportData = withdrawals.map(withdrawal => ({
      'Withdrawal ID': withdrawal.withdrawal_id,
      'Account Name': withdrawal.account?.name || '',
      'Bank': withdrawal.account?.bank || '',
      'Amount': withdrawal.amount,
      'Date': withdrawal.withdrawal_date ? new Date(withdrawal.withdrawal_date).toISOString().split('T')[0] : '',
      'Created At': withdrawal.createdAt ? new Date(withdrawal.createdAt).toISOString() : ''
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Withdrawals');
    let buffer;
    let mimeType;
    let fileExtension;
    if (format === 'csv') {
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else {
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    }
    return { buffer, mimeType, fileExtension };
  } catch (error) {
    throw new Error(`Failed to export withdrawals: ${error.message}`);
  }
};

// Get all withdrawals
exports.getAllWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawals = await Withdrawal.find({ userId }).populate('account', 'name bank');
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get withdrawal by ID
exports.getWithdrawalById = async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawal = await Withdrawal.findOne({ _id: req.params.id, userId }).populate('account', 'name bank');
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new withdrawal
exports.createWithdrawal = async (req, res) => {
  try {
    const { account, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    const accountDoc = await Account.findById(account);
    if (!accountDoc) return res.status(404).json({ error: 'Account does not exist' });
    if (accountDoc.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
    const withdrawal_id = await getNextSequence('withdrawal_id');
    if (!withdrawal_id) {
      return res.status(500).json({ error: 'Failed to generate withdrawal ID' });
    }
  const withdrawal = new Withdrawal({ withdrawal_id, account, amount, userId: req.user.id });
    await withdrawal.save();
    // Update account balance
    accountDoc.balance -= amount;
    await accountDoc.save();
    
    // Create notification for the user
    try {
      await createNotification(
        req.user.id,
        'Withdrawal Completed',
        `A withdrawal of $${amount.toFixed(2)} has been processed from your account.`,
        'success',
        'financial'
      );
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the request if notification creation fails
    }
    
    res.status(201).json(withdrawal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update withdrawal
exports.updateWithdrawal = async (req, res) => {
  try {
    const { account, amount } = req.body;
  const withdrawal = await Withdrawal.findOne({ _id: req.params.id, userId: req.user.id });
  if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    // Adjust account balances if amount or account changes
    if (amount !== undefined && (amount !== withdrawal.amount || account !== String(withdrawal.account))) {
      // Refund old account
      const oldAccount = await Account.findById(withdrawal.account);
      if (oldAccount) {
        oldAccount.balance += withdrawal.amount;
        await oldAccount.save();
      }
      // Deduct from new account
      const newAccount = await Account.findById(account);
      if (!newAccount) return res.status(404).json({ error: 'New account does not exist' });
      if (newAccount.balance < amount) return res.status(400).json({ error: 'Insufficient account balance' });
      newAccount.balance -= amount;
      await newAccount.save();
    }
    withdrawal.account = account;
    withdrawal.amount = amount;
    await withdrawal.save();
    res.json(withdrawal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete withdrawal
exports.deleteWithdrawal = async (req, res) => {
  try {
  const withdrawal = await Withdrawal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    // Refund account balance
    const account = await Account.findById(withdrawal.account);
    if (account) {
      account.balance += withdrawal.amount;
      await account.save();
    }
    res.json({ message: 'Withdrawal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
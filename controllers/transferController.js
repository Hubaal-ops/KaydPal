const Transfer = require('../models/Transfer');
const Account = require('../models/Account');
const getNextSequence = require('../getNextSequence');
const XLSX = require('xlsx');
const path = require('path');

// Get all transfers
exports.getAllTransfers = async (req, res) => {
  try {
    const userId = req.user.id;
    const transfers = await Transfer.find({ userId })
      .populate('from_account', 'name bank')
      .populate('to_account', 'name bank');
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get transfer by ID
exports.getTransferById = async (req, res) => {
  try {
    const userId = req.user.id;
    const transfer = await Transfer.findOne({ _id: req.params.id, userId })
      .populate('from_account', 'name bank')
      .populate('to_account', 'name bank');
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    res.json(transfer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new transfer
exports.createTransfer = async (req, res) => {
  try {
    const { from_account, to_account, amount, description } = req.body;
    if (from_account === to_account) return res.status(400).json({ error: 'Cannot transfer to the same account' });
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    const fromAcc = await Account.findById(from_account);
    const toAcc = await Account.findById(to_account);
    if (!fromAcc || !toAcc) return res.status(404).json({ error: 'One or both accounts do not exist' });
    if (fromAcc.balance < amount) return res.status(400).json({ error: 'Insufficient balance in source account' });
    const transfer_id = await getNextSequence('transfer_id');
    if (!transfer_id) {
      return res.status(500).json({ error: 'Failed to generate transfer ID' });
    }
  const transfer = new Transfer({ transfer_id, from_account, to_account, amount, description, userId: req.user.id });
    await transfer.save();
    // Update balances
    fromAcc.balance -= amount;
    toAcc.balance += amount;
    await fromAcc.save();
    await toAcc.save();
    res.status(201).json(transfer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update transfer
exports.updateTransfer = async (req, res) => {
  try {
    const { from_account, to_account, amount, description } = req.body;
  const transfer = await Transfer.findOne({ _id: req.params.id, userId: req.user.id });
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    // Reverse old transfer
    const oldFrom = await Account.findById(transfer.from_account);
    const oldTo = await Account.findById(transfer.to_account);
    if (oldFrom && oldTo) {
      oldFrom.balance += transfer.amount;
      oldTo.balance -= transfer.amount;
      await oldFrom.save();
      await oldTo.save();
    }
    // Apply new transfer
    if (from_account === to_account) return res.status(400).json({ error: 'Cannot transfer to the same account' });
    const newFrom = await Account.findById(from_account);
    const newTo = await Account.findById(to_account);
    if (!newFrom || !newTo) return res.status(404).json({ error: 'One or both accounts do not exist' });
    if (newFrom.balance < amount) return res.status(400).json({ error: 'Insufficient balance in source account' });
    newFrom.balance -= amount;
    newTo.balance += amount;
    await newFrom.save();
    await newTo.save();
    transfer.from_account = from_account;
    transfer.to_account = to_account;
    transfer.amount = amount;
    transfer.description = description;
    await transfer.save();
    res.json(transfer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete transfer
exports.deleteTransfer = async (req, res) => {
  try {
    const userId = req.user.id;
    const transfer = await Transfer.findOne({ _id: req.params.id, userId });
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    
    // Check if transfer is already reversed
    if (transfer.reversed) {
      return res.status(400).json({ error: 'This transfer has already been reversed' });
    }
    
    // Instead of deleting, we'll create a reverse transfer
    const reverseTransfer = new Transfer({
      ...transfer.toObject(),
      _id: undefined,
      amount: -transfer.amount,
      description: `Reversal of transfer #${transfer.transfer_id}`,
      reversed: true,
      original_transfer: transfer._id
    });
    
    // Update account balances
    const fromAcc = await Account.findById(transfer.to_account);
    const toAcc = await Account.findById(transfer.from_account);
    
    fromAcc.balance -= transfer.amount;
    toAcc.balance += transfer.amount;
    
    // Save all changes
    await Promise.all([
      reverseTransfer.save(),
      fromAcc.save(),
      toAcc.save(),
      Transfer.findByIdAndUpdate(transfer._id, { reversed: true })
    ]);
    
    res.json({ message: 'Transfer reversed successfully', transfer: reverseTransfer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Import transfers from Excel/CSV file
exports.importTransfers = async (file) => {
  const userId = file.userId; // Get userId from the file object
  if (!userId) {
    throw new Error('User ID is required for import');
  }

  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  const results = {
    total: data.length,
    success: 0,
    errors: []
  };
  
  for (const [index, row] of data.entries()) {
    try {
      // Map Excel column names to our expected fields
      const from_account = row['From'] || row['from_account'] || row['From Account'];
      const to_account = row['To'] || row['to_account'] || row['To Account'];
      const amount = row['Amount'] || row['amount'] || row['AMOUNT'];
      const description = row['Description'] || row['description'] || row['DESCRIPTION'] || '';
      const date = row['Date'] || row['date'] || row['DATE'] || new Date();
      
      if (!from_account || !to_account || !amount) {
        throw new Error('Missing required fields: from_account, to_account, and amount are required');
      }
      
      // Log the account names we're looking for
      console.log('Looking for accounts:', { from: from_account, to: to_account });
      
      // Check if the input is a valid MongoDB ObjectId
      const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
      
      // First, try exact match with case-insensitive search
      let [fromAcc, toAcc] = await Promise.all([
        Account.findOne({
          userId,
          name: { $regex: new RegExp(`^${from_account}$`, 'i') }
        }),
        Account.findOne({
          userId,
          name: { $regex: new RegExp(`^${to_account}$`, 'i') }
        })
      ]);
      
      // If not found and input is a valid ObjectId, try by _id
      if (!fromAcc && isValidObjectId(from_account)) {
        fromAcc = await Account.findOne({ _id: from_account, userId });
      }
      
      if (!toAcc && isValidObjectId(to_account)) {
        toAcc = await Account.findOne({ _id: to_account, userId });
      }
      
      // If not found, try partial match
      if (!fromAcc || !toAcc) {
        console.log('Trying partial match...');
        const [newFrom, newTo] = await Promise.all([
          fromAcc ? Promise.resolve(fromAcc) : Account.findOne({
            userId,
            name: { $regex: from_account, $options: 'i' }
          }),
          toAcc ? Promise.resolve(toAcc) : Account.findOne({
            userId,
            name: { $regex: to_account, $options: 'i' }
          })
        ]);
        
        if (!fromAcc) fromAcc = newFrom;
        if (!toAcc) toAcc = newTo;
      }
      
      // If still not found, try to find any account that contains the search term
      if (!fromAcc || !toAcc) {
        console.log('Trying contains match...');
        const allAccounts = await Account.find({ userId }, 'name bank');
        console.log('Available accounts:', allAccounts.map(a => `${a.name} (${a.bank})`));
        
        if (!fromAcc) {
          fromAcc = allAccounts.find(acc => 
            acc.name.toLowerCase().includes(from_account.toLowerCase())
          );
        }
        
        if (!toAcc) {
          toAcc = allAccounts.find(acc => 
            acc.name.toLowerCase().includes(to_account.toLowerCase())
          );
        }
      }
      
      if (!fromAcc || !toAcc) {
        const missing = [];
        if (!fromAcc) missing.push(`Source account: "${from_account}"`);
        if (!toAcc) missing.push(`Destination account: "${to_account}"`);
        throw new Error(`Account(s) not found. ${missing.join('; ')}. Available accounts: ${
          (await Account.find({ userId }, 'name bank')).map(a => `${a.name} (${a.bank})`).join(', ')
        }`);
      }
      
      if (fromAcc._id.toString() === toAcc._id.toString()) {
        throw new Error('Cannot transfer to the same account');
      }
      
      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Amount must be a positive number');
      }
      
      if (fromAcc.balance < amountNum) {
        throw new Error(`Insufficient balance in source account (${fromAcc.name}). Available: ${fromAcc.balance}, Required: ${amountNum}`);
      }
      
      // Get next transfer ID
      const transfer_id = await getNextSequence('transfer_id');
      if (!transfer_id) {
        throw new Error('Failed to generate transfer ID');
      }
      
      // Create transfer
      const transfer = new Transfer({
        transfer_id,
        from_account: fromAcc._id,
        to_account: toAcc._id,
        amount: amountNum,
        description: description || '',
        date: date ? new Date(date) : new Date(),
        userId
      });
      
      try {
        // Save transfer
        await transfer.save();
        
        // Update account balances
        fromAcc.balance = Number((fromAcc.balance - amountNum).toFixed(2));
        toAcc.balance = Number((toAcc.balance + amountNum).toFixed(2));
        
        // Save updated accounts
        await Promise.all([fromAcc.save(), toAcc.save()]);
        
        results.success++;
      } catch (error) {
        // If an error occurred, try to clean up the transfer if it was created
        if (transfer._id) {
          await Transfer.deleteOne({ _id: transfer._id }).catch(console.error);
        }
        throw error; // Re-throw to be caught by the outer try-catch
      }
    } catch (error) {
      console.error(`Error importing transfer at row ${index + 2}:`, error);
      results.errors.push({
        row: index + 2, // +2 for 1-based index and header row
        error: error.message,
        data: row
      });
    }
  }
  
  return results;
};

// Export transfers to Excel/CSV
exports.exportTransfers = async (userId, format = 'xlsx') => {
  try {
    const transfers = await Transfer.find({ userId })
      .populate('from_account', 'name bank')
      .populate('to_account', 'name bank')
      .sort({ date: -1 });
    
    // Prepare data for export - match the import template format
    const data = transfers.map(transfer => {
      // Format the date safely
      const formattedDate = transfer.date 
        ? new Date(transfer.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      return {
        'Transfer ID': transfer.transfer_id,
        'From Account': transfer.from_account?.name || 'N/A',
        'From Bank': transfer.from_account?.bank || 'N/A',
        'To Account': transfer.to_account?.name || 'N/A',
        'To Bank': transfer.to_account?.bank || 'N/A',
        'Amount': transfer.amount || 0,
        'Description': transfer.description || '',
        'Date': formattedDate,
        'Created At': new Date(transfer.createdAt).toLocaleString(),
        'Updated At': new Date(transfer.updatedAt).toLocaleString()
      };
    });
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const columnWidths = [
      { wch: 10 },  // Transfer ID
      { wch: 25 },  // From Account
      { wch: 25 },  // From Bank
      { wch: 25 },  // To Account
      { wch: 25 },  // To Bank
      { wch: 15 },  // Amount
      { wch: 40 },  // Description
      { wch: 15 },  // Date
      { wch: 20 },  // Created At
      { wch: 20 }   // Updated At
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Format the header row
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4F81BD' } },
      alignment: { horizontal: 'center' }
    };
    
    // Apply header style
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = headerStyle;
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transfers');
    
    // Generate buffer based on format
    const buffer = format === 'csv' 
      ? XLSX.write(workbook, { 
          bookType: 'csv', 
          type: 'buffer',
          bookSST: false,
          dateNF: 'yyyy-mm-dd',
          cellDates: true
        })
      : XLSX.write(workbook, { 
          bookType: 'xlsx', 
          type: 'buffer',
          bookSST: false,
          dateNF: 'yyyy-mm-dd',
          cellDates: true
        });
    
    return {
      buffer,
      contentType: format === 'csv' 
        ? 'text/csv; charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: format === 'csv' ? 'csv' : 'xlsx'
    };
  } catch (error) {
    console.error('Error exporting transfers:', error);
    throw new Error('Failed to export transfers: ' + error.message);
  }
};

// Download transfer import template
exports.downloadTransferTemplate = async (req, res) => {
  try {
    // Create sample data for the template that matches the actual import format
    const templateData = [{
      'From': 'Cash',
      'To': 'Bank Account',
      'Amount': 1000,
      'Description': 'Sample transfer',
      'Date': new Date().toISOString().split('T')[0]
    }];
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const columnWidths = [
      { wch: 20 }, // From
      { wch: 25 }, // To
      { wch: 15 }, // Amount
      { wch: 30 }, // Description
      { wch: 15 }  // Date
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transfers');
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=transfer_import_template.xlsx');
    
    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error('Error generating transfer template:', error);
    res.status(500).json({ error: 'Failed to generate transfer template' });
  }
};

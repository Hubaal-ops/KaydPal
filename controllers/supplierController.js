// controllers/supplierController.js
const Supplier = require('../models/Supplier');
const getNextSequence = require('../getNextSequence');

async function insertSupplier(supplierData) {
  console.log('Received supplier data:', supplierData);
  console.log('Balance value:', supplierData.balance, 'Type:', typeof supplierData.balance);
  
  const supplierNo = await getNextSequence('supplier_no');
  if (!supplierNo) {
    throw new Error('❌ Failed to get a valid supplier number.');
  }
  
  // Convert balance to number, handle both string and number inputs
  let balance = 0;
  if (supplierData.balance !== undefined && supplierData.balance !== null && supplierData.balance !== '') {
    balance = Number(supplierData.balance);
    if (isNaN(balance)) {
      balance = 0;
    }
  }
  
  console.log('Converted balance:', balance, 'Type:', typeof balance);
  
  const newSupplier = {
    supplier_no: supplierNo,
    name: supplierData.name,
    email: supplierData.email,
    phone: supplierData.phone,
    balance: balance,
    created_at: new Date(),
    userId: supplierData.userId
  };
  
  console.log('Final supplier object:', newSupplier);
  
  await Supplier.create(newSupplier);
  return {
    message: '✅ Supplier inserted successfully.',
    supplier_no: supplierNo
  };
}

async function getAllSuppliers(userId) {
  return await Supplier.find({ userId }).sort({ name: 1 });
}

async function updateSupplier(supplier_no, updateData, userId) {
  console.log('Received update data:', updateData);
  console.log('Balance value:', updateData.balance, 'Type:', typeof updateData.balance);
  
  // Convert balance to number, handle both string and number inputs
  let balance;
  if (updateData.balance !== undefined && updateData.balance !== null && updateData.balance !== '') {
    balance = Number(updateData.balance);
    if (isNaN(balance)) {
      balance = 0;
    }
  }
  
  console.log('Converted balance:', balance, 'Type:', typeof balance);
  
  const updateFields = {
    name: updateData.name,
    email: updateData.email,
    phone: updateData.phone
  };
  
  if (balance !== undefined) {
    updateFields.balance = balance;
  }
  
  console.log('Final update fields:', updateFields);
  
  const result = await Supplier.findOneAndUpdate(
    { supplier_no: Number(supplier_no), userId },
    updateFields,
    { new: true }
  );
  if (!result) {
    throw new Error('Supplier not found');
  }
  return { message: 'Supplier updated successfully' };
}

async function deleteSupplier(supplier_no, userId) {
  const result = await Supplier.findOneAndDelete({ supplier_no: Number(supplier_no), userId });
  if (!result) {
    throw new Error('Supplier not found');
  }
  return { message: 'Supplier deleted successfully' };
}

// Import suppliers from Excel/CSV file
const XLSX = require('xlsx');
const path = require('path');

async function importSuppliers(file, options) {
  const Supplier = require('../models/Supplier');
  const getNextSequence = require('../getNextSequence');
  const userId = options.userId;
  if (!userId) throw new Error('User authentication required.');
  if (!file || !file.buffer) throw new Error('No file data received.');
  try {
    // Determine file type by extension
    const ext = file.originalname.split('.').pop().toLowerCase();
    let workbook;
    if (ext === 'csv') {
      const data = file.buffer.toString('utf8');
      workbook = XLSX.read(data, { type: 'string', cellDates: true });
    } else {
      workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    }
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) throw new Error('No worksheets found in the file.');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) throw new Error('Could not read the first worksheet in the file.');
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    if (!jsonData || jsonData.length === 0) throw new Error('No data found in the file.');
    let importedCount = 0;
    let skippedCount = 0;
    let errors = [];
    const db = await require('../db')();
    const suppliers = db.collection('suppliers');
    for (const [index, row] of jsonData.entries()) {
      try {
        // Normalize keys: lowercase and trim
        const norm = {};
        Object.keys(row).forEach(k => {
          norm[k.toLowerCase().trim()] = row[k];
        });
        // Debug: log normalized row
        console.log(`Row ${index + 1} normalized:`, norm);
        const name = norm['name'] || norm['supplier_name'] || norm['suppliername'] || norm['supplier name'] || '';
        const email = norm['email'] || '';
        const phone = norm['phone'] || '';
        let balance = norm['balance'] || 0;
        if (typeof balance === 'string' && balance.trim() !== '') {
          balance = parseFloat(balance);
        }
        if (!name || name.trim() === '') {
          skippedCount++;
          errors.push(`Row ${index + 1}: Missing supplier name (normalized keys: ${Object.keys(norm).join(', ')}, values: ${Object.values(norm).join(', ')})`);
          continue;
        }
        // Check for duplicate name/email
        const existingSupplier = await suppliers.findOne({
          $or: [
            { name: name.trim(), userId },
            { email: email.trim(), userId, email: { $ne: '' } }
          ]
        });
        if (existingSupplier) {
          skippedCount++;
          const matchType = existingSupplier.name === name.trim() ? 'name' : 'email';
          errors.push(`Row ${index + 1}: Supplier with this ${matchType} already exists (${name})`);
          continue;
        }
        const supplier_no = await getNextSequence('supplier_no');
        if (!supplier_no) throw new Error('Failed to get a valid supplier number.');
        const cleanEmail = email ? email.toString().trim() : '';
        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          throw new Error(`Invalid email format: ${cleanEmail}`);
        }
        const ObjectId = require('mongodb').ObjectId;
        const newSupplier = {
          supplier_no,
          name: name.trim(),
          email: cleanEmail,
          phone: phone ? phone.toString().trim() : '',
          balance: isNaN(balance) ? 0 : balance,
          created_at: new Date(),
          userId: new ObjectId(userId)
        };
        await suppliers.insertOne(newSupplier);
        importedCount++;
      } catch (error) {
        skippedCount++;
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }
    return {
      message: `✅ Import completed. ${importedCount} suppliers imported, ${skippedCount} skipped.`,
      imported: importedCount,
      skipped: skippedCount,
      errors
    };
  } catch (error) {
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

// Download supplier import template
async function downloadSupplierTemplate(req, res) {
  try {
    const wb = XLSX.utils.book_new();
    const templateData = [
      ['name', 'email', 'phone', 'balance'],
      ['Supplier 1', 'supplier1@example.com', '1234567890', '1000'],
      ['Supplier 2', 'supplier2@example.com', '0987654321', '500']
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [ { wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 15 } ];
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=supplier_import_template.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate template' });
  }
}

module.exports = {
  insertSupplier,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
  importSuppliers,
  downloadSupplierTemplate
};

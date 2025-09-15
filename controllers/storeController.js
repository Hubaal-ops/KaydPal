const Store = require('../models/Store');
const getNextSequence = require('../getNextSequence');
const XLSX = require('xlsx');
const path = require('path');

// Get all stores
exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find({ userId: req.user.id });
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
};

// Get a single store by ID
exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch store' });
  }
};

// Create a new store
exports.createStore = async (req, res) => {
  try {
    // Generate next store_no
    const store_no = await getNextSequence('store_no');
    const newStore = new Store({
      ...req.body,
      store_no,
      userId: req.user.id
    });
    await newStore.save();
    res.status(201).json(newStore);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create store' });
  }
};

// Update a store (user-specific)
exports.updateStore = async (req, res) => {
  try {
    const updated = await Store.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Store not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update store' });
  }
};

// Delete a store (user-specific)
exports.deleteStore = async (req, res) => {
  try {
    const deleted = await Store.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Store not found' });
    res.json({ message: 'Store deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete store' });
  }
};

// Import stores from Excel file
exports.importStores = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const XLSX = require('xlsx');
    
    // Read the Excel file from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (!jsonData || jsonData.length === 0) {
      return res.status(400).json({ success: false, message: 'No data found in the Excel file.' });
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    let errors = [];
    
    // Process each row
    for (const [index, row] of jsonData.entries()) {
      try {
        // Extract store data (supporting different column names)
        const storeName = row.store_name || row.StoreName || row.name || row.Name || row['Store Name'];
        const location = row.location || row.Location || row.address || row.Address || '';
        const manager = row.manager || row.Manager || row['Store Manager'] || '';
        
        if (!storeName || storeName.trim() === '') {
          skippedCount++;
          errors.push(`Row ${index + 1}: Missing store name`);
          continue;
        }
        
        // Check if store already exists
        const existingStore = await Store.findOne({ 
          store_name: storeName.trim(),
          userId: req.user.id
        });
        
        if (existingStore) {
          skippedCount++;
          errors.push(`Row ${index + 1}: Store "${storeName}" already exists`);
          continue;
        }
        
        // Generate store_no using counter
        const store_no = await getNextSequence('store_no');
        if (!store_no) {
          throw new Error("Failed to get a valid store ID.");
        }
        
        const newStore = new Store({
          store_no,
          store_name: storeName.trim(),
          location: location || '',
          manager: manager || '',
          total_items: 0,
          userId: req.user.id
        });
        
        await newStore.save();
        importedCount++;
      } catch (error) {
        skippedCount++;
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }
    
    return res.json({
      success: true,
      message: `✅ Import completed. ${importedCount} stores imported, ${skippedCount} skipped.`,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors
    });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ success: false, message: `Failed to process Excel file: ${error.message}` });
  }
};

// Download store import template
exports.downloadTemplate = async (req, res) => {
  try {
    // Create a sample workbook
    const wb = XLSX.utils.book_new();
    
    // Sample data for the template
    const templateData = [
      ['store_name', 'location', 'manager'],
      ['Main Store', 'New York', 'John Doe'],
      ['Branch 1', 'Los Angeles', 'Jane Smith']
    ];
    
    // Convert data to worksheet
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Stores Template');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=store_import_template.xlsx');
    
    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
};
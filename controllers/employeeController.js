const Employee = require('../models/Employee');
const Store = require('../models/Store');
const getNextSequence = require('../getNextSequence');
const XLSX = require('xlsx');
const { createNotification } = require('../utils/notificationHelpers');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ userId: req.user.id });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employee_id: Number(req.params.id), userId: req.user.id });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, position, store, contact, date_hired } = req.body;
    const employee_id = await getNextSequence('employee_id');
    if (!employee_id) {
      return res.status(500).json({ error: 'Failed to generate employee ID' });
    }
    const newEmployee = new Employee({ employee_id, name, position, store, contact, date_hired, userId: req.user.id });
    const savedEmployee = await newEmployee.save();
    
    // Create notification for the user
    try {
      await createNotification(
        req.user.id,
        'New Employee Added',
        `A new employee "${name}" has been added to your team.`,
        'success',
        'employees'
      );
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the request if notification creation fails
    }
    
    res.status(201).json(savedEmployee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { name, position, store, contact, date_hired } = req.body;
    const updatedEmployee = await Employee.findOneAndUpdate(
      { employee_id: Number(req.params.id), userId: req.user.id },
      { name, position, store, contact, date_hired },
      { new: true, runValidators: true }
    );
    if (!updatedEmployee) return res.status(404).json({ error: 'Employee not found' });
    res.json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findOneAndDelete({ employee_id: Number(req.params.id), userId: req.user.id });
    if (!deletedEmployee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export employees to Excel
exports.exportEmployees = async (req, res) => {
  try {
    console.log('Starting employee export process...');
    
    // Get employees from database
    const employees = await Employee.find({ userId: req.user.id })
      .sort({ employee_id: 1 });
    
    if (!employees || employees.length === 0) {
      console.log('No employees found for user:', req.user.id);
      return res.status(404).json({ 
        error: 'No employees found to export',
        code: 'NO_EMPLOYEES_FOUND'
      });
    }
    
    console.log(`Found ${employees.length} employees to export`);
    
    try {
      // Format data for Excel with more detailed information
      const data = employees.map((emp, index) => ({
        '#': index + 1,
        'Employee ID': emp.employee_id || '',
        'Name': emp.name || '',
        'Position': emp.position || '',
        'Store': emp.store || '',
        'Contact': emp.contact || '',
        'Date Hired': emp.date_hired ? new Date(emp.date_hired).toISOString().split('T')[0] : '',
        'Created At': emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : '',
        'Created Time': emp.createdAt ? new Date(emp.createdAt).toLocaleTimeString() : ''
      }));
      
      console.log('Formatted data for Excel:', JSON.stringify(data[0], null, 2));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 8 },   // #
        { wch: 15 },  // Employee ID
        { wch: 25 },  // Name
        { wch: 20 },  // Position
        { wch: 20 },  // Store
        { wch: 20 },  // Contact
        { wch: 15 },  // Date Hired
        { wch: 15 },  // Created At
        { wch: 15 }   // Created Time
      ];
      ws['!cols'] = wscols;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      
      // Add summary sheet
      const summaryData = [
        ['Employees Summary'],
        [''],
        ['Total Employees', employees.length],
        [''],
        ['Generated On', new Date().toISOString().split('T')[0]],
        ['Generated At', new Date().toLocaleTimeString()]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      console.log('Excel workbook created');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'buffer',
        bookSST: false
      });
      
      console.log('Excel buffer generated, size:', buffer.length, 'bytes');
      
      // Set headers for file download
      const filename = `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Length', buffer.length);
      
      console.log('Sending file to client...');
      
      // Send the file
      return res.send(buffer);
      
    } catch (excelError) {
      console.error('Error generating Excel file:', excelError);
      throw new Error(`Failed to generate Excel file: ${excelError.message}`);
    }
    
  } catch (err) {
    console.error('Export error:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    
    // Check if headers have already been sent
    if (res.headersSent) {
      console.error('Headers already sent, cannot send error response');
      return res.end();
    }
    
    // Send appropriate error response
    const statusCode = err.statusCode || 500;
    const errorResponse = {
      success: false,
      error: err.message || 'Failed to export employees',
      code: err.code || 'EXPORT_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return res.status(statusCode).json(errorResponse);
  }
};

// Import employees from Excel
exports.importEmployees = async (req, res) => {
  try {
    console.log('Starting employee import process...');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ 
        error: 'No file uploaded',
        code: 'NO_FILE_UPLOADED'
      });
    }
    
    console.log('Processing uploaded file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // Read the Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (!data || data.length === 0) {
      console.log('No data found in the Excel file');
      return res.status(400).json({
        error: 'No data found in the Excel file',
        code: 'NO_DATA_FOUND'
      });
    }
    
    console.log(`Found ${data.length} records in the Excel file`);
    
    // Get all stores for this user to validate references
    const stores = await Store.find({ userId: req.user.id });
    const storeNames = stores.map(store => store.store_name);
    
    // Process each record
    const results = {
      total: data.length,
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel is 1-based and we have a header row
      
      try {
        // Validate required fields
        if (!row['Name'] || !row['Position'] || !row['Store'] || !row['Contact'] || !row['Date Hired']) {
          throw new Error('Missing required fields (Name, Position, Store, Contact, and Date Hired are required)');
        }
        
        // Validate store
        const storeName = row['Store'].toString().trim();
        if (!storeNames.includes(storeName)) {
          throw new Error(`Store "${storeName}" not found. Available stores: ${storeNames.join(', ')}`);
        }
        
        // Validate date
        const dateHired = new Date(row['Date Hired']);
        if (isNaN(dateHired.getTime())) {
          throw new Error('Invalid date format for Date Hired. Please use YYYY-MM-DD format.');
        }
        
        // Create new employee
        const employee_id = await getNextSequence('employee_id');
        if (!employee_id) {
          throw new Error('Failed to generate employee ID');
        }
        
        const newEmployee = new Employee({
          employee_id,
          name: row['Name'].toString().trim(),
          position: row['Position'].toString().trim(),
          store: storeName,
          contact: row['Contact'].toString().trim(),
          date_hired: dateHired,
          userId: req.user.id
        });
        
        await newEmployee.save();
        results.imported++;
        
      } catch (err) {
        console.error(`Error processing row ${rowNumber}:`, err);
        results.skipped++;
        results.errors.push({
          row: rowNumber,
          message: err.message,
          code: err.code || 'PROCESSING_ERROR'
        });
      }
    }
    
    console.log('Import completed:', results);
    
    // Prepare response
    const response = {
      success: true,
      message: `Import completed: ${results.imported} imported, ${results.skipped} skipped`,
      ...results
    };
    
    // If there were any errors, include them in the response
    if (results.errors.length > 0) {
      response.hasErrors = true;
      response.errorCount = results.errors.length;
    }
    
    res.json(response);
    
  } catch (err) {
    console.error('Import error:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to import employees',
      details: err.message,
      code: 'IMPORT_ERROR'
    });
  }
};

// Download employee import template
exports.downloadTemplate = async (req, res) => {
  try {
    console.log('Generating employee import template...');
    
    // Get actual stores for this user to include in template
    const stores = await Store.find({ userId: req.user.id }).limit(5);
    
    let templateData = [];
    
    // If user has existing data, use it in template
    if (stores.length > 0) {
      // Create sample data using actual user data
      templateData = [
        {
          'Name': 'John Doe',
          'Position': 'Manager',
          'Store': stores[0].store_name,
          'Contact': 'john.doe@example.com',
          'Date Hired': new Date().toISOString().split('T')[0]
        },
        {
          'Name': 'Jane Smith',
          'Position': 'Cashier',
          'Store': stores.length > 1 ? stores[1].store_name : stores[0].store_name,
          'Contact': 'jane.smith@example.com',
          'Date Hired': new Date().toISOString().split('T')[0]
        }
      ];
    } else {
      // Fallback to generic template if no data exists
      templateData = [
        {
          'Name': 'John Doe',
          'Position': 'Manager',
          'Store': 'Main Store',
          'Contact': 'john.doe@example.com',
          'Date Hired': new Date().toISOString().split('T')[0]
        },
        {
          'Name': 'Jane Smith',
          'Position': 'Cashier',
          'Store': 'Branch Store',
          'Contact': 'jane.smith@example.com',
          'Date Hired': new Date().toISOString().split('T')[0]
        }
      ];
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      { wch: 25 },  // Name
      { wch: 20 },  // Position
      { wch: 20 },  // Store
      { wch: 25 },  // Contact
      { wch: 15 }   // Date Hired
    ];
    ws['!cols'] = wscols;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    
    // Add instructions sheet
    const instructions = [
      ['Instructions for Importing Employees'],
      [''],
      ['1. Fill in the required fields: Name, Position, Store, Contact, and Date Hired'],
      ['2. Make sure all stores exist in the system'],
      ['3. Date Hired should be in YYYY-MM-DD format'],
      ['4. Contact can be email or phone number'],
      [''],
      ['Available Stores:'],
      ...stores.map(store => [store.store_name])
    ];
    
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer',
      bookSST: false
    });
    
    console.log('Template generated, size:', buffer.length, 'bytes');
    
    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="employee_import_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    
    // Send the file
    return res.send(buffer);
    
  } catch (err) {
    console.error('Template generation error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate template',
      details: err.message,
      code: 'TEMPLATE_ERROR'
    });
  }
};
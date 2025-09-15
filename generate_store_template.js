const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create sample store data
const stores = [
  { store_name: 'Main Store', location: 'New York, NY', manager: 'John Smith' },
  { store_name: 'Branch 1', location: 'Los Angeles, CA', manager: 'Jane Doe' },
  { store_name: 'Branch 2', location: 'Chicago, IL', manager: 'Robert Johnson' },
  { store_name: 'Branch 3', location: 'Houston, TX', manager: 'Emily Davis' },
  { store_name: 'Branch 4', location: 'Phoenix, AZ', manager: 'Michael Wilson' }
];

// Create a new workbook
const wb = XLSX.utils.book_new();

// Create a worksheet from the data
const ws = XLSX.utils.json_to_sheet(stores);

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(wb, ws, 'Stores');

// Write to file
const filePath = path.join(__dirname, 'Landing', 'public', 'store_import_template.xlsx');
XLSX.writeFile(wb, filePath);

console.log('✅ Store import template created successfully!');
console.log(`📁 Template saved to: ${filePath}`);
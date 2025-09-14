const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create a new workbook
const wb = XLSX.utils.book_new();

// Sample data for the template
const sampleData = [
  { category_name: 'Electronics', description: 'Electronic devices and accessories' },
  { category_name: 'Clothing', description: 'Apparel and fashion items' },
  { category_name: 'Books', description: 'Educational and recreational books' },
  { category_name: 'Home & Kitchen', description: 'Household and kitchen items' }
];

// Create a worksheet
const ws = XLSX.utils.json_to_sheet(sampleData);

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(wb, ws, 'Categories_Template');

// Write the workbook to a file
const templatePath = path.join(__dirname, 'Landing', 'public', 'category_import_template.xlsx');
XLSX.writeFile(wb, templatePath);

console.log('✅ Category import template created successfully!');
console.log(`📁 Template saved to: ${templatePath}`);
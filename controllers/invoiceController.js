const Invoice = require('../models/Invoice');
const Sale = require('../models/Sale');
const Business = require('../models/Business');
const getNextSequence = require('../getNextSequence');

// Get business information for invoices
const getBusinessInfo = async (userId) => {
  try {
    const business = await Business.findOne({ userId });
    
    if (!business) {
      // Return default business info if none found
      return {
        name: 'KaydPal Business Management',
        address: '123 Business Street',
        city: 'City, State 12345',
        phone: '(555) 123-4567',
        email: 'info@kaydpal.com'
      };
    }
    
    // Return business info with proper formatting
    return {
      name: business.name || 'KaydPal Business Management',
      logo: business.logo || '',
      address: business.address || '',
      city: business.city || '',
      state: business.state || '',
      zipCode: business.zipCode || '',
      country: business.country || '',
      phone: business.phone || '',
      email: business.email || '',
      website: business.website || '',
      taxId: business.taxId || '',
      registrationNumber: business.registrationNumber || ''
    };
  } catch (err) {
    // Return default business info if error occurs
    return {
      name: 'KaydPal Business Management',
      address: '123 Business Street',
      city: 'City, State 12345',
      phone: '(555) 123-4567',
      email: 'info@kaydpal.com'
    };
  }
};

// Create invoice (usually called after a sale)
exports.createInvoice = async (req, res) => {
  try {
    const { sale_id } = req.body;
    if (!sale_id) return res.status(400).json({ error: 'sale_id is required' });
    const sale = await Sale.findById(sale_id).lean();
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    const invoice_no = await getNextSequence('invoice_no');
    // Fetch customer details
    let customerDoc = null;
    try {
      customerDoc = await require('../models/Customer').findOne({ customer_no: sale.customer_no, userId: req.user.id });
    } catch {}
    // Fetch product names for all items
    const Product = require('../models/Product');
    const productMap = {};
    for (const item of sale.items) {
      if (!productMap[item.product_no]) {
        const productDoc = await Product.findOne({ product_no: item.product_no, userId: req.user.id });
        productMap[item.product_no] = productDoc ? productDoc.product_name : (item.product_name || '');
      }
    }
    const items = sale.items.map(item => ({
      ...item,
      name: productMap[item.product_no] || item.product_name || item.product_no || ''
    }));
    const subtotal = items.reduce((sum, i) => sum + (i.qty * i.price), 0);
    const total_discount = items.reduce((sum, i) => sum + (i.discount || 0), 0);
    const total_tax = items.reduce((sum, i) => sum + (i.tax || 0), 0);
    const total = subtotal - total_discount + total_tax;
    const paid = sale.paid || 0;
    const balance_due = total - paid;
    const status = paid >= total ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
    
    // Get business information
    const businessInfo = await getBusinessInfo(req.user.id);
    
    const invoice = new Invoice({
      invoice_no,
      sale_id,
      date: new Date(),
      customer: {
        customer_no: sale.customer_no,
        name: customerDoc ? (customerDoc.name || customerDoc.customer_name) : (sale.customer_name || sale.customer_no || ''),
        address: customerDoc ? customerDoc.address : (sale.customer_address || ''),
        phone: customerDoc ? customerDoc.phone : (sale.customer_phone || ''),
        email: customerDoc ? customerDoc.email : (sale.customer_email || '')
      },
      businessInfo,
      items,
      subtotal,
      total_discount,
      total_tax,
      total,
      paid,
      balance_due,
      status,
      notes: sale.notes || '',
      userId: req.user.id
    });
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single invoice
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update invoice (optional)
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete invoice (optional)
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const Invoice = require('../models/Invoice');
const Sale = require('../models/Sale');
const getNextSequence = require('../getNextSequence');

// Create invoice (usually called after a sale)
exports.createInvoice = async (req, res) => {
  try {
    const { sale_id } = req.body;
    if (!sale_id) return res.status(400).json({ error: 'sale_id is required' });
    const sale = await Sale.findById(sale_id).lean();
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    // Prepare invoice fields from sale
    const invoice_no = await getNextSequence('invoice_no');
    const customer = sale.customer || {};
    const items = sale.items || [{
      product_no: sale.product_no,
      name: sale.product_name || '',
      qty: sale.qty,
      price: sale.price,
      discount: sale.discount || 0,
      tax: sale.tax || 0,
      subtotal: (sale.qty * sale.price) - (sale.discount || 0) + (sale.tax || 0)
    }];
    const subtotal = items.reduce((sum, i) => sum + (i.qty * i.price), 0);
    const total_discount = items.reduce((sum, i) => sum + (i.discount || 0), 0);
    const total_tax = items.reduce((sum, i) => sum + (i.tax || 0), 0);
    const total = subtotal - total_discount + total_tax;
    const paid = sale.paid || 0;
    const balance_due = total - paid;
    const status = paid >= total ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
    const invoice = new Invoice({
      invoice_no,
      sale_id,
      date: new Date(),
      customer: {
        customer_no: sale.customer_no,
        name: sale.customer_name || '',
        address: sale.customer_address || '',
        phone: sale.customer_phone || '',
        email: sale.customer_email || ''
      },
      items,
      subtotal,
      total_discount,
      total_tax,
      total,
      paid,
      balance_due,
      status,
      notes: sale.notes || ''
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
    const invoices = await Invoice.find().sort({ date: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single invoice
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update invoice (optional)
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete invoice (optional)
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
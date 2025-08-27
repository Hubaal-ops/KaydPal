import React, { useState, useEffect } from 'react';
import styles from './Sales.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search, CheckCircle, XCircle, Truck, Clock } from 'lucide-react';
import { 
  getSales, 
  addSale, 
  updateSale, 
  deleteSale, 
  confirmSale, 
  cancelSale, 
  deliverSale, 
  getStatusInfo 
} from '../services/salesService';
import { getProducts } from '../services/productService';
import { getStores } from '../services/storeService';
import { getAccounts } from '../services/accountService';
import { getCustomers } from '../services/customerService';
import InvoiceList from './InvoiceList';
import InvoiceDetail from './InvoiceDetail';
import { createInvoice, getInvoices } from '../services/invoiceService';

const Sales = ({ onBack }) => {
  const [tab, setTab] = useState('sales'); // 'sales' or 'invoices'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    items: [
      { product_no: '', qty: 1, price: 0, discount: 0, tax: 0 }
    ],
    customer_no: '',
    store_no: '',
    paid: 0,
    account_id: '',
    status: 'draft',
    notes: '',
    delivery_date: ''
  });
  const [editingSale, setEditingSale] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all data from backend
  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [salesData, productsData, storesData, accountsData, customersData] = await Promise.all([
        getSales(),
        getProducts(),
        getStores(),
        getAccounts(),
        getCustomers()
      ]);
      setSales(salesData);
      console.log('Sales loaded in frontend:', salesData);
      setProducts(productsData);
      setStores(storesData);
      setAccounts(accountsData);
      setCustomers(customersData);
    } catch (err) {
      setError(err.message || 'Error fetching sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleViewTable = () => {
    setViewMode('table');
    setEditingSale(null);
    setFormData({
      items: [{ product_no: '', qty: 1, price: 0, discount: 0, tax: 0 }],
      customer_no: '',
      store_no: '',
      paid: 0,
      account_id: '',
      status: 'draft',
      notes: '',
      delivery_date: ''
    });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingSale(null);
    setFormData({
      items: [{ product_no: '', qty: 1, price: 0, discount: 0, tax: 0 }],
      customer_no: '',
      store_no: '',
      paid: 0,
      account_id: '',
      status: 'draft',
      notes: '',
      delivery_date: ''
    });
    setError('');
    setSuccess('');
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setFormData({
      items: sale.items || [{ product_no: '', qty: 1, price: 0, discount: 0, tax: 0 }],
      customer_no: sale.customer_no,
      store_no: sale.store_no,
      paid: sale.paid,
      account_id: sale.account_id,
      status: sale.status || 'draft',
      notes: sale.notes || '',
      delivery_date: sale.delivery_date ? new Date(sale.delivery_date).toISOString().split('T')[0] : ''
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (sale_no) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        await deleteSale(sale_no);
        await fetchAll();
        setSuccess('Sale deleted successfully');
      } catch (err) {
        setError(err.message || 'Error deleting sale');
      } finally {
        setLoading(false);
      }
    }
  };

  // Status action handlers
  const handleConfirmSale = async (sale) => {
    if (window.confirm('Are you sure you want to confirm this sale? This will apply inventory and financial effects.')) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        await confirmSale(sale.sale_no || sale.sel_no);
        await fetchAll();
        setSuccess('Sale confirmed successfully');
      } catch (err) {
        setError(err.message || 'Error confirming sale');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelSale = async (sale) => {
    if (window.confirm('Are you sure you want to cancel this sale? This will reverse any applied effects.')) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        await cancelSale(sale.sale_no || sale.sel_no);
        await fetchAll();
        setSuccess('Sale cancelled successfully');
      } catch (err) {
        setError(err.message || 'Error cancelling sale');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeliverSale = async (sale) => {
    const deliveryDate = prompt('Enter delivery date (YYYY-MM-DD) or leave empty for today:', new Date().toISOString().split('T')[0]);
    if (deliveryDate !== null) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        await deliverSale(sale.sale_no || sale.sel_no, deliveryDate || undefined);
        await fetchAll();
        setSuccess('Sale marked as delivered successfully');
      } catch (err) {
        setError(err.message || 'Error marking sale as delivered');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleItemChange = (idx, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const items = prev.items.map((item, i) =>
        i === idx ? { ...item, [name]: name === 'product_no' ? Number(value) : Number(value) } : item
      );
      return { ...prev, items };
    });
  };
  const handleAddItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { product_no: '', qty: 1, price: 0, discount: 0, tax: 0 }] }));
  };
  const handleRemoveItem = (idx) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    // Frontend validation
    if (!formData.customer_no || !formData.store_no || !formData.account_id) {
      setError('Please select customer, store, and account.');
      setLoading(false);
      return;
    }
    if (!formData.items || !Array.isArray(formData.items) || formData.items.length === 0) {
      setError('Please add at least one sale item.');
      setLoading(false);
      return;
    }
    for (const item of formData.items) {
      if (!item.product_no || Number(item.qty) <= 0 || Number(item.price) <= 0) {
        setError('Each item must have a product, quantity > 0, and price > 0.');
        setLoading(false);
        return;
      }
    }
    try {
      let result;
      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          product_no: Number(item.product_no),
          qty: Number(item.qty),
          price: Number(item.price),
          discount: Number(item.discount),
          tax: Number(item.tax)
        })),
        paid: Number(formData.paid),
        customer_no: Number(formData.customer_no),
        store_no: Number(formData.store_no),
        account_id: Number(formData.account_id),
        status: formData.status,
        notes: formData.notes,
        delivery_date: formData.delivery_date || undefined
      };
      if (editingSale) {
        result = await updateSale(editingSale.sel_no, payload);
        setSuccess('Sale updated successfully');
      } else {
        result = await addSale(payload);
        setSuccess('Sale added successfully');
        // Fetch the invoice for this sale and display it
        try {
          let invoiceResult = null;
          if (result && result._id) {
            // Try to create invoice (if not already created)
            await createInvoice({ sale_id: result._id });
            // Fetch invoice by sale_id
            const invoices = await getInvoices();
            invoiceResult = invoices.find(inv => inv.sale_id === result._id || inv.sel_no === result.sel_no);
          }
          if (invoiceResult) {
            setTab('invoices');
            setSelectedInvoice(invoiceResult);
          }
        } catch (invErr) {
          console.error('Invoice creation failed:', invErr);
        }
      }
      fetchAll();
      setViewMode('table');
      setEditingSale(null);
      setFormData({
        items: [{ product_no: '', qty: 1, price: 0, discount: 0, tax: 0 }],
        customer_no: '',
        store_no: '',
        paid: 0,
        account_id: '',
        status: 'draft',
        notes: '',
        delivery_date: ''
      });
    } catch (err) {
      setError(err.message || 'Error saving sale');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (["qty", "price", "discount", "tax"].includes(name)) {
        const qty = parseInt(updated.qty) || 0;
        const price = parseFloat(updated.price) || 0;
        const discount = parseFloat(updated.discount) || 0;
        const tax = parseFloat(updated.tax) || 0;
        updated.amount = qty * price - discount + tax;
      }
      return updated;
    });
  };

  // Map sales to include product_name, customer_name, store_name if missing
  const mappedSales = sales.map(sale => {
    // Map product names
    let productNames = '';
    if (Array.isArray(sale.items)) {
      productNames = sale.items.map(i => {
        const prod = products.find(p => p.product_no === i.product_no);
        return prod ? prod.product_name : i.product_no;
      }).join(', ');
    } else {
      productNames = sale.product_name || '';
    }
    // Map customer name
    const customerObj = customers.find(c => c.customer_no === sale.customer_no);
    const customerName = customerObj ? (customerObj.name || customerObj.customer_name) : sale.customer_name || sale.customer_no;
    // Map store name
    const storeObj = stores.find(s => s.store_no === sale.store_no);
    const storeName = storeObj ? storeObj.store_name : sale.store_name || sale.store_no;
    // Map account name
    const accountObj = accounts.find(a => a.account_id === sale.account_id);
    const accountName = accountObj ? (accountObj.name || accountObj.account_name) : sale.account_name || sale.account_id;
    return {
      ...sale,
      product_name: productNames,
      customer_name: customerName,
      store_name: storeName,
      account_name: accountName
    };
  });

  const filteredSales = mappedSales.filter(sale =>
    (sale.product_name && sale.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.store_name && sale.store_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- Sale Items State and Logic ---
  const [saleItems, setSaleItems] = useState([
    { store: '', product: '', qty: 1, price: 0, discount: 0, tax: 0, total: 0 }
  ]);

  // Helper to filter products by store
  const getProductsForStore = (storeNo) => products.filter(p => p.store_no === storeNo);

  // Handle changes in sale item fields
  const handleSaleItemChange = (idx, field, value) => {
    setSaleItems(items => items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      // Autofill price when product changes
      if (field === 'product') {
        const prod = products.find(p => p.product_no === value);
        if (prod) updated.price = prod.unit_price || 0;
      }
      updated.total = (updated.qty * updated.price - updated.discount + +updated.tax).toFixed(2);
      return updated;
    }));
  };

  // Add new sale item row
  const handleAddSaleItem = () => {
    setSaleItems(items => ([...items, { store: '', product: '', qty: 1, price: 0, discount: 0, tax: 0, total: 0 }]));
  };

  // Remove sale item row
  const handleRemoveSaleItem = idx => {
    setSaleItems(items => items.filter((_, i) => i !== idx));
  };

  // Calculate grand total
  const grandTotal = saleItems.reduce((sum, item) => sum + parseFloat(item.total || 0), 0).toFixed(2);

  // Tab UI
  return (
    <div className={styles.sales}>
      <div className={styles['sales-header']}>
        <button className={styles['back-button']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Transactions
        </button>
        <h1>Sales Management</h1>
        <p>Manage and record product sales</p>
      </div>
      <div className={styles['sales-content']}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <button onClick={() => { setTab('sales'); setSelectedInvoice(null); }} style={{ fontWeight: tab === 'sales' ? 'bold' : 'normal' }}>Sales</button>
          <button onClick={() => { setTab('invoices'); setSelectedInvoice(null); }} style={{ fontWeight: tab === 'invoices' ? 'bold' : 'normal' }}>Invoices</button>
        </div>
        {tab === 'sales' && (
          <div className={styles['action-buttons']}>
            <button
              className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`}
              onClick={handleViewTable}
              title="View Table"
            >
              <Eye size={20} />
              View Table
            </button>
            <button
              className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`}
              onClick={handleAddNew}
              title="Add New Sale"
            >
              <Plus size={20} />
              Add New Sale
            </button>
          </div>
        )}
        {tab === 'invoices' && !selectedInvoice && (
          <InvoiceList onView={setSelectedInvoice} />
        )}
        {tab === 'invoices' && selectedInvoice && (
          <InvoiceDetail invoice={selectedInvoice} onBack={() => setSelectedInvoice(null)} />
        )}
        {tab === 'sales' && (
          <>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}
            {viewMode === 'table' && (
              <div className={styles['table-container']}>
                <div className={styles['table-header']}>
                  <div className={styles['search-container']}>
                    <Search size={20} />
                    <input
                      type="text"
                      placeholder="Search sales..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles['search-input']}
                    />
                  </div>
                  <div className={styles['table-info']}>
                    {filteredSales.length} sales found
                  </div>
                </div>
                {loading ? (
                  <div className={styles.loading}>Loading sales...</div>
                ) : (
                  <div className={styles['table-wrapper']}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Product</th>
                          <th>Customer</th>
                          <th>Store</th>
                          <th>Status</th>
                          <th>Qty</th>
                          <th>Subtotal</th>
                          <th>Tax</th>
                          <th>Total</th>
                          <th>Paid</th>
                          <th>Balance</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((sale) => {
                          const statusInfo = getStatusInfo(sale.status || 'draft');
                          const saleId = sale.sale_no || sale.sel_no;
                          
                          return (
                            <tr key={saleId}>
                              <td>{saleId}</td>
                              <td>{Array.isArray(sale.items) ? sale.items.map(i => products.find(p => p.product_no === i.product_no)?.product_name || i.product_no).join(', ') : sale.product_name}</td>
                              <td>{sale.customer_name}</td>
                              <td>{sale.store_name}</td>
                              <td>
                                <span 
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: statusInfo.color,
                                    backgroundColor: statusInfo.bgColor
                                  }}
                                >
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td>{Array.isArray(sale.items) ? sale.items.reduce((sum, i) => sum + (i.qty || 0), 0) : sale.qty}</td>
                              <td>${(sale.subtotal || 0).toFixed(2)}</td>
                              <td>${(sale.total_tax || 0).toFixed(2)}</td>
                              <td>${(sale.amount || 0).toFixed(2)}</td>
                              <td>${(sale.paid || 0).toFixed(2)}</td>
                              <td>${(sale.balance_due !== undefined ? sale.balance_due : (sale.amount - sale.paid)).toFixed(2)}</td>
                              <td>{sale.sel_date ? new Date(sale.sel_date).toLocaleDateString() : ''}</td>
                              <td>
                                <div className={styles['action-icons']}>
                                  {/* Status-based action buttons */}
                                  {sale.status === 'draft' && (
                                    <button
                                      onClick={() => handleConfirmSale(sale)}
                                      className={styles['icon-btn']}
                                      title="Confirm Sale"
                                      style={{ color: '#3b82f6' }}
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                  )}
                                  {sale.status === 'confirmed' && (
                                    <button
                                      onClick={() => handleDeliverSale(sale)}
                                      className={styles['icon-btn']}
                                      title="Mark as Delivered"
                                      style={{ color: '#10b981' }}
                                    >
                                      <Truck size={16} />
                                    </button>
                                  )}
                                  {['draft', 'confirmed'].includes(sale.status) && (
                                    <button
                                      onClick={() => handleCancelSale(sale)}
                                      className={styles['icon-btn']}
                                      title="Cancel Sale"
                                      style={{ color: '#ef4444' }}
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  )}
                                  
                                  {/* Standard edit/delete buttons */}
                                  <button
                                    onClick={() => handleEdit(sale)}
                                    className={styles['icon-btn']}
                                    title="Edit Sale"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(saleId)}
                                    className={`${styles['icon-btn']} ${styles.delete}`}
                                    title="Delete Sale"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredSales.length === 0 && (
                      <div className={styles['no-data']}>
                        {searchTerm ? 'No sales found matching your search' : 'No sales found'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {viewMode === 'form' && (
              <div className={styles['form-container']}>
                <h2>{editingSale ? 'Edit Sale' : 'Add New Sale'}</h2>
                <form onSubmit={handleSubmit} className={`${styles.form} ${styles['form-grid']}`}>
                  <div style={{ gridColumn: '1 / -1', marginBottom: 16 }}>
                    <b>Sale Items</b>
                    <table className={styles.table} style={{ marginBottom: 8 }}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Discount</th>
                          <th>Tax</th>
                          <th>Subtotal</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => {
                          const subtotal = (Number(item.qty) * Number(item.price) - Number(item.discount) + Number(item.tax)).toFixed(2);
                          return (
                            <tr key={idx}>
                              <td>
                                <select name="product_no" value={item.product_no} onChange={e => handleItemChange(idx, e)} required className={styles['form-select']} style={{ minWidth: 120 }}>
                                  <option value="">Product</option>
                                  {products.map(p => (<option key={p.product_no} value={p.product_no}>{p.product_name}</option>))}
                                </select>
                              </td>
                              <td><input type="number" name="qty" value={item.qty} onChange={e => handleItemChange(idx, e)} min="1" placeholder="Qty" className={styles['form-input']} style={{ width: 60 }} /></td>
                              <td><input type="number" name="price" value={item.price} onChange={e => handleItemChange(idx, e)} min="0" placeholder="Price" className={styles['form-input']} style={{ width: 80 }} /></td>
                              <td><input type="number" name="discount" value={item.discount} onChange={e => handleItemChange(idx, e)} min="0" placeholder="Discount" className={styles['form-input']} style={{ width: 80 }} /></td>
                              <td><input type="number" name="tax" value={item.tax} onChange={e => handleItemChange(idx, e)} min="0" placeholder="Tax" className={styles['form-input']} style={{ width: 80 }} /></td>
                              <td style={{ fontWeight: 600 }}>${subtotal}</td>
                              <td>{formData.items.length > 1 && <button type="button" onClick={() => handleRemoveItem(idx)} style={{ color: 'red', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }}>×</button>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <button type="button" onClick={handleAddItem} style={{ marginTop: 4, marginBottom: 8 }}>+ Add Item</button>
                  </div>
                  <div className={styles['form-group']}>
                    <div style={{ display: 'flex', gap: 32 }}>
                      <div className={styles['form-group']}>
                        <label htmlFor="customer_no">Customer *</label>
                        <select id="customer_no" name="customer_no" value={formData.customer_no} onChange={handleInputChange} required className={styles['form-select']}>
                          <option value="">Select a customer</option>
                          {customers.map((customer) => (
                            <option key={customer.customer_no} value={customer.customer_no}>
                              {customer.name || customer.customer_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles['form-group']}>
                        <label htmlFor="store_no">Store *</label>
                        <select id="store_no" name="store_no" value={formData.store_no} onChange={handleInputChange} required className={styles['form-select']}>
                          <option value="">Select a store</option>
                          {stores.map((store) => (
                            <option key={store.store_no} value={store.store_no}>
                              {store.store_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles['form-group']}>
                        <label htmlFor="account_id">Account *</label>
                        <select id="account_id" name="account_id" value={formData.account_id} onChange={handleInputChange} required className={styles['form-select']}>
                          <option value="">Select an account</option>
                          {accounts.map((account) => (
                            <option key={account.account_id} value={account.account_id}>
                              {account.name || account.account_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles['form-group']}>
                        <label htmlFor="status">Status *</label>
                        <select id="status" name="status" value={formData.status} onChange={handleInputChange} required className={styles['form-select']}>
                          <option value="draft">Draft</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <small style={{ color: '#6b7280', fontSize: '12px' }}>
                          {formData.status === 'draft' && 'Draft sales don\'t affect inventory'}
                          {formData.status === 'confirmed' && 'Confirmed sales will decrease inventory'}
                          {formData.status === 'delivered' && 'Delivered sales are completed'}
                          {formData.status === 'cancelled' && 'Cancelled sales reverse all effects'}
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className={styles['form-group']}>
                    {/* Removed duplicate Account dropdown for design consistency */}
                  </div>
                  
                  {/* Additional fields for enhanced sale management */}
                  <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <div className={styles['form-group']}>
                      <label htmlFor="notes">Notes</label>
                      <textarea 
                        id="notes" 
                        name="notes" 
                        value={formData.notes} 
                        onChange={handleInputChange} 
                        className={styles['form-textarea']} 
                        placeholder="Additional notes about this sale..."
                        rows="3"
                      />
                    </div>
                    <div className={styles['form-group']}>
                      <label htmlFor="delivery_date">Delivery Date</label>
                      <input 
                        type="date" 
                        id="delivery_date" 
                        name="delivery_date" 
                        value={formData.delivery_date} 
                        onChange={handleInputChange} 
                        className={styles['form-input']} 
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px' }}>
                        Set expected or actual delivery date
                      </small>
                    </div>
                  </div>
                  {/* Total, Tax, Paid at the last row */}
                  <div style={{ gridColumn: '1 / -1', marginTop: 24, display: 'flex', justifyContent: 'center', gap: 32, alignItems: 'center', fontWeight: 700, fontSize: 16 }}>
                    <span>Total Items: {formData.items.reduce((sum, item) => sum + Number(item.qty), 0)}</span>
                    <span>Subtotal: ${formData.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0).toFixed(2)}</span>
                    <span>Total Discount: ${formData.items.reduce((sum, item) => sum + Number(item.discount), 0).toFixed(2)}</span>
                    <span>Total Tax: ${formData.items.reduce((sum, item) => sum + Number(item.tax), 0).toFixed(2)}</span>
                    <span style={{ fontSize: 18, color: '#059669' }}>Grand Total: ${formData.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price) - Number(item.discount) + Number(item.tax)), 0).toFixed(2)}</span>
                    <span>Paid: <input type="number" id="paid" name="paid" value={formData.paid} onChange={handleInputChange} min="0" className={styles['form-input']} style={{ width: 120, fontWeight: 700, fontSize: 16 }} /></span>
                    <span style={{ color: formData.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price) - Number(item.discount) + Number(item.tax)), 0) - Number(formData.paid) > 0 ? '#dc2626' : '#059669' }}>Balance Due: ${(formData.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price) - Number(item.discount) + Number(item.tax)), 0) - Number(formData.paid)).toFixed(2)}</span>
                  </div>
                  <div className={styles['form-group']}>
                    {/* Removed bottom Account dropdown for design consistency */}
                  </div>
                  <div className={styles['form-actions']} style={{ gridColumn: '1 / -1' }}>
                    <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                      Cancel
                    </button>
                    <button type="submit" className={styles['submit-btn']}>
                      {editingSale ? 'Update Sale' : 'Add Sale'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sales; 
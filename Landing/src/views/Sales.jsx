import React, { useState, useEffect } from 'react';
import styles from './Sales.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { getSales, addSale, updateSale, deleteSale } from '../services/salesService';
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
    account_id: ''
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
      account_id: ''
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
      account_id: ''
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
      account_id: sale.account_id
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (sel_no) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        await deleteSale(sel_no);
        await fetchAll();
        setSuccess('Sale deleted successfully');
      } catch (err) {
        setError(err.message || 'Error deleting sale');
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
        account_id: Number(formData.account_id)
      };
      if (editingSale) {
        result = await updateSale(editingSale.sel_no, payload);
        setSuccess('Sale updated successfully');
      } else {
        result = await addSale(payload);
        setSuccess('Sale added successfully');
        const invoices = await getInvoices();
        const latestInvoice = invoices
          .filter(inv => inv.customer?.customer_no === Number(formData.customer_no))
          .sort((a, b) => b.invoice_no - a.invoice_no)[0];
        if (latestInvoice) {
          setTab('invoices');
          setSelectedInvoice(latestInvoice);
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
        account_id: ''
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

  const filteredSales = sales.filter(sale =>
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
            >
              <Eye size={20} />
              View Table
            </button>
            <button
              className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`}
              onClick={handleAddNew}
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
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Discount</th>
                          <th>Tax</th>
                          <th>Amount</th>
                          <th>Paid</th>
                          <th>Account</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((sale) => (
                          <tr key={sale.sel_no}>
                            <td>{sale.sel_no}</td>
                            <td>{Array.isArray(sale.items) ? sale.items.map(i => products.find(p => p.product_no === i.product_no)?.product_name || i.product_no).join(', ') : sale.product_name}</td>
                            <td>{sale.customer_name}</td>
                            <td>{sale.store_name}</td>
                            <td>{Array.isArray(sale.items) ? sale.items.reduce((sum, i) => sum + (i.qty || 0), 0) : sale.qty}</td>
                            <td>{Array.isArray(sale.items) ? sale.items.map(i => i.price).join(', ') : sale.price}</td>
                            <td>{Array.isArray(sale.items) ? sale.items.map(i => i.discount).join(', ') : sale.discount}</td>
                            <td>{Array.isArray(sale.items) ? sale.items.map(i => i.tax).join(', ') : sale.tax}</td>
                            <td>{sale.amount}</td>
                            <td>{sale.paid}</td>
                            <td>{sale.account_name}</td>
                            <td>{sale.sel_date ? new Date(sale.sel_date).toLocaleDateString() : ''}</td>
                            <td>
                              <div className={styles['action-icons']}>
                                <button
                                  onClick={() => handleEdit(sale)}
                                  className={styles['icon-btn']}
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(sale.sel_no)}
                                  className={`${styles['icon-btn']} ${styles.delete}`}
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
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
                    {/* Header row for sale item inputs */}
                    <div style={{ display: 'flex', gap: 8, fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ minWidth: 120 }}>Product</span>
                      <span style={{ width: 60 }}>Qty</span>
                      <span style={{ width: 80 }}>Price</span>
                      <span style={{ width: 80 }}>Discount</span>
                      <span style={{ width: 80 }}>Tax</span>
                    </div>
                    {formData.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <select name="product_no" value={item.product_no} onChange={e => handleItemChange(idx, e)} required className={styles['form-select']} style={{ minWidth: 120 }}>
                          <option value="">Product</option>
                          {products.map(p => (<option key={p.product_no} value={p.product_no}>{p.product_name}</option>))}
                        </select>
                        <input type="number" name="qty" value={item.qty} onChange={e => handleItemChange(idx, e)} min="1" placeholder="Qty" className={styles['form-input']} style={{ width: 60 }} />
                        <input type="number" name="price" value={item.price} onChange={e => handleItemChange(idx, e)} min="0" placeholder="Price" className={styles['form-input']} style={{ width: 80 }} />
                        <input type="number" name="discount" value={item.discount} onChange={e => handleItemChange(idx, e)} min="0" placeholder="Discount" className={styles['form-input']} style={{ width: 80 }} />
                        <input type="number" name="tax" value={item.tax} onChange={e => handleItemChange(idx, e)} min="0" placeholder="Tax" className={styles['form-input']} style={{ width: 80 }} />
                        {formData.items.length > 1 && <button type="button" onClick={() => handleRemoveItem(idx)} style={{ color: 'red', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }}>×</button>}
                      </div>
                    ))}
                    <button type="button" onClick={handleAddItem} style={{ marginTop: 4, marginBottom: 8 }}>+ Add Item</button>
                  </div>
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
                    <label htmlFor="paid">Paid</label>
                    <input type="number" id="paid" name="paid" value={formData.paid} onChange={handleInputChange} min="0" className={styles['form-input']} />
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
            {viewMode === 'form' && (
              <div style={{ margin: '2rem 0', padding: '1rem', border: '1px solid #eee', borderRadius: 8, background: '#fafbfc' }}>
                <h3>Sale Items</h3>
                <table style={{ width: '100%', marginBottom: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Store</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Tax</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleItems.map((item, idx) => (
                      <tr key={idx}>
                        {/* Store selector */}
                        <td>
                          <select value={item.store} onChange={e => handleSaleItemChange(idx, 'store', e.target.value)}>
                            <option value="">Store</option>
                            {stores.map(store => (
                              <option key={store.store_no} value={store.store_no}>{store.name || store.store_no}</option>
                            ))}
                          </select>
                        </td>
                        {/* Product selector, filtered by store */}
                        <td>
                          <select value={item.product} onChange={e => handleSaleItemChange(idx, 'product', e.target.value)}>
                            <option value="">Product</option>
                            {getProductsForStore(item.store).map(product => (
                              <option key={product.product_no} value={product.product_no}>{product.name || product.product_no}</option>
                            ))}
                          </select>
                        </td>
                        {/* Qty */}
                        <td>
                          <input type="number" min="1" value={item.qty} onChange={e => handleSaleItemChange(idx, 'qty', +e.target.value)} />
                        </td>
                        {/* Price */}
                        <td>
                          <input type="number" min="0" value={item.price} onChange={e => handleSaleItemChange(idx, 'price', +e.target.value)} />
                        </td>
                        {/* Discount */}
                        <td>
                          <input type="number" min="0" value={item.discount} onChange={e => handleSaleItemChange(idx, 'discount', +e.target.value)} />
                        </td>
                        {/* Tax */}
                        <td>
                          <input type="number" min="0" value={item.tax} onChange={e => handleSaleItemChange(idx, 'tax', +e.target.value)} />
                        </td>
                        {/* Total (read only) */}
                        <td>
                          <input type="text" value={item.total} readOnly />
                        </td>
                        {/* Remove button */}
                        <td>
                          <button type="button" onClick={() => handleRemoveSaleItem(idx)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={handleAddSaleItem}>+ Add Item</button>
                <div style={{ marginTop: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: 18 }}>
                  Total: <input type="text" value={grandTotal} readOnly style={{ width: 120, background: '#f0f0f0', textAlign: 'right', fontWeight: 'bold', fontSize: 18 }} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sales; 
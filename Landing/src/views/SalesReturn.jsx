import React, { useState, useEffect } from 'react';
import salesStyles from './Sales.module.css';
import returnStyles from './SalesReturn.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { getSalesReturns, createSalesReturn, updateSalesReturn, deleteSalesReturn } from '../services/salesReturnService';
import { getProducts } from '../services/productService';
import { getCustomers } from '../services/customerService';
import { getStores } from '../services/storeService';
import { getAccounts } from '../services/accountService';
import { getSales } from '../services/salesService';

const SalesReturn = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table');
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sel_no: '',
    product_no: '',
    customer_no: '',
    store_no: '',
    qty: 1,
    price: 0,
    amount: 0,
    paid: 0,
    reason: '',
    account_id: ''
  });
  const [editingReturn, setEditingReturn] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [returnsData, productsData, customersData, storesData, accountsData, salesData] = await Promise.all([
          getSalesReturns(),
          getProducts(),
          getCustomers(),
          getStores(),
          getAccounts(),
          getSales()
        ]);
        setReturns(Array.isArray(returnsData) ? returnsData : (returnsData.data || []));
        setProducts(productsData.data || productsData);
        setCustomers(customersData.data || customersData);
        setStores(storesData.data || storesData);
        setAccounts(accountsData.data || accountsData);
        setSales(salesData.data || salesData);
      } catch (err) {
        setError('Error loading sales returns or dropdown data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleViewTable = () => {
    setViewMode('table');
    setEditingReturn(null);
    setFormData({
      sel_no: '',
      product_no: '',
      customer_no: '',
      store_no: '',
      qty: 1,
      price: 0,
      amount: 0,
      paid: 0,
      reason: '',
      account_id: ''
    });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingReturn(null);
    setFormData({
      sel_no: '',
      product_no: '',
      customer_no: '',
      store_no: '',
      qty: 1,
      price: 0,
      amount: 0,
      paid: 0,
      reason: '',
      account_id: ''
    });
    setError('');
    setSuccess('');
  };

  const handleEdit = (ret) => {
    setEditingReturn(ret);
    setFormData({
      sel_no: ret.sel_no,
      product_no: ret.product_no,
      customer_no: ret.customer_no,
      store_no: ret.store_no,
      qty: ret.qty,
      price: ret.price,
      amount: ret.amount,
      paid: ret.paid,
      reason: ret.reason,
      account_id: ret.account_id || ''
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sales return?')) {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        await deleteSalesReturn(id);
        setSuccess('Sales return deleted successfully');
        const data = await getSalesReturns();
        setReturns(Array.isArray(data) ? data : (data.data || []));
      } catch (err) {
        setError(typeof err === 'string' ? err : (err.message || 'Error deleting sales return'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const calcAmount = (parseInt(formData.qty) || 0) * (parseFloat(formData.price) || 0);
    const payload = {
      ...formData,
      sel_no: Number(formData.sel_no),
      product_no: Number(formData.product_no),
      customer_no: Number(formData.customer_no),
      store_no: Number(formData.store_no),
      account_id: formData.account_id ? Number(formData.account_id) : undefined,
      amount: calcAmount
    };
    if (!payload.sel_no || !payload.product_no || !payload.customer_no || !payload.store_no) {
      setError('All dropdowns are required');
      return;
    }
    if (payload.qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (payload.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    if (payload.paid > payload.amount) {
      setError('Paid amount cannot exceed total amount');
      return;
    }
    setLoading(true);
    try {
      if (editingReturn) {
        await updateSalesReturn(editingReturn._id, payload);
        setSuccess('Sales return updated successfully');
      } else {
        await createSalesReturn(payload);
        setSuccess('Sales return added successfully');
      }
      const data = await getSalesReturns();
      setReturns(Array.isArray(data) ? data : (data.data || []));
      setFormData({
        sel_no: '',
        product_no: '',
        customer_no: '',
        store_no: '',
        qty: 1,
        price: 0,
        amount: 0,
        paid: 0,
        reason: '',
        account_id: ''
      });
      setEditingReturn(null);
      setTimeout(() => setViewMode('table'), 1500);
    } catch (err) {
      setError(typeof err === 'string' ? err : (err.message || 'Error saving sales return'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (["qty", "price"].includes(name)) {
        const qty = parseInt(updated.qty) || 0;
        const price = parseFloat(updated.price) || 0;
        updated.amount = qty * price;
      }
      return updated;
    });
  };

  const filteredReturns = returns.filter(r =>
    (r.product_name || r.product || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.customer_name || r.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.store_name || r.store || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={salesStyles.sales}>
      <div className={salesStyles['sales-header']}>
        <button className={salesStyles['back-button']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Transactions
        </button>
        <h1>Sales Return Management</h1>
        <p>Manage and record product sales returns</p>
      </div>
      <div className={salesStyles['sales-content']}>
        <div className={salesStyles['action-buttons']}>
          <button className={`${salesStyles['action-btn']} ${viewMode === 'table' ? salesStyles.active : ''}`} onClick={() => setViewMode('table')}>
            <Eye size={20} />
            View Table
          </button>
          <button className={`${salesStyles['action-btn']} ${viewMode === 'form' ? salesStyles.active : ''}`} onClick={handleAddNew}>
            <Plus size={20} />
            Add New Return
          </button>
        </div>
        {error && <div className={salesStyles.error}>{error}</div>}
        {success && <div className={salesStyles.success}>{success}</div>}
        {loading && <div className={salesStyles.loading}>Loading...</div>}
        {viewMode === 'table' && (
          <div className={salesStyles['table-container']}>
            <div className={salesStyles['table-header']}>
              <div className={salesStyles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search returns..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={salesStyles['search-input']}
                />
              </div>
              <div className={salesStyles['table-info']}>
                {filteredReturns.length} returns found
              </div>
            </div>
            <div className={salesStyles['table-wrapper']}>
              <table className={salesStyles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Store</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map(r => (
                    <tr key={r._id || r.return_no}>
                      <td>{r.return_no}</td>
                      <td>{r.product_name || r.product}</td>
                      <td>{r.customer_name || r.customer}</td>
                      <td>{r.store_name || r.store}</td>
                      <td>{r.qty}</td>
                      <td>{r.price}</td>
                      <td>{r.amount}</td>
                      <td>{r.paid}</td>
                      <td>{r.reason}</td>
                      <td>{r.date ? new Date(r.date).toLocaleDateString() : ''}</td>
                      <td>
                        <div className={returnStyles.actionIcons}>
                          <button className={returnStyles.iconBtn} title="Edit" onClick={() => handleEdit(r)}><Edit size={16} /></button>
                          <button className={`${returnStyles.iconBtn} ${returnStyles.delete}`} title="Delete" onClick={() => handleDelete(r._id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReturns.length === 0 && (
                <div className={salesStyles['no-data']}>
                  {searchTerm ? 'No returns found matching your search' : 'No returns found'}
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'form' && (
          <div className={salesStyles['form-container']}>
            <h2>{editingReturn ? 'Edit Sales Return' : 'Add New Sales Return'}</h2>
            <form onSubmit={handleSubmit} className={salesStyles.form}>
              <div className={salesStyles['form-grid']}>
                <div className={salesStyles['form-group']}>
                  <label>Sale *</label>
                  <select
                    name="sel_no"
                    value={formData.sel_no || ''}
                    onChange={e => setFormData(f => ({ ...f, sel_no: Number(e.target.value) }))}
                    required
                    className={salesStyles['form-select']}
                  >
                    <option value="">Select a sale</option>
                    {sales.map(s => (
                      <option key={s.sel_no} value={s.sel_no}>{`#${s.sel_no} - ${s.product_name || s.product} (${s.customer_name || s.customer})`}</option>
                    ))}
                  </select>
                </div>
                <div className={salesStyles['form-group']}>
                  <label>Product *</label>
                  <select
                    name="product_no"
                    value={formData.product_no || ''}
                    onChange={e => setFormData(f => ({ ...f, product_no: Number(e.target.value) }))}
                    required
                    className={salesStyles['form-select']}
                  >
                    <option value="">Select a product</option>
                    {products.map(p => (
                      <option key={p.product_no} value={p.product_no}>{p.product_name}</option>
                    ))}
                  </select>
                </div>
                <div className={salesStyles['form-group']}>
                  <label>Customer *</label>
                  <select
                    name="customer_no"
                    value={formData.customer_no || ''}
                    onChange={e => setFormData(f => ({ ...f, customer_no: Number(e.target.value) }))}
                    required
                    className={salesStyles['form-select']}
                  >
                    <option value="">Select a customer</option>
                    {customers.map(c => (
                      <option key={c.customer_no} value={c.customer_no}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className={salesStyles['form-group']}>
                  <label>Store *</label>
                  <select
                    name="store_no"
                    value={formData.store_no || ''}
                    onChange={e => setFormData(f => ({ ...f, store_no: Number(e.target.value) }))}
                    required
                    className={salesStyles['form-select']}
                  >
                    <option value="">Select a store</option>
                    {stores.map(s => (
                      <option key={s.store_no} value={s.store_no}>{s.store_name}</option>
                    ))}
                  </select>
                </div>
                <div className={salesStyles['form-group']}>
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="qty"
                    value={formData.qty}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className={salesStyles['form-input']}
                  />
                </div>
                <div className={salesStyles['form-group']}>
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className={salesStyles['form-input']}
                  />
                </div>
                <div className={salesStyles['form-group']}>
                  <label>Paid</label>
                  <input
                    type="number"
                    name="paid"
                    value={formData.paid}
                    onChange={handleInputChange}
                    min="0"
                    className={salesStyles['form-input']}
                  />
                </div>
                <div className={salesStyles['form-group']}>
                  <label>Reason</label>
                  <input
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className={salesStyles['form-input']}
                  />
                </div>
                <div className={salesStyles['form-group']}>
                  <label>Account</label>
                  <select
                    name="account_id"
                    value={formData.account_id || ''}
                    onChange={e => setFormData(f => ({ ...f, account_id: Number(e.target.value) }))}
                    className={salesStyles['form-select']}
                  >
                    <option value="">Select an account (optional)</option>
                    {accounts.map(a => (
                      <option key={a.account_id} value={a.account_id}>{a.account_name || a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={salesStyles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={salesStyles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={salesStyles['submit-btn']}>
                  {editingReturn ? 'Update' : 'Add'} Sales Return
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReturn; 
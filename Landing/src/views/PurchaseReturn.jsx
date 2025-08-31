import React, { useState, useEffect } from 'react';
import purchasesStyles from './Purchases.module.css';
import returnStyles from './PurchaseReturn.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { getPurchaseReturns, createPurchaseReturn, updatePurchaseReturn, deletePurchaseReturn } from '../services/purchaseReturnService';
import { getProducts } from '../services/productService';
import { getSuppliers } from '../services/supplierService';
import { getStores } from '../services/storeService';
import { getAccounts } from '../services/accountService';

const PurchaseReturn = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table');
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_no: '',
    supplier_no: '',
    store_no: '',
    qty: 1,
    price: 0,
    amount: 0,
    paid: 0,
    reason: '',
    account_id: ''
  });
  const [editingReturn, setEditingReturn] = useState(null);

  // Manual data fetching function
  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Fetching purchase returns data...');
      const [returnsData, productsData, suppliersData, storesData, accountsData] = await Promise.all([
        getPurchaseReturns(),
        getProducts(),
        getSuppliers(),
        getStores(),
        getAccounts()
      ]);
      
      console.log('📊 Purchase returns response:', returnsData);
      console.log('📊 Products response:', productsData);
      console.log('📊 Suppliers response:', suppliersData);
      console.log('📊 Stores response:', storesData);
      console.log('📊 Accounts response:', accountsData);
      
      const processedReturns = Array.isArray(returnsData) ? returnsData : (returnsData.data || []);
      setReturns(processedReturns);
      setProducts(productsData.data || productsData);
      setSuppliers(suppliersData.data || suppliersData);
      setStores(storesData.data || storesData);
      setAccounts(accountsData.data || accountsData);
      
      console.log('✅ Purchase returns loaded:', processedReturns.length, 'items');
    } catch (err) {
      console.error('❌ Error loading purchase returns data:', err);
      setError(`Error loading purchase returns or dropdown data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleViewTable = () => {
    setViewMode('table');
    setEditingReturn(null);
    setFormData({
      product_no: '',
      supplier_no: '',
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
      product_no: '',
      supplier_no: '',
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
      product_no: ret.product_no,
      supplier_no: ret.supplier_no,
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
    if (window.confirm('Are you sure you want to delete this purchase return?')) {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        await deletePurchaseReturn(id);
        setSuccess('Purchase return deleted successfully');
        await fetchAll(); // Use shared function
      } catch (err) {
        setError('Error deleting purchase return');
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
      product_no: Number(formData.product_no),
      supplier_no: Number(formData.supplier_no),
      store_no: Number(formData.store_no),
      account_id: formData.account_id ? Number(formData.account_id) : undefined,
      amount: calcAmount
    };
    if (!payload.product_no || !payload.supplier_no || !payload.store_no) {
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
        await updatePurchaseReturn(editingReturn._id, payload);
        setSuccess('Purchase return updated successfully');
      } else {
        await createPurchaseReturn(payload);
        setSuccess('Purchase return added successfully');
      }
      await fetchAll(); // Use shared function
      setFormData({
        product_no: '',
        supplier_no: '',
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
      setError(typeof err === 'string' ? err : (err.message || 'Error saving purchase return'));
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
    (r.supplier_name || r.supplier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.store_name || r.store || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={purchasesStyles.purchases}>
      <div className={purchasesStyles['purchases-header']}>
        <button className={purchasesStyles['back-button']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Transactions
        </button>
        <h1>Purchase Return Management</h1>
        <p>Manage and record product purchase returns</p>
      </div>
      <div className={purchasesStyles['purchases-content']}>
        <div className={purchasesStyles['action-buttons']}>
          <button className={`${purchasesStyles['action-btn']} ${viewMode === 'table' ? purchasesStyles.active : ''}`} onClick={() => setViewMode('table')}>
            <Eye size={20} />
            View Table
          </button>
          <button className={`${purchasesStyles['action-btn']} ${viewMode === 'form' ? purchasesStyles.active : ''}`} onClick={() => setViewMode('form')}>
            <Plus size={20} />
            Add New Return
          </button>
          <button 
            className={purchasesStyles['action-btn']} 
            onClick={fetchAll}
            disabled={loading}
            title="Manually refresh data"
          >
            🔄 Load Data
          </button>
        </div>
        {error && <div className={purchasesStyles.error}>
          {error}
          <button 
            onClick={fetchAll}
            style={{
              marginLeft: '10px', 
              padding: '4px 8px', 
              fontSize: '12px', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>}
        {success && <div className={purchasesStyles.success}>{success}</div>}
        {loading && <div className={purchasesStyles.loading}>Loading...</div>}
        {viewMode === 'table' && (
          <div className={purchasesStyles['table-container']}>
            <div className={purchasesStyles['table-header']}>
              <div className={purchasesStyles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search returns..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={purchasesStyles['search-input']}
                />
              </div>
              <div className={purchasesStyles['table-info']}>
                {filteredReturns.length} returns found
              </div>
            </div>
            <div className={purchasesStyles['table-wrapper']}>
              <table className={purchasesStyles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Supplier</th>
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
                      <td>{r.supplier_name || r.supplier}</td>
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
                <div className={purchasesStyles['no-data']}>
                  {searchTerm ? 'No returns found matching your search' : 'No returns found'}
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'form' && (
          <div className={purchasesStyles['form-container']}>
            <h2>{editingReturn ? 'Edit Purchase Return' : 'Add New Purchase Return'}</h2>
            <form onSubmit={handleSubmit} className={purchasesStyles.form}>
              <div className={purchasesStyles['form-grid']}>
                <div className={purchasesStyles['form-group']}>
                  <label>Product *</label>
                  <select
                    name="product_no"
                    value={formData.product_no || ''}
                    onChange={e => setFormData(f => ({ ...f, product_no: Number(e.target.value) }))}
                    required
                    className={purchasesStyles['form-select']}
                  >
                    <option value="">Select a product</option>
                    {products.map(p => (
                      <option key={p.product_no} value={p.product_no}>{p.product_name}</option>
                    ))}
                  </select>
                </div>
                <div className={purchasesStyles['form-group']}>
                  <label>Supplier *</label>
                  <select
                    name="supplier_no"
                    value={formData.supplier_no || ''}
                    onChange={e => setFormData(f => ({ ...f, supplier_no: Number(e.target.value) }))}
                    required
                    className={purchasesStyles['form-select']}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map(s => (
                      <option key={s.supplier_no} value={s.supplier_no}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className={purchasesStyles['form-group']}>
                  <label>Store *</label>
                  <select
                    name="store_no"
                    value={formData.store_no || ''}
                    onChange={e => setFormData(f => ({ ...f, store_no: Number(e.target.value) }))}
                    required
                    className={purchasesStyles['form-select']}
                  >
                    <option value="">Select a store</option>
                    {stores.map(s => (
                      <option key={s.store_no} value={s.store_no}>{s.store_name}</option>
                    ))}
                  </select>
                </div>
                <div className={purchasesStyles['form-group']}>
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="qty"
                    value={formData.qty}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className={purchasesStyles['form-input']}
                  />
                </div>
                <div className={purchasesStyles['form-group']}>
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className={purchasesStyles['form-input']}
                  />
                </div>
                <div className={purchasesStyles['form-group']}>
                  <label>Paid</label>
                  <input
                    type="number"
                    name="paid"
                    value={formData.paid}
                    onChange={handleInputChange}
                    min="0"
                    className={purchasesStyles['form-input']}
                  />
                </div>
                <div className={purchasesStyles['form-group']}>
                  <label>Reason</label>
                  <input
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className={purchasesStyles['form-input']}
                  />
                </div>
                <div className={purchasesStyles['form-group']}>
                  <label>Account</label>
                  <select
                    name="account_id"
                    value={formData.account_id || ''}
                    onChange={e => setFormData(f => ({ ...f, account_id: Number(e.target.value) }))}
                    className={purchasesStyles['form-select']}
                  >
                    <option value="">Select an account (optional)</option>
                    {accounts.map(a => (
                      <option key={a.account_id} value={a.account_id}>{a.account_name || a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={purchasesStyles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={purchasesStyles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={purchasesStyles['submit-btn']}>
                  {editingReturn ? 'Update' : 'Add'} Purchase Return
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReturn; 
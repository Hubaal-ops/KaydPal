import React, { useState, useEffect } from 'react';
import styles from './Purchases.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { getPurchases, addPurchase, updatePurchase, deletePurchase } from '../services/purchaseService';
import { getProducts } from '../services/productService';
import { getSuppliers } from '../services/supplierService';
import { getStores } from '../services/storeService';
import { getAccounts } from '../services/accountService';

const Purchases = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table');
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    product_no: '',
    supplier_no: '',
    store_no: '',
    qty: 1,
    price: 0,
    discount: 0,
    tax: 0,
    amount: 0,
    paid: 0,
    account_id: ''
  });
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [purchasesData, productsData, suppliersData, storesData, accountsData] = await Promise.all([
        getPurchases(),
        getProducts(),
        getSuppliers(),
        getStores(),
        getAccounts()
      ]);
      setPurchases(purchasesData);
      setProducts(productsData.data || productsData); // handle both {data:[]} and []
      setSuppliers(suppliersData);
      setStores(Array.isArray(storesData) ? storesData : (storesData.data || []));
      setAccounts(accountsData);
    } catch (err) {
      setError(err.message || 'Error fetching purchase data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Debug: log stores array
  useEffect(() => {
    console.log('Stores:', stores);
  }, [stores]);

  const handleViewTable = () => {
    setViewMode('table');
    setEditingPurchase(null);
    setFormData({
      product_no: '',
      supplier_no: '',
      store_no: '',
      qty: 1,
      price: 0,
      discount: 0,
      tax: 0,
      amount: 0,
      paid: 0,
      account_id: ''
    });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingPurchase(null);
    setFormData({
      product_no: '',
      supplier_no: '',
      store_no: '',
      qty: 1,
      price: 0,
      discount: 0,
      tax: 0,
      amount: 0,
      paid: 0,
      account_id: ''
    });
    setError('');
    setSuccess('');
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      product_no: purchase.product_no,
      supplier_no: purchase.supplier_no,
      store_no: purchase.store_no,
      qty: purchase.qty,
      price: purchase.price,
      discount: purchase.discount,
      tax: purchase.tax,
      amount: purchase.amount,
      paid: purchase.paid,
      account_id: purchase.account_id
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (purchase_no) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        await deletePurchase(purchase_no);
        await fetchAll(); // Re-fetch all data to update dropdowns
        setSuccess('Purchase deleted successfully');
      } catch (err) {
        setError(err.message || 'Error deleting purchase');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    console.log('Store dropdown value:', formData.store_no, typeof formData.store_no);
    if (!formData.product_no || !formData.supplier_no || !formData.store_no || !formData.account_id) {
      setError('All dropdowns are required');
      return;
    }
    if (isNaN(Number(formData.store_no))) {
      setError('Store is required');
      return;
    }
    if (formData.qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    const calcAmount = formData.qty * formData.price - (formData.discount || 0) + (formData.tax || 0);
    if (formData.amount !== calcAmount) {
      setError('Amount does not match calculation');
      return;
    }
    if (formData.paid > formData.amount) {
      setError('Paid amount cannot exceed total amount');
      return;
    }
    setLoading(true);
    // Convert all IDs to numbers before sending
    const payload = {
      ...formData,
      product_no: Number(formData.product_no),
      supplier_no: Number(formData.supplier_no),
      store_no: Number(formData.store_no),
      account_id: Number(formData.account_id)
    };
    console.log('Submitting purchase payload:', payload);
    try {
      if (editingPurchase) {
        await updatePurchase(editingPurchase.purchase_no, payload);
        setSuccess('Purchase updated successfully');
      } else {
        await addPurchase(payload);
        setSuccess('Purchase added successfully');
      }
      await fetchAll();
      setFormData({
        product_no: '',
        supplier_no: '',
        store_no: '',
        qty: 1,
        price: 0,
        discount: 0,
        tax: 0,
        amount: 0,
        paid: 0,
        account_id: ''
      });
      setEditingPurchase(null);
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error saving purchase');
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

  const filteredPurchases = purchases.filter(purchase =>
    (purchase.product_name && purchase.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (purchase.supplier_name && purchase.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (purchase.store_name && purchase.store_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.purchases}>
      <div className={styles['purchases-header']}>
        <button className={styles['back-button']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Transactions
        </button>
        <h1>Purchases Management</h1>
        <p>Manage and record product purchases</p>
      </div>
      <div className={styles['purchases-content']}>
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
            Add New Purchase
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {viewMode === 'table' && (
          <div className={styles['table-container']}>
            <div className={styles['table-header']}>
              <div className={styles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search purchases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredPurchases.length} purchases found
              </div>
            </div>
            {loading ? (
              <div className={styles.loading}>Loading purchases...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Supplier</th>
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
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase.purchase_no}>
                        <td>{purchase.purchase_no}</td>
                        <td>{purchase.product_name}</td>
                        <td>{purchase.supplier_name}</td>
                        <td>{purchase.store_name}</td>
                        <td>{purchase.qty}</td>
                        <td>{purchase.price}</td>
                        <td>{purchase.discount}</td>
                        <td>{purchase.tax}</td>
                        <td>{purchase.amount}</td>
                        <td>{purchase.paid}</td>
                        <td>{purchase.account_name}</td>
                        <td>{new Date(purchase.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button
                              onClick={() => handleEdit(purchase)}
                              className={styles['icon-btn']}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(purchase.purchase_no)}
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
                {filteredPurchases.length === 0 && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No purchases found matching your search' : 'No purchases found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2 className={styles['main-title']}>{editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-grid']}>
                <div className={styles['form-group']}>
                  <label>Product *</label>
                  <select
                    name="product_no"
                    value={formData.product_no || ''}
                    onChange={e => setFormData(f => ({ ...f, product_no: Number(e.target.value) }))}
                    required
                    className={styles['form-select']}
                  >
                    <option value="">Select a product</option>
                    {products.map(p => (
                      <option key={p.product_no} value={p.product_no}>{p.product_name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles['form-group']}>
                  <label>Supplier *</label>
                  <select
                    name="supplier_no"
                    value={formData.supplier_no || ''}
                    onChange={e => setFormData(f => ({ ...f, supplier_no: Number(e.target.value) }))}
                    required
                    className={styles['form-select']}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map(s => (
                      <option key={s.supplier_no} value={s.supplier_no}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles['form-group']}>
                  <label>Store *</label>
                  <select
                    name="store_no"
                    value={formData.store_no || ''}
                    onChange={e => setFormData(f => ({ ...f, store_no: Number(e.target.value) }))}
                    required
                    className={styles['form-select']}
                  >
                    <option value="">Select a store</option>
                    {stores.map(s => (
                      <option key={s.store_no} value={s.store_no}>{s.store_name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles['form-group']}>
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="qty"
                    value={formData.qty}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className={styles['form-input']}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className={styles['form-input']}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Discount</label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    className={styles['form-input']}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Tax</label>
                  <input
                    type="number"
                    name="tax"
                    value={formData.tax}
                    onChange={handleInputChange}
                    min="0"
                    className={styles['form-input']}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className={styles['form-input']}
                    readOnly
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Paid</label>
                  <input
                    type="number"
                    name="paid"
                    value={formData.paid}
                    onChange={handleInputChange}
                    min="0"
                    className={styles['form-input']}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Account *</label>
                  <select
                    name="account_id"
                    value={formData.account_id || ''}
                    onChange={e => setFormData(f => ({ ...f, account_id: Number(e.target.value) }))}
                    required
                    className={styles['form-select']}
                  >
                    <option value="">Select an account</option>
                    {accounts.map(a => (
                      <option key={a.account_id} value={a.account_id}>{a.account_name || a.bank || a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingPurchase ? 'Update' : 'Add'} Purchase
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Purchases; 
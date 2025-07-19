import React, { useState, useEffect } from 'react';
import styles from './Sales.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { getSales, addSale, updateSale, deleteSale } from '../services/salesService';
import { getProducts } from '../services/productService';
import { getStores } from '../services/storeService';
import { getAccounts } from '../services/accountService';
import { getCustomers } from '../services/customerService';

const Sales = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table');
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    product_no: '',
    customer_no: '',
    store_no: '',
    qty: 1,
    price: 0,
    discount: 0,
    tax: 0,
    amount: 0,
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
      product_no: '',
      customer_no: '',
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
    setEditingSale(null);
    setFormData({
      product_no: '',
      customer_no: '',
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

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setFormData({
      product_no: sale.product_no,
      customer_no: sale.customer_no,
      store_no: sale.store_no,
      qty: sale.qty,
      price: sale.price,
      discount: sale.discount,
      tax: sale.tax,
      amount: sale.amount,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Always recalculate amount before validation and submission
    const calcAmount = (parseInt(formData.qty) || 0) * (parseFloat(formData.price) || 0) - (parseFloat(formData.discount) || 0) + (parseFloat(formData.tax) || 0);
    const updatedFormData = { ...formData, amount: calcAmount };
    if (!updatedFormData.product_no || !updatedFormData.customer_no || !updatedFormData.store_no || !updatedFormData.account_id) {
      setError('All dropdowns are required');
      return;
    }
    if (updatedFormData.qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (updatedFormData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    // Removed manual check for amount mismatch
    if (updatedFormData.paid > updatedFormData.amount) {
      setError('Paid amount cannot exceed total amount');
      return;
    }
    setLoading(true);
    try {
      if (editingSale) {
        await updateSale(editingSale.sel_no, updatedFormData);
        setSuccess('Sale updated successfully');
      } else {
        await addSale(updatedFormData);
        setSuccess('Sale added successfully');
      }
      await fetchAll();
      setFormData({
        product_no: '',
        customer_no: '',
        store_no: '',
        qty: 1,
        price: 0,
        discount: 0,
        tax: 0,
        amount: 0,
        paid: 0,
        account_id: ''
      });
      setEditingSale(null);
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
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
                        <td>{sale.product_name}</td>
                        <td>{sale.customer_name}</td>
                        <td>{sale.store_name}</td>
                        <td>{sale.qty}</td>
                        <td>{sale.price}</td>
                        <td>{sale.discount}</td>
                        <td>{sale.tax}</td>
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
              <div className={styles['form-group']}>
                <label htmlFor="product_no">Product *</label>
                <select
                  id="product_no"
                  name="product_no"
                  value={formData.product_no}
                  onChange={handleInputChange}
                  required
                  className={styles['form-select']}
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.product_no} value={product.product_no}>
                      {product.product_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="customer_no">Customer *</label>
                <select
                  id="customer_no"
                  name="customer_no"
                  value={formData.customer_no}
                  onChange={handleInputChange}
                  required
                  className={styles['form-select']}
                >
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
                <select
                  id="store_no"
                  name="store_no"
                  value={formData.store_no}
                  onChange={handleInputChange}
                  required
                  className={styles['form-select']}
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.store_no} value={store.store_no}>
                      {store.store_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="qty">Quantity *</label>
                <input
                  type="number"
                  id="qty"
                  name="qty"
                  value={formData.qty}
                  onChange={handleInputChange}
                  min="1"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="price">Price *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="discount">Discount</label>
                <input
                  type="number"
                  id="discount"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="tax">Tax</label>
                <input
                  type="number"
                  id="tax"
                  name="tax"
                  value={formData.tax}
                  onChange={handleInputChange}
                  min="0"
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
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
                <label htmlFor="paid">Paid</label>
                <input
                  type="number"
                  id="paid"
                  name="paid"
                  value={formData.paid}
                  onChange={handleInputChange}
                  min="0"
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="account_id">Account *</label>
                <select
                  id="account_id"
                  name="account_id"
                  value={formData.account_id}
                  onChange={handleInputChange}
                  required
                  className={styles['form-select']}
                >
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
      </div>
    </div>
  );
};

export default Sales; 
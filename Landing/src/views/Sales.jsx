import React, { useState, useEffect } from 'react';
import styles from './Sales.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sales = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'form'
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
  // Remove formStep state and all stepper logic

  // Mock data for demonstration
  const mockProducts = [
    { product_no: 1, product_name: 'Macbook Pro 14' },
    { product_no: 2, product_name: 'Nike Running Shoes' },
    { product_no: 3, product_name: 'The Great Gatsby' }
  ];
  const mockCustomers = [
    { customer_no: 1, customer_name: 'Alice Smith' },
    { customer_no: 2, customer_name: 'Bob Johnson' },
    { customer_no: 3, customer_name: 'Charlie Brown' }
  ];
  const mockStores = [
    { store_no: 1, store_name: 'Main Street Store' },
    { store_no: 2, store_name: 'Downtown Branch' },
    { store_no: 3, store_name: 'Mall Location' }
  ];
  const mockAccounts = [
    { account_id: 1, account_name: 'Cash' },
    { account_id: 2, account_name: 'Bank' },
    { account_id: 3, account_name: 'Credit Card' }
  ];
  const mockSales = [
    {
      sel_no: 1,
      product_no: 1,
      customer_no: 1,
      store_no: 1,
      qty: 2,
      price: 2000,
      discount: 100,
      tax: 50,
      amount: 3950,
      paid: 2000,
      account_id: 1,
      sel_date: '2024-07-13T10:30:00Z',
      product_name: 'Macbook Pro 14',
      customer_name: 'Alice Smith',
      store_name: 'Main Street Store',
      account_name: 'Cash'
    },
    {
      sel_no: 2,
      product_no: 2,
      customer_no: 2,
      store_no: 2,
      qty: 1,
      price: 120,
      discount: 0,
      tax: 10,
      amount: 130,
      paid: 130,
      account_id: 2,
      sel_date: '2024-07-13T11:00:00Z',
      product_name: 'Nike Running Shoes',
      customer_name: 'Bob Johnson',
      store_name: 'Downtown Branch',
      account_name: 'Bank'
    }
  ];

  // Simulate API calls
  const fetchSales = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSales(mockSales);
    } catch (error) {
      setError('Error fetching sales');
    } finally {
      setLoading(false);
    }
  };
  const fetchProducts = async () => setProducts(mockProducts);
  const fetchCustomers = async () => setCustomers(mockCustomers);
  const fetchStores = async () => setStores(mockStores);
  const fetchAccounts = async () => setAccounts(mockAccounts);

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchCustomers();
    fetchStores();
    fetchAccounts();
  }, []);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/inventory');
    }
  };

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
    // setFormStep(1); // Removed
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
    // setFormStep(1); // Removed
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
    // setFormStep(1); // Removed
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (selNo) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setSales(prev => prev.filter(sale => sale.sel_no !== selNo));
        setSuccess('Sale deleted successfully');
      } catch (error) {
        setError('Error deleting sale');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.product_no || !formData.customer_no || !formData.store_no || !formData.account_id) {
      setError('All dropdowns are required');
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

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const selectedProduct = products.find(p => p.product_no === parseInt(formData.product_no));
      const selectedCustomer = customers.find(c => c.customer_no === parseInt(formData.customer_no));
      const selectedStore = stores.find(s => s.store_no === parseInt(formData.store_no));
      const selectedAccount = accounts.find(a => a.account_id === parseInt(formData.account_id));
      if (editingSale) {
        setSales(prev => prev.map(sale =>
          sale.sel_no === editingSale.sel_no
            ? {
                ...sale,
                ...formData,
                product_no: parseInt(formData.product_no),
                customer_no: parseInt(formData.customer_no),
                store_no: parseInt(formData.store_no),
                account_id: parseInt(formData.account_id),
                product_name: selectedProduct.product_name,
                customer_name: selectedCustomer.customer_name,
                store_name: selectedStore.store_name,
                account_name: selectedAccount.account_name,
                sel_date: sale.sel_date
              }
            : sale
        ));
        setSuccess('Sale updated successfully');
      } else {
        const newSelNo = Math.max(0, ...sales.map(s => s.sel_no)) + 1;
        const newSale = {
          sel_no: newSelNo,
          ...formData,
          product_no: parseInt(formData.product_no),
          customer_no: parseInt(formData.customer_no),
          store_no: parseInt(formData.store_no),
          account_id: parseInt(formData.account_id),
          product_name: selectedProduct.product_name,
          customer_name: selectedCustomer.customer_name,
          store_name: selectedStore.store_name,
          account_name: selectedAccount.account_name,
          sel_date: new Date().toISOString()
        };
        setSales(prev => [...prev, newSale]);
        setSuccess('Sale added successfully');
      }
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
    } catch (error) {
      setError('Error saving sale');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate amount
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
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Inventory
        </button>
        <h1>Sales Management</h1>
        <p>Manage and record product sales</p>
      </div>
      <div className={styles['sales-content']}>
        {/* Action Buttons */}
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
        {/* Error and Success Messages */}
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {/* Table View */}
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
                        <td>{new Date(sale.sel_date).toLocaleDateString()}</td>
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
        {/* Form View */}
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
                      {customer.customer_name}
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
                      {account.account_name}
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
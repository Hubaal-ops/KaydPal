import React, { useState, useEffect } from 'react';
import styles from './Sales.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';

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

  // Mock data
  const mockProducts = [
    { product_no: 1, product_name: 'Macbook Pro 14' },
    { product_no: 2, product_name: 'Nike Running Shoes' },
    { product_no: 3, product_name: 'The Great Gatsby' }
  ];
  const mockSuppliers = [
    { supplier_no: 1, supplier_name: 'Tech Supplies Inc.' },
    { supplier_no: 2, supplier_name: 'Global Footwear' },
    { supplier_no: 3, supplier_name: 'Book Distributors' }
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
  const mockPurchases = [
    {
      purchase_no: 'PUR-00001',
      product_no: 1,
      supplier_no: 1,
      store_no: 1,
      qty: 5,
      price: 1800,
      discount: 50,
      tax: 90,
      amount: 9040,
      paid: 5000,
      account_id: 1,
      created_at: '2024-07-13T10:30:00Z',
      product_name: 'Macbook Pro 14',
      supplier_name: 'Tech Supplies Inc.',
      store_name: 'Main Street Store',
      account_name: 'Cash'
    },
    {
      purchase_no: 'PUR-00002',
      product_no: 2,
      supplier_no: 2,
      store_no: 2,
      qty: 10,
      price: 100,
      discount: 0,
      tax: 20,
      amount: 1020,
      paid: 1020,
      account_id: 2,
      created_at: '2024-07-13T11:00:00Z',
      product_name: 'Nike Running Shoes',
      supplier_name: 'Global Footwear',
      store_name: 'Downtown Branch',
      account_name: 'Bank'
    }
  ];

  // Simulate API calls
  const fetchPurchases = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPurchases(mockPurchases);
    } catch (error) {
      setError('Error fetching purchases');
    } finally {
      setLoading(false);
    }
  };
  const fetchProducts = async () => setProducts(mockProducts);
  const fetchSuppliers = async () => setSuppliers(mockSuppliers);
  const fetchStores = async () => setStores(mockStores);
  const fetchAccounts = async () => setAccounts(mockAccounts);

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
    fetchSuppliers();
    fetchStores();
    fetchAccounts();
  }, []);

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

  const handleDelete = async (purchaseNo) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setPurchases(prev => prev.filter(p => p.purchase_no !== purchaseNo));
        setSuccess('Purchase deleted successfully');
      } catch (error) {
        setError('Error deleting purchase');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.product_no || !formData.supplier_no || !formData.store_no || !formData.account_id) {
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
      const selectedSupplier = suppliers.find(s => s.supplier_no === parseInt(formData.supplier_no));
      const selectedStore = stores.find(s => s.store_no === parseInt(formData.store_no));
      const selectedAccount = accounts.find(a => a.account_id === parseInt(formData.account_id));
      if (editingPurchase) {
        setPurchases(prev => prev.map(purchase =>
          purchase.purchase_no === editingPurchase.purchase_no
            ? {
                ...purchase,
                ...formData,
                product_no: parseInt(formData.product_no),
                supplier_no: parseInt(formData.supplier_no),
                store_no: parseInt(formData.store_no),
                account_id: parseInt(formData.account_id),
                product_name: selectedProduct.product_name,
                supplier_name: selectedSupplier.supplier_name,
                store_name: selectedStore.store_name,
                account_name: selectedAccount.account_name,
                created_at: purchase.created_at
              }
            : purchase
        ));
        setSuccess('Purchase updated successfully');
      } else {
        const newNo = `PUR-${String(Math.max(0, ...purchases.map(p => parseInt(p.purchase_no?.split('-')[1]) || 0)) + 1).padStart(5, '0')}`;
        const newPurchase = {
          purchase_no: newNo,
          ...formData,
          product_no: parseInt(formData.product_no),
          supplier_no: parseInt(formData.supplier_no),
          store_no: parseInt(formData.store_no),
          account_id: parseInt(formData.account_id),
          product_name: selectedProduct.product_name,
          supplier_name: selectedSupplier.supplier_name,
          store_name: selectedStore.store_name,
          account_name: selectedAccount.account_name,
          created_at: new Date().toISOString()
        };
        setPurchases(prev => [...prev, newPurchase]);
        setSuccess('Purchase added successfully');
      }
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
    } catch (error) {
      setError('Error saving purchase');
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
    <div className={styles.sales}>
      <div className={styles['sales-header']}>
        <button className={styles['back-button']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Transactions
        </button>
        <h1>Purchases Management</h1>
        <p>Manage and record product purchases</p>
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
            <h2>{editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}</h2>
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
                <label htmlFor="supplier_no">Supplier *</label>
                <select
                  id="supplier_no"
                  name="supplier_no"
                  value={formData.supplier_no}
                  onChange={handleInputChange}
                  required
                  className={styles['form-select']}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.supplier_no} value={supplier.supplier_no}>
                      {supplier.supplier_name}
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
                  {editingPurchase ? 'Update Purchase' : 'Add Purchase'}
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
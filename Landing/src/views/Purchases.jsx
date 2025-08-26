import React, { useState, useEffect } from 'react';
import styles from './Purchases.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search, X, ShoppingCart } from 'lucide-react';
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
  
  // Form data for purchase order header
  const [formData, setFormData] = useState({
    supplier_no: '',
    store_no: '',
    account_id: '',
    paid: 0,
    notes: '',
    status: 'pending'
  });
  
  // Cart items for multiple products
  const [cartItems, setCartItems] = useState([]);
  
  // Current item being added
  const [currentItem, setCurrentItem] = useState({
    product_no: '',
    qty: 1,
    price: 0,
    discount: 0,
    tax: 0
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

  const resetForm = () => {
    setFormData({
      supplier_no: '',
      store_no: '',
      account_id: '',
      paid: 0,
      notes: '',
      status: 'pending'
    });
    setCartItems([]);
    setCurrentItem({
      product_no: '',
      qty: 1,
      price: 0,
      discount: 0,
      tax: 0
    });
  };

  const handleViewTable = () => {
    setViewMode('table');
    setEditingPurchase(null);
    resetForm();
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingPurchase(null);
    resetForm();
    setError('');
    setSuccess('');
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      supplier_no: purchase.supplier_no,
      store_no: purchase.store_no,
      account_id: purchase.account_id,
      paid: purchase.paid,
      notes: purchase.notes || '',
      status: purchase.status || 'pending'
    });
    setCartItems(purchase.items || []);
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (purchase_no) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        await deletePurchase(purchase_no);
        await fetchAll();
        setSuccess('Purchase order deleted successfully');
      } catch (err) {
        setError(err.message || 'Error deleting purchase order');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle adding item to cart
  const handleAddItemToCart = () => {
    if (!currentItem.product_no || currentItem.qty <= 0 || currentItem.price < 0) {
      setError('Please fill in all required item fields correctly');
      return;
    }
    
    // Check if product already exists in cart
    const existingItemIndex = cartItems.findIndex(item => item.product_no === Number(currentItem.product_no));
    
    const qty = Number(currentItem.qty);
    const price = Number(currentItem.price);
    const discount = Number(currentItem.discount || 0);
    const tax = Number(currentItem.tax || 0);
    const subtotal = (qty * price) - discount + tax;
    
    const newItem = {
      product_no: Number(currentItem.product_no),
      qty,
      price,
      discount,
      tax,
      subtotal
    };
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        qty: updatedItems[existingItemIndex].qty + qty,
        subtotal: updatedItems[existingItemIndex].subtotal + subtotal
      };
      setCartItems(updatedItems);
    } else {
      // Add new item
      setCartItems([...cartItems, newItem]);
    }
    
    // Reset current item
    setCurrentItem({
      product_no: '',
      qty: 1,
      price: 0,
      discount: 0,
      tax: 0
    });
    setError('');
  };

  // Remove item from cart
  const handleRemoveFromCart = (index) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const totalDiscount = cartItems.reduce((sum, item) => sum + (item.discount || 0), 0);
    const totalTax = cartItems.reduce((sum, item) => sum + (item.tax || 0), 0);
    const totalAmount = subtotal - totalDiscount + totalTax;
    
    return { subtotal, totalDiscount, totalTax, totalAmount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.supplier_no || !formData.store_no || !formData.account_id) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (cartItems.length === 0) {
      setError('Please add at least one item to the purchase order');
      return;
    }
    
    const totals = calculateTotals();
    const paid = Number(formData.paid || 0);
    
    if (paid > totals.totalAmount) {
      setError('Paid amount cannot exceed total amount');
      return;
    }
    
    const payload = {
      supplier_no: Number(formData.supplier_no),
      store_no: Number(formData.store_no),
      account_id: Number(formData.account_id),
      items: cartItems,
      paid,
      notes: formData.notes,
      status: formData.status
    };
    
    setLoading(true);
    try {
      if (editingPurchase) {
        console.log('[DEBUG Frontend] Updating purchase:', editingPurchase.purchase_no);
        console.log('[DEBUG Frontend] Update payload:', payload);
        await updatePurchase(editingPurchase.purchase_no, payload);
        setSuccess('Purchase order updated successfully');
      } else {
        await addPurchase(payload);
        setSuccess('Purchase order created successfully');
      }
      await fetchAll();
      resetForm();
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error saving purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'paid' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: ['qty', 'price', 'discount', 'tax'].includes(name) 
        ? (value === '' ? 0 : Number(value)) 
        : value
    }));
  };

  // Auto-fill price when product is selected
  const handleProductSelect = (e) => {
    const productNo = e.target.value;
    const selectedProduct = products.find(p => p.product_no === Number(productNo));
    
    setCurrentItem(prev => ({
      ...prev,
      product_no: productNo,
      price: selectedProduct ? selectedProduct.price || 0 : 0
    }));
  };

  const getProductName = (product_no) => {
    const product = products.find(p => p.product_no === product_no);
    return product ? product.product_name || product.name : '';
  };

  const getSupplierName = (supplier_no) => {
    const supplier = suppliers.find(s => s.supplier_no === supplier_no);
    return supplier ? supplier.name : '';
  };

  const getStoreName = (store_no) => {
    const store = stores.find(s => s.store_no === store_no);
    return store ? store.store_name : '';
  };

  const filteredPurchases = purchases.filter(purchase =>
    (purchase.purchase_no && purchase.purchase_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (getSupplierName(purchase.supplier_no).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (getStoreName(purchase.store_no).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totals = calculateTotals();

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
                      <th>Order ID</th>
                      <th>Supplier</th>
                      <th>Store</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Paid</th>
                      <th>Balance Due</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase.purchase_no}>
                        <td>{purchase.purchase_no}</td>
                        <td>{getSupplierName(purchase.supplier_no)}</td>
                        <td>{getStoreName(purchase.store_no)}</td>
                        <td>
                          {purchase.items && purchase.items.length > 0 ? (
                            <div className={styles['items-summary']}>
                              {purchase.items.length} item{purchase.items.length > 1 ? 's' : ''}
                              <div className={styles['items-tooltip']}>
                                {purchase.items.map((item, idx) => (
                                  <div key={idx}>
                                    {getProductName(item.product_no)} (x{item.qty})
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            '1 item' // Fallback for old single-product purchases
                          )}
                        </td>
                        <td>${purchase.total_amount ? purchase.total_amount.toFixed(2) : (purchase.amount || 0).toFixed(2)}</td>
                        <td>${(purchase.paid || 0).toFixed(2)}</td>
                        <td>${((purchase.total_amount || purchase.amount || 0) - (purchase.paid || 0)).toFixed(2)}</td>
                        <td>
                          <span className={`${styles['status-badge']} ${styles[`status-${purchase.status || 'pending'}`]}`}>
                            {(purchase.status || 'pending').charAt(0).toUpperCase() + (purchase.status || 'pending').slice(1)}
                          </span>
                        </td>
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
            <h2 className={styles['main-title']}>
              <ShoppingCart size={24} style={{ marginRight: '8px' }} />
              {editingPurchase ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h2>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Purchase Order Header */}
              <div className={styles['section']}>
                <h3>Purchase Order Details</h3>
                <div className={styles['form-grid']}>
                  <div className={styles['form-group']}>
                    <label>Supplier *</label>
                    <select
                      name="supplier_no"
                      value={formData.supplier_no || ''}
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
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
                    <label>Account *</label>
                    <select
                      name="account_id"
                      value={formData.account_id || ''}
                      onChange={handleInputChange}
                      required
                      className={styles['form-select']}
                    >
                      <option value="">Select an account</option>
                      {accounts.map(a => (
                        <option key={a.account_id} value={a.account_id}>
                          {a.account_name || a.bank || a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Products Section */}
              <div className={styles['section']}>
                <h3>Add Products</h3>
                <div className={styles['add-item-form']}>
                  <div className={styles['form-grid']}>
                    <div className={styles['form-group']}>
                      <label>Product *</label>
                      <select
                        name="product_no"
                        value={currentItem.product_no || ''}
                        onChange={handleProductSelect}
                        className={styles['form-select']}
                      >
                        <option value="">Select a product</option>
                        {products.map(p => (
                          <option key={p.product_no} value={p.product_no}>
                            {p.product_name || p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles['form-group']}>
                      <label>Quantity *</label>
                      <input
                        type="number"
                        name="qty"
                        value={currentItem.qty}
                        onChange={handleItemInputChange}
                        min="1"
                        className={styles['form-input']}
                      />
                    </div>
                    <div className={styles['form-group']}>
                      <label>Price *</label>
                      <input
                        type="number"
                        name="price"
                        value={currentItem.price}
                        onChange={handleItemInputChange}
                        min="0"
                        step="0.01"
                        className={styles['form-input']}
                      />
                    </div>
                    <div className={styles['form-group']}>
                      <label>Discount</label>
                      <input
                        type="number"
                        name="discount"
                        value={currentItem.discount}
                        onChange={handleItemInputChange}
                        min="0"
                        step="0.01"
                        className={styles['form-input']}
                      />
                    </div>
                    <div className={styles['form-group']}>
                      <label>Tax</label>
                      <input
                        type="number"
                        name="tax"
                        value={currentItem.tax}
                        onChange={handleItemInputChange}
                        min="0"
                        step="0.01"
                        className={styles['form-input']}
                      />
                    </div>
                    <div className={styles['form-group']}>
                      <button
                        type="button"
                        onClick={handleAddItemToCart}
                        className={styles['add-item-btn']}
                      >
                        <Plus size={16} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shopping Cart */}
              {cartItems.length > 0 && (
                <div className={styles['section']}>
                  <h3>Shopping Cart ({cartItems.length} items)</h3>
                  <div className={styles['cart-container']}>
                    <table className={styles['cart-table']}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Discount</th>
                          <th>Tax</th>
                          <th>Subtotal</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item, index) => (
                          <tr key={index}>
                            <td>{getProductName(item.product_no)}</td>
                            <td>{item.qty}</td>
                            <td>${item.price.toFixed(2)}</td>
                            <td>${item.discount.toFixed(2)}</td>
                            <td>${item.tax.toFixed(2)}</td>
                            <td>${item.subtotal.toFixed(2)}</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(index)}
                                className={styles['remove-btn']}
                                title="Remove from cart"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className={styles['total-row']}>
                          <td colSpan="5"><strong>Total Amount:</strong></td>
                          <td><strong>${totals.totalAmount.toFixed(2)}</strong></td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {cartItems.length > 0 && (
                <div className={styles['section']}>
                  <h3>Payment Details</h3>
                  <div className={styles['form-grid']}>
                    <div className={styles['form-group']}>
                      <label>Paid Amount</label>
                      <input
                        type="number"
                        name="paid"
                        value={formData.paid}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        max={totals.totalAmount}
                        className={styles['form-input']}
                        placeholder="Enter paid amount"
                      />
                    </div>
                    <div className={styles['form-group']}>
                      <label>Balance Due</label>
                      <input
                        type="number"
                        value={(totals.totalAmount - (formData.paid || 0)).toFixed(2)}
                        readOnly
                        className={styles['form-input']}
                      />
                    </div>
                    <div className={styles['form-group']}>
                      <label>Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className={styles['form-select']}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="received">Received</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className={styles['form-group']}>
                      <label>Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        className={styles['form-textarea']}
                        placeholder="Add any notes or comments..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles['submit-btn']}
                  disabled={cartItems.length === 0}
                >
                  {editingPurchase ? 'Update' : 'Create'} Purchase Order
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
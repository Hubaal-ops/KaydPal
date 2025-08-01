import React, { useState, useEffect } from 'react';
import styles from './StoreProducts.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { getStores } from '../services/storeService';
import {
  getStoreProducts,
  getStoreProductById,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct
} from '../services/storeProductService';

const StoreProducts = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [storeProducts, setStoreProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    product_no: '',
    store_no: '',
    qty: 0
  });
  const [editingStoreProduct, setEditingStoreProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch store products from API
  const fetchStoreProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStoreProducts();
      setStoreProducts(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      setError('Error fetching store products');
    } finally {
      setLoading(false);
    }
  };
  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      setError('Error fetching products');
    }
  };
  // Fetch stores from API
  const fetchStoresList = async () => {
    try {
      const data = await getStores();
      setStores(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      setError('Error fetching stores');
    }
  };
  useEffect(() => {
    fetchStoreProducts();
    fetchProducts();
    fetchStoresList();
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
    setEditingStoreProduct(null);
    setFormData({ product_no: '', store_no: '', qty: 0 });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingStoreProduct(null);
    setFormData({ product_no: '', store_no: '', qty: 0 });
    setError('');
    setSuccess('');
  };

  const handleEdit = (storeProduct) => {
    setEditingStoreProduct(storeProduct);
    setFormData({
      product_no: storeProduct.product_no,
      store_no: storeProduct.store_no,
      qty: storeProduct.qty
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (storeProductNo) => {
    if (window.confirm('Are you sure you want to delete this store product?')) {
      try {
        setLoading(true);
        await deleteStoreProduct(storeProductNo);
        setSuccess('Store product deleted successfully');
        await fetchStoreProducts();
      } catch (error) {
        setError('Error deleting store product');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.product_no) {
      setError('Product is required');
      return;
    }
    if (!formData.store_no) {
      setError('Store is required');
      return;
    }
    if (formData.qty < 0) {
      setError('Quantity cannot be negative');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        product_no: formData.product_no,
        store_no: formData.store_no,
        qty: formData.qty
      };
      if (editingStoreProduct) {
        await updateStoreProduct(editingStoreProduct.store_product_no, payload);
        setSuccess('Store product updated successfully');
      } else {
        await createStoreProduct(payload);
        setSuccess('Store product added successfully');
      }
      await fetchStoreProducts();
      setFormData({ product_no: '', store_no: '', qty: 0 });
      setEditingStoreProduct(null);
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (error) {
      setError('Error saving store product');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Map product/store numbers to names for display
  const getProductName = (product_no) => {
    const prod = products.find(p => p.product_no === product_no || p._id === product_no);
    return prod && typeof prod.product_name === 'string' ? prod.product_name : String(product_no || '');
  };
  const getStoreName = (store_no) => {
    const store = stores.find(s => s.store_no === store_no || s._id === store_no);
    return store && typeof store.store_name === 'string' ? store.store_name : String(store_no || '');
  };

  const filteredStoreProducts = storeProducts.filter(storeProduct =>
    (getProductName(storeProduct.product_no) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (getStoreName(storeProduct.store_no) || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.storeProducts}>
      <div className={styles['store-products-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Inventory
        </button>
        <h1>Store Products Management</h1>
        <p>Manage product inventory across stores</p>
      </div>
      <div className={styles['store-products-content']}>
        <div className={styles['action-buttons']}>
          <button className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`} onClick={handleViewTable}>
            <Eye size={20} />
            View Table
          </button>
          <button className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`} onClick={handleAddNew}>
            <Plus size={20} />
            Add New Store Product
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
                  placeholder="Search store products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredStoreProducts.length} store products found
              </div>
            </div>
            {loading ? (
              <div className={styles.loading}>Loading store products...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Store</th>
                      <th>Quantity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStoreProducts.map((storeProduct) => (
                      <tr key={storeProduct.store_product_no || storeProduct._id || Math.random()}>
                        <td>{storeProduct.store_product_no}</td>
                        <td>{getProductName(storeProduct.product_no)}</td>
                        <td>{getStoreName(storeProduct.store_no)}</td>
                        <td>{storeProduct.qty}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button onClick={() => handleEdit(storeProduct)} className={styles['icon-btn']} title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(storeProduct.store_product_no)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStoreProducts.length === 0 && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No store products found matching your search' : 'No store products found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingStoreProduct ? 'Edit Store Product' : 'Add New Store Product'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
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
                    <option key={product.product_no || product._id} value={product.product_no || product._id}>
                      {product.product_name}
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
                    <option key={store.store_no || store._id} value={store.store_no || store._id}>
                      {store.store_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="qty">Quantity</label>
                <input
                  type="number"
                  id="qty"
                  name="qty"
                  value={formData.qty}
                  onChange={handleInputChange}
                  placeholder="Enter quantity"
                  min="0"
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingStoreProduct ? 'Update Store Product' : 'Add Store Product'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreProducts; 
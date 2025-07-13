import React, { useState, useEffect } from 'react';
import styles from './StoreProducts.module.css';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StoreProducts = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'form'
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

  // Mock data for demonstration
  const mockProducts = [
    { product_no: 1, product_name: 'Macbook Pro 14' },
    { product_no: 2, product_name: 'Nike Running Shoes' },
    { product_no: 3, product_name: 'The Great Gatsby' }
  ];

  const mockStores = [
    { store_no: 1, store_name: 'Main Street Store' },
    { store_no: 2, store_name: 'Downtown Branch' },
    { store_no: 3, store_name: 'Mall Location' }
  ];

  const mockStoreProducts = [
    {
      store_product_ID: 1,
      product_no: 1,
      store_no: 1,
      qty: 5,
      product_name: 'Macbook Pro 14',
      store_name: 'Main Street Store'
    },
    {
      store_product_ID: 2,
      product_no: 2,
      store_no: 1,
      qty: 12,
      product_name: 'Nike Running Shoes',
      store_name: 'Main Street Store'
    },
    {
      store_product_ID: 3,
      product_no: 1,
      store_no: 2,
      qty: 3,
      product_name: 'Macbook Pro 14',
      store_name: 'Downtown Branch'
    },
    {
      store_product_ID: 4,
      product_no: 3,
      store_no: 3,
      qty: 8,
      product_name: 'The Great Gatsby',
      store_name: 'Mall Location'
    }
  ];

  // Simulate API call for store products
  const fetchStoreProducts = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStoreProducts(mockStoreProducts);
    } catch (error) {
      setError('Error fetching store products');
    } finally {
      setLoading(false);
    }
  };

  // Simulate API call for products
  const fetchProducts = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProducts(mockProducts);
    } catch (error) {
      setError('Error fetching products');
    }
  };

  // Simulate API call for stores
  const fetchStores = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setStores(mockStores);
    } catch (error) {
      setError('Error fetching stores');
    }
  };

  useEffect(() => {
    fetchStoreProducts();
    fetchProducts();
    fetchStores();
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

  const handleDelete = async (storeProductId) => {
    if (window.confirm('Are you sure you want to delete this store product?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remove from local state
        setStoreProducts(prev => prev.filter(sp => sp.store_product_ID !== storeProductId));
        setSuccess('Store product deleted successfully');
      } catch (error) {
        setError('Error deleting store product');
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedProduct = products.find(p => p.product_no === parseInt(formData.product_no));
      const selectedStore = stores.find(s => s.store_no === parseInt(formData.store_no));
      
      if (editingStoreProduct) {
        // Update existing store product
        setStoreProducts(prev => prev.map(sp => 
          (sp.product_no === editingStoreProduct.product_no && sp.store_no === editingStoreProduct.store_no)
            ? { 
                ...sp, 
                product_no: parseInt(formData.product_no),
                store_no: parseInt(formData.store_no),
                qty: parseInt(formData.qty),
                product_name: selectedProduct.product_name,
                store_name: selectedStore.store_name
              }
            : sp
        ));
        setSuccess('Store product updated successfully');
      } else {
        // Check if combination already exists
        const exists = storeProducts.some(sp => 
          sp.product_no === parseInt(formData.product_no) && 
          sp.store_no === parseInt(formData.store_no)
        );
        
        if (exists) {
          setError('This product is already assigned to this store');
          return;
        }

        // Add new store product
        const newStoreProduct = {
          store_product_ID: Math.max(...storeProducts.map(sp => sp.store_product_ID)) + 1,
          product_no: parseInt(formData.product_no),
          store_no: parseInt(formData.store_no),
          qty: parseInt(formData.qty),
          product_name: selectedProduct.product_name,
          store_name: selectedStore.store_name
        };
        setStoreProducts(prev => [...prev, newStoreProduct]);
        setSuccess('Store product added successfully');
      }
      
      setFormData({ product_no: '', store_no: '', qty: 0 });
      setEditingStoreProduct(null);
      
      // Auto-switch to table view after successful submission
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (error) {
      setError('Error saving store product');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredStoreProducts = storeProducts.filter(storeProduct =>
    storeProduct.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    storeProduct.store_name.toLowerCase().includes(searchTerm.toLowerCase())
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
            Add New Store Product
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
                  placeholder="Search store products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                      <tr key={storeProduct.store_product_ID}>
                        <td>{storeProduct.store_product_ID}</td>
                        <td>{storeProduct.product_name}</td>
                        <td>{storeProduct.store_name}</td>
                        <td>{storeProduct.qty}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button
                              onClick={() => handleEdit(storeProduct)}
                              className={styles['icon-btn']}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(storeProduct.store_product_ID)}
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
                {filteredStoreProducts.length === 0 && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No store products found matching your search' : 'No store products found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Form View */}
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
                    <option key={product.product_no} value={product.product_no}>
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
                    <option key={store.store_no} value={store.store_no}>
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
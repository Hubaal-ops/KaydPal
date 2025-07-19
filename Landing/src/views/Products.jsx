import React, { useState, useEffect } from 'react';
import styles from './Products.module.css';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Search,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import categoryService from '../services/categoryService';

const Products = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'form'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    product_name: '',
    category: '',
    quantity: 0
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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
    setEditingProduct(null);
    setFormData({ product_name: '', category: '', storing_balance: 0 });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingProduct(null);
    setFormData({ product_name: '', category: '', storing_balance: 0 });
    setError('');
    setSuccess('');
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      category: product.category || '',
      quantity: product.quantity || 0
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (productNo) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productNo);
        await fetchProducts(); // Refresh the products list
        setSuccess('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        setError(error.message || 'Failed to delete product');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.product_name.trim()) {
      setError('Product name is required');
      return;
    }

    try {
      setLoading(true);
      
      if (editingProduct) {
        // Update existing product
        await productService.updateProduct(editingProduct.product_no, formData);
        setSuccess('Product updated successfully');
      } else {
        // Add new product
        await productService.createProduct(formData);
        setSuccess('Product created successfully');
      }
      
      // Refresh products list
      await fetchProducts();
      
      // Reset form and switch to table view
      setFormData({
        product_name: '',
        category: '',
        quantity: 0
      });
      setEditingProduct(null);
      
      // Auto-switch to table view after successful submission
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.message || 'Failed to save product');
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

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.products}>
      <div className={styles['products-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Inventory
        </button>
        <h1>Products Management</h1>
        <p>Add, edit, and manage product information</p>
      </div>

      <div className={styles['products-content']}>
        {/* Action Buttons */}
        <div className={styles['action-buttons']}>
          <button 
            className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={handleViewTable}
            disabled={loading}
          >
            {loading && viewMode === 'table' ? (
              <Loader2 className={styles.spinner} size={20} />
            ) : (
              <Eye size={20} />
            )}
            View Table
          </button>
          <button 
            className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`}
            onClick={handleAddNew}
            disabled={loading}
          >
            <Plus size={20} />
            Add New Product
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
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                  disabled={loading}
                />
              </div>
              <div className={styles['table-info']}>
                {loading ? 'Loading...' : `${filteredProducts.length} products found`}
              </div>
            </div>

            {loading && products.length === 0 ? (
              <div className={styles.loading}>
                <Loader2 className={styles.spinner} size={24} />
                <span>Loading products...</span>
              </div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Storing Balance</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      // Format the date to a readable format
                      const formattedDate = product.created_at 
                        ? new Date(product.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : '-';
                        
                      return (
                        <tr key={product.product_no}>
                          <td>{product.product_no}</td>
                          <td>
                            <div className={styles['product-name']}>
                              {product.product_name}
                              {product.sku && (
                                <span className={styles['product-sku']}>{product.sku}</span>
                              )}
                            </div>
                          </td>
                          <td>{product.category || '-'}</td>
                          <td>{product.storing_balance ?? 0}</td>
                          <td>{formattedDate}</td>
                          <td>
                            <div className={styles['action-icons']}>
                              <button
                                onClick={() => handleEdit(product)}
                                className={styles['icon-btn']}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(product.product_no)}
                                className={`${styles['icon-btn']} ${styles.delete}`}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && !loading && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No products found matching your search' : 'No products found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Form View */}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles['form-group']}>
                <label htmlFor="product_name">Product Name *</label>
                <input
                  type="text"
                  id="product_name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="Enter product name"
                />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.category_id} value={category.category_name}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="storing_balance">Storing Balance *</label>
                <input
                  type="number"
                  id="storing_balance"
                  name="storing_balance"
                  value={formData.storing_balance ?? ''}
                  onChange={handleInputChange}
                  min="0"
                  required
                  disabled={loading}
                  placeholder="Enter storing balance"
                />
              </div>

              <div className={styles['form-actions']}>
                <button
                  type="button"
                  className={styles['cancel-btn']}
                  onClick={handleViewTable}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles['save-btn']}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className={styles.spinner} size={18} />
                      {editingProduct ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingProduct ? (
                    'Update Product'
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
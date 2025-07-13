import React, { useState, useEffect } from 'react';
import styles from './Products.module.css';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    storing_balance: 0
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data for demonstration
  const mockCategories = [
    { category_id: 1, category_name: 'Electronics' },
    { category_id: 2, category_name: 'Clothing' },
    { category_id: 3, category_name: 'Books' },
    { category_id: 4, category_name: 'Home & Garden' },
    { category_id: 5, category_name: 'Sports & Outdoors' }
  ];

  const mockProducts = [
    {
      product_no: 1,
      product_name: 'Macbook Pro 14',
      category: 'Electronics',
      storing_balance: 5,
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      product_no: 2,
      product_name: 'Nike Running Shoes',
      category: 'Sports & Outdoors',
      storing_balance: 12,
      created_at: '2024-01-16T14:20:00Z'
    },
    {
      product_no: 3,
      product_name: 'The Great Gatsby',
      category: 'Books',
      storing_balance: 8,
      created_at: '2024-01-17T09:15:00Z'
    }
  ];

  // Simulate API call for products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProducts(mockProducts);
    } catch (error) {
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  // Simulate API call for categories
  const fetchCategories = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setCategories(mockCategories);
    } catch (error) {
      setError('Error fetching categories');
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
      category: product.category,
      storing_balance: product.storing_balance
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (productNo) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remove from local state
        setProducts(prev => prev.filter(prod => prod.product_no !== productNo));
        setSuccess('Product deleted successfully');
      } catch (error) {
        setError('Error deleting product');
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

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingProduct) {
        // Update existing product
        setProducts(prev => prev.map(prod => 
          prod.product_no === editingProduct.product_no 
            ? { ...prod, ...formData }
            : prod
        ));
        setSuccess('Product updated successfully');
      } else {
        // Add new product
        const newProduct = {
          product_no: Math.max(...products.map(p => p.product_no)) + 1,
          product_name: formData.product_name,
          category: formData.category,
          storing_balance: parseInt(formData.storing_balance) || 0,
          created_at: new Date().toISOString()
        };
        setProducts(prev => [...prev, newProduct]);
        setSuccess('Product added successfully');
      }
      
      setFormData({ product_name: '', category: '', storing_balance: 0 });
      setEditingProduct(null);
      
      // Auto-switch to table view after successful submission
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (error) {
      setError('Error saving product');
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
          >
            <Eye size={20} />
            View Table
          </button>
          <button 
            className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`}
            onClick={handleAddNew}
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
                />
              </div>
              <div className={styles['table-info']}>
                {filteredProducts.length} products found
              </div>
            </div>

            {loading ? (
              <div className={styles.loading}>Loading products...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product No</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Storing Balance</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.product_no}>
                        <td>{product.product_no}</td>
                        <td>{product.product_name}</td>
                        <td>{product.category}</td>
                        <td>{product.storing_balance}</td>
                        <td>{new Date(product.created_at).toLocaleDateString()}</td>
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
                    ))}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && (
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
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="product_name">Product Name *</label>
                <input
                  type="text"
                  id="product_name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                  className={styles['form-input']}
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
                  className={styles['form-select']}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_name}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="storing_balance">Storing Balance</label>
                <input
                  type="number"
                  id="storing_balance"
                  name="storing_balance"
                  value={formData.storing_balance}
                  onChange={handleInputChange}
                  placeholder="Enter storing balance"
                  min="0"
                  className={styles['form-input']}
                />
              </div>

              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingProduct ? 'Update Product' : 'Add Product'}
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
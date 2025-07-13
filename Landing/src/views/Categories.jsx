import React, { useState, useEffect } from 'react';
import styles from './Categories.module.css';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Categories = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'form'
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    category_name: '',
    description: ''
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data for demonstration
  const mockCategories = [
    {
      category_id: 1,
      category_name: 'Electronics',
      description: 'Electronic devices and gadgets',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      category_id: 2,
      category_name: 'Clothing',
      description: 'Apparel and fashion items',
      created_at: '2024-01-16T14:20:00Z'
    },
    {
      category_id: 3,
      category_name: 'Books',
      description: 'Books and publications',
      created_at: '2024-01-17T09:15:00Z'
    }
  ];

  // Simulate API call
  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCategories(mockCategories);
    } catch (error) {
      setError('Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleBackClick = () => {
    // Go back to the main inventory view
    if (onBack) {
      onBack();
    } else {
      navigate('/inventory');
    }
  };

  const handleViewTable = () => {
    setViewMode('table');
    setEditingCategory(null);
    setFormData({ category_name: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingCategory(null);
    setFormData({ category_name: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      description: category.description || ''
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remove from local state
        setCategories(prev => prev.filter(cat => cat.category_id !== categoryId));
        setSuccess('Category deleted successfully');
      } catch (error) {
        setError('Error deleting category');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.category_name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingCategory) {
        // Update existing category
        setCategories(prev => prev.map(cat => 
          cat.category_id === editingCategory.category_id 
            ? { ...cat, ...formData }
            : cat
        ));
        setSuccess('Category updated successfully');
      } else {
        // Add new category
        const newCategory = {
          category_id: Math.max(...categories.map(c => c.category_id)) + 1,
          category_name: formData.category_name,
          description: formData.description,
          created_at: new Date().toISOString()
        };
        setCategories(prev => [...prev, newCategory]);
        setSuccess('Category added successfully');
      }
      
      setFormData({ category_name: '', description: '' });
      setEditingCategory(null);
      
      // Auto-switch to table view after successful submission
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (error) {
      setError('Error saving category');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredCategories = categories.filter(category =>
    category.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.categories}>
      <div className={styles['categories-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Inventory
        </button>
        <h1>Categories Management</h1>
        <p>Manage product categories and classifications</p>
      </div>

      <div className={styles['categories-content']}>
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
            Add New Category
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
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredCategories.length} categories found
              </div>
            </div>

            {loading ? (
              <div className={styles.loading}>Loading categories...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category Name</th>
                      <th>Description</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category.category_id}>
                        <td>{category.category_id}</td>
                        <td>{category.category_name}</td>
                        <td>{category.description || '-'}</td>
                        <td>{new Date(category.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button
                              onClick={() => handleEdit(category)}
                              className={styles['icon-btn']}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(category.category_id)}
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
                {filteredCategories.length === 0 && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No categories found matching your search' : 'No categories found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Form View */}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="category_name">Category Name *</label>
                <input
                  type="text"
                  id="category_name"
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                  className={styles['form-input']}
                />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter category description (optional)"
                  rows="4"
                  className={styles['form-textarea']}
                />
              </div>

              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories; 
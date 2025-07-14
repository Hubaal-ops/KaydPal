import React, { useState } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExpenseCategory = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [categories, setCategories] = useState([
    {
      category_id: 1,
      name: 'Utilities',
      description: 'Electricity, water, internet',
      created_at: '2024-06-01T10:00:00Z'
    },
    {
      category_id: 2,
      name: 'Office Supplies',
      description: 'Stationery, printer ink',
      created_at: '2024-06-02T12:30:00Z'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/financial');
    }
  };

  const handleViewTable = () => {
    setViewMode('table');
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = (category_id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(prev => prev.filter(cat => cat.category_id !== category_id));
      setSuccess('Category deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (editingCategory) {
      setCategories(prev => prev.map(cat =>
        cat.category_id === editingCategory.category_id ? { ...cat, ...formData } : cat
      ));
      setSuccess('Category updated successfully');
    } else {
      const newCat = {
        category_id: Math.max(...categories.map(c => c.category_id), 0) + 1,
        ...formData,
        created_at: new Date().toISOString()
      };
      setCategories(prev => [...prev, newCat]);
      setSuccess('Category added successfully');
    }
    setFormData({ name: '', description: '' });
    setEditingCategory(null);
    setTimeout(() => setViewMode('table'), 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.stores}>
      <div className={styles['stores-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Financial
        </button>
        <h1>Expense Categories</h1>
        <p>Manage expense categories</p>
      </div>
      <div className={styles['stores-content']}>
        <div className={styles['action-buttons']}>
          <button className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`} onClick={handleViewTable}>
            <Eye size={20} />
            View Table
          </button>
          <button className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`} onClick={handleAddNew}>
            <Plus size={20} />
            Add New Category
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
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredCategories.length} categories found
              </div>
            </div>
            <div className={styles['table-wrapper']}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Category ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Date Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map(cat => (
                    <tr key={cat.category_id}>
                      <td>{cat.category_id}</td>
                      <td>{cat.name}</td>
                      <td>{cat.description}</td>
                      <td>{new Date(cat.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className={styles['action-icons']}>
                          <button onClick={() => handleEdit(cat)} className={styles['icon-btn']} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(cat.category_id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
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
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter description"
                  className={styles['form-input']}
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

export default ExpenseCategory; 
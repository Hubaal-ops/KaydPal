import React, { useState, useEffect, useRef } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getExpenseCategories,
  getExpenseCategoryById,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  exportCategoriesToExcel,
  importCategoriesFromExcel,
  downloadImportTemplate
} from '../services/expenseCategoryService';

const ExpenseCategory = ({ onBack }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [viewMode, setViewMode] = useState('table');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importResults, setImportResults] = useState(null);

  // Fetch categories from backend
  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getExpenseCategories();
      setCategories(data);
    } catch (err) {
      setError('Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
      description: cat.description || ''
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setLoading(true);
      setError('');
      try {
        await deleteExpenseCategory(id);
        setSuccess('Category deleted successfully');
        fetchCategories();
      } catch (err) {
        setError('Error deleting category');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    try {
      if (editingCategory) {
        await updateExpenseCategory(editingCategory._id, formData);
        setSuccess('Category updated successfully');
      } else {
        await createExpenseCategory(formData);
        setSuccess('Category added successfully');
      }
      setFormData({ name: '', description: '' });
      setEditingCategory(null);
      fetchCategories();
      setTimeout(() => {
        setViewMode('table');
      }, 1200);
    } catch (err) {
      setError('Error saving category');
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

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setImportResults(null);
      
      console.log('Starting export...');
      const result = await exportCategoriesToExcel();
      
      setSuccess(result.message || 'Export completed successfully');
      console.log('Export successful:', result);
    } catch (err) {
      console.error('Export failed:', err);
      
      // Handle structured error objects
      const errorMessage = err.errors && err.errors.length > 0
        ? `${err.message}: ${err.errors.join(', ')}`
        : err.message || 'Failed to export categories';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setImportResults(null);
      
      console.log('Starting import...', file);
      const result = await importCategoriesFromExcel(file);
      
      console.log('Import result:', result);
      
      // Update UI with import results
      setImportResults(result);
      setSuccess(result.message || 'Import completed successfully');
      
      // Refresh the categories list if any were imported
      if (result.imported > 0) {
        fetchCategories();
      }
    } catch (err) {
      console.error('Import failed:', err);
      
      // Handle structured error objects
      const errorMessage = err.errors && err.errors.length > 0
        ? `${err.message}: ${JSON.stringify(err.errors)}`
        : err.message || 'Failed to import categories';
      
      setError(errorMessage);
      
      // Still show partial results if available
      if (err.imported !== undefined || err.skipped !== undefined) {
        setImportResults({
          imported: err.imported || 0,
          skipped: err.skipped || 0,
          errors: err.errors || []
        });
      }
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('Downloading template...');
      await downloadImportTemplate();
      
      setSuccess('Template downloaded successfully');
      console.log('Template download successful');
    } catch (err) {
      console.error('Template download failed:', err);
      
      const errorMessage = err.message || 'Failed to download template';
      setError(errorMessage);
      
      // Show more detailed error if available
      if (err.response) {
        console.error('Server response:', err.response);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description || '').toLowerCase().includes(searchTerm.toLowerCase())
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
          <button
            className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={handleViewTable}
          >
            <Eye size={20} />
            View Table
          </button>
          <button
            className={styles['action-btn']}
            onClick={handleExport}
            disabled={loading}
          >
            <Download size={20} />
            Export to Excel
          </button>
          <button
            className={styles['action-btn']}
            onClick={handleImportClick}
            disabled={loading}
          >
            <Upload size={20} />
            Import from Excel
          </button>
          <button
            className={styles['action-btn']}
            onClick={handleDownloadTemplate}
          >
            Download Template
          </button>
          <button
            className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`}
            onClick={handleAddNew}
          >
            <Plus size={20} />
            Add New Category
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {importResults && (
          <div className={styles.importResults}>
            <div className={styles.importSummary}>
              <h4>Import Results</h4>
              <div className={styles.importStats}>
                {importResults.imported > 0 && (
                  <div className={styles.statItem}>
                    <span className={styles.statValue} style={{ color: '#4caf50' }}>
                      {importResults.imported}
                    </span>
                    <span className={styles.statLabel}>Imported</span>
                  </div>
                )}
                {importResults.skipped > 0 && (
                  <div className={styles.statItem}>
                    <span className={styles.statValue} style={{ color: '#ff9800' }}>
                      {importResults.skipped}
                    </span>
                    <span className={styles.statLabel}>Skipped</span>
                  </div>
                )}
                {importResults.errors && importResults.errors.length > 0 && (
                  <div className={styles.statItem}>
                    <span className={styles.statValue} style={{ color: '#f44336' }}>
                      {importResults.errors.length}
                    </span>
                    <span className={styles.statLabel}>Errors</span>
                  </div>
                )}
              </div>
              
              {importResults.message && (
                <div className={styles.importMessage}>
                  {importResults.message}
                </div>
              )}
            </div>

            {importResults.errors && importResults.errors.length > 0 && (
              <div className={styles.importErrors}>
                <h5>Error Details:</h5>
                <div className={styles.errorList}>
                  {importResults.errors.map((error, index) => {
                    // Handle both string errors and error objects
                    const errorText = typeof error === 'string' 
                      ? error 
                      : error.message || JSON.stringify(error);
                    
                    return (
                      <div key={index} className={styles.errorItem}>
                        <span className={styles.errorBullet}>•</span>
                        <span className={styles.errorText}>{errorText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {importResults.imported > 0 && (
              <div className={styles.importSuccess}>
                <span className={styles.successIcon}>✓</span>
                <span>Refresh the page to see the updated categories</span>
              </div>
            )}
          </div>
        )}
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
            {loading ? (
              <div className={styles.loading}>Loading categories...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Date Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map(cat => (
                      <tr key={cat._id}>
                        <td>{cat.name}</td>
                        <td>{cat.description}</td>
                        <td>{cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : ''}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button onClick={() => handleEdit(cat)} className={styles['icon-btn']} title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(cat._id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCategories.length === 0 && !loading && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No categories found matching your search' : 'No categories found'}
                  </div>
                )}
              </div>
            )}
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
                  className={styles['form-input']}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  className={styles['form-input']}
                  value={formData.description}
                  onChange={handleInputChange}
                  maxLength={200}
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" className={styles['cancel-btn']} onClick={handleViewTable}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingCategory ? 'Update' : 'Add'}
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
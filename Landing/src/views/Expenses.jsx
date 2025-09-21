import React, { useState, useEffect, useRef } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpensesToExcel,
  importExpensesFromExcel,
  downloadExpenseTemplate
} from '../services/expenseService';
import { getExpenseCategories } from '../services/expenseCategoryService';
import { getAccounts } from '../services/accountService';

const Expenses = ({ onBack }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [viewMode, setViewMode] = useState('table');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    account: '',
    amount: '',
    description: '',
    expense_date: ''
  });
  const [editingExpense, setEditingExpense] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importResults, setImportResults] = useState(null);

  // Fetch expenses, categories, and accounts from backend
  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      setError('Error fetching expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getExpenseCategories();
      setCategories(data);
    } catch (err) {
      setError('Error fetching categories');
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      setError('Error fetching accounts');
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchAccounts();
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
    setEditingExpense(null);
    setFormData({ category: '', account: '', amount: '', description: '', expense_date: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingExpense(null);
    setFormData({ category: '', account: '', amount: '', description: '', expense_date: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (exp) => {
    setEditingExpense(exp);
    setFormData({
      category: exp.category?._id || '',
      account: exp.account?._id || '',
      amount: exp.amount,
      description: exp.description || '',
      expense_date: exp.expense_date ? exp.expense_date.slice(0, 10) : ''
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setLoading(true);
      setError('');
      try {
        await deleteExpense(id);
        setSuccess('Expense deleted successfully');
        fetchExpenses();
      } catch (err) {
        setError('Error deleting expense');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.category || !formData.account || !formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      setError('All fields except description are required and must be valid');
      return;
    }
    setLoading(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense._id, {
          ...formData,
          amount: Number(formData.amount)
        });
        setSuccess('Expense updated successfully');
      } else {
        await createExpense({
          ...formData,
          amount: Number(formData.amount)
        });
        setSuccess('Expense added successfully');
      }
      setFormData({ category: '', account: '', amount: '', description: '', expense_date: '' });
      setEditingExpense(null);
      fetchExpenses();
      setTimeout(() => {
        setViewMode('table');
      }, 1200);
    } catch (err) {
      setError('Error saving expense');
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

  // Export handler
  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setImportResults(null);
      
      // Check if there are expenses to export
      if (expenses.length === 0) {
        setError('No expenses available to export. Please add some expenses first.');
        return;
      }
      
      console.log('Starting export...');
      const result = await exportExpensesToExcel();
      
      setSuccess(result.message || 'Export completed successfully');
      console.log('Export successful:', result);
    } catch (err) {
      console.error('Export failed:', err);
      
      // Handle structured error objects
      const errorMessage = err.errors && err.errors.length > 0
        ? `${err.message}: ${err.errors.join(', ')}`
        : err.message || 'Failed to export expenses';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Import handler
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is Excel
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload a valid Excel file (.xlsx, .xls) or CSV file.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setImportResults(null);

    try {
      const result = await importExpensesFromExcel(file);
      setSuccess(result.message);
      
      // Show import results if available
      if (result.imported !== undefined || result.skipped !== undefined) {
        setImportResults({
          imported: result.imported || 0,
          skipped: result.skipped || 0,
          errors: result.errors || []
        });
        
        // Show a more detailed success message if some records were imported
        if (result.imported > 0) {
          setSuccess(`Successfully imported ${result.imported} expense(s). ${result.skipped > 0 ? `${result.skipped} record(s) were skipped.` : ''}`);
        }
      }
      
      // Refresh the expenses list
      await fetchExpenses();
    } catch (error) {
      console.error('Import error:', error);
      
      // Handle structured error objects
      const errorMessage = error.errors && error.errors.length > 0
        ? `${error.message}: ${error.errors.join(', ')}`
        : error.message || 'Error importing expenses';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Template download handler
  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setImportResults(null);
      
      console.log('Downloading template...');
      const result = await downloadExpenseTemplate();
      
      setSuccess(result.message || 'Template downloaded successfully');
      console.log('Template download successful:', result);
    } catch (err) {
      console.error('Template download failed:', err);
      
      const errorMessage = err.errors && err.errors.length > 0
        ? `${err.message}: ${err.errors.join(', ')}`
        : err.message || 'Failed to download template';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Import click handler
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const filteredExpenses = expenses.filter(exp => {
    const catName = exp.category?.name || '';
    const accName = exp.account?.name || '';
    const accBank = exp.account?.bank || '';
    return (
      catName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accBank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className={styles.stores}>
      <div className={styles['stores-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Financial
        </button>
        <h1>Expenses</h1>
        <p>Manage expenses</p>
      </div>
      <div className={styles['stores-content']}>
        <div className={styles['action-buttons']}>
          <button className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`} onClick={handleViewTable}>
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
            disabled={loading}
          >
            Download Template
          </button>
          <button className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`} onClick={handleAddNew}>
            <Plus size={20} />
            Add New Expense
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
              {importResults.errors && importResults.errors.length > 0 && (
                <div className={styles.importErrors}>
                  <h5>Errors:</h5>
                  <ul>
                    {importResults.errors.map((error, index) => (
                      <li key={index}>
                        {error.row ? `Row ${error.row}: ` : ''}{error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'table' && (
          <div className={styles['table-container']}>
            <div className={styles['table-header']}>
              <div className={styles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredExpenses.length} expenses found
              </div>
            </div>
            {loading ? (
              <div className={styles.loading}>Loading expenses...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category</th>
                      <th>Account</th>
                      <th>Bank</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(exp => (
                      <tr key={exp._id}>
                        <td>{exp.expense_id}</td>
                        <td>{exp.category?.name || ''}</td>
                        <td>{exp.account?.name || ''}</td>
                        <td>{exp.account?.bank || ''}</td>
                        <td>{exp.amount}</td>
                        <td>{exp.description}</td>
                        <td>{exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : ''}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button onClick={() => handleEdit(exp)} className={styles['icon-btn']} title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(exp._id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredExpenses.length === 0 && !loading && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No expenses found matching your search' : 'No expenses found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  className={styles['form-input']}
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="account">Account</label>
                <select
                  id="account"
                  name="account"
                  className={styles['form-input']}
                  value={formData.account}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Account</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>{acc.name} ({acc.bank})</option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  className={styles['form-input']}
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
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
              <div className={styles['form-group']}>
                <label htmlFor="expense_date">Expense Date</label>
                <input
                  type="date"
                  id="expense_date"
                  name="expense_date"
                  className={styles['form-input']}
                  value={formData.expense_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" className={styles['cancel-btn']} onClick={handleViewTable}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingExpense ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
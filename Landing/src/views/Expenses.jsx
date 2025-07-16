import React, { useState, useEffect } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} from '../services/expenseService';
import { getExpenseCategories } from '../services/expenseCategoryService';
import { getAccounts } from '../services/accountService';

const Expenses = ({ onBack }) => {
  const navigate = useNavigate();
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
          <button className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`} onClick={handleAddNew}>
            <Plus size={20} />
            Add New Expense
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
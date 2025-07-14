import React, { useState } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Expenses = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [expenses, setExpenses] = useState([
    {
      expense_id: 1,
      category: 'Utilities',
      amount: 120.5,
      description: 'Electricity bill',
      date: '2024-06-01T10:00:00Z'
    },
    {
      expense_id: 2,
      category: 'Office Supplies',
      amount: 45.0,
      description: 'Printer ink',
      date: '2024-06-02T12:30:00Z'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: ''
  });
  const [editingExpense, setEditingExpense] = useState(null);
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
    setEditingExpense(null);
    setFormData({ category: '', amount: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingExpense(null);
    setFormData({ category: '', amount: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (exp) => {
    setEditingExpense(exp);
    setFormData({
      category: exp.category,
      amount: exp.amount,
      description: exp.description
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = (expense_id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(prev => prev.filter(exp => exp.expense_id !== expense_id));
      setSuccess('Expense deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.category.trim() || !formData.amount) {
      setError('All fields are required');
      return;
    }
    if (editingExpense) {
      setExpenses(prev => prev.map(exp =>
        exp.expense_id === editingExpense.expense_id ? { ...exp, ...formData } : exp
      ));
      setSuccess('Expense updated successfully');
    } else {
      const newExp = {
        expense_id: Math.max(...expenses.map(e => e.expense_id), 0) + 1,
        ...formData,
        date: new Date().toISOString()
      };
      setExpenses(prev => [...prev, newExp]);
      setSuccess('Expense added successfully');
    }
    setFormData({ category: '', amount: '', description: '' });
    setEditingExpense(null);
    setTimeout(() => setViewMode('table'), 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredExpenses = expenses.filter(exp =>
    exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className={styles['table-wrapper']}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Expense ID</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp.expense_id}>
                      <td>{exp.expense_id}</td>
                      <td>{exp.category}</td>
                      <td>{exp.amount}</td>
                      <td>{exp.description}</td>
                      <td>{new Date(exp.date).toLocaleDateString()}</td>
                      <td>
                        <div className={styles['action-icons']}>
                          <button onClick={() => handleEdit(exp)} className={styles['icon-btn']} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(exp.expense_id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredExpenses.length === 0 && (
                <div className={styles['no-data']}>
                  {searchTerm ? 'No expenses found matching your search' : 'No expenses found'}
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className={styles['form-input']}
                >
                  <option value="">Select Category</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Office Supplies">Office Supplies</option>
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  required
                  className={styles['form-input']}
                  min="0.01"
                  step="0.01"
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
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
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
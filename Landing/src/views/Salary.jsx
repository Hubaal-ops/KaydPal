import React, { useState } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Salary = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [salaries, setSalaries] = useState([
    {
      salary_id: 1,
      employee: 'John Doe',
      store: 'Main Street Store',
      amount: 2000,
      month: 'May 2024',
      status: 'Paid',
      date_paid: '2024-05-31T10:00:00Z'
    },
    {
      salary_id: 2,
      employee: 'Jane Smith',
      store: 'Downtown Branch',
      amount: 1800,
      month: 'May 2024',
      status: 'Pending',
      date_paid: ''
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    employee: '',
    store: '',
    amount: '',
    month: '',
    status: 'Pending',
    date_paid: ''
  });
  const [editingSalary, setEditingSalary] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  const handleViewTable = () => {
    setViewMode('table');
    setEditingSalary(null);
    setFormData({ employee: '', store: '', amount: '', month: '', status: 'Pending', date_paid: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingSalary(null);
    setFormData({ employee: '', store: '', amount: '', month: '', status: 'Pending', date_paid: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (sal) => {
    setEditingSalary(sal);
    setFormData({
      employee: sal.employee,
      store: sal.store,
      amount: sal.amount,
      month: sal.month,
      status: sal.status,
      date_paid: sal.date_paid ? sal.date_paid.split('T')[0] : ''
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = (salary_id) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      setSalaries(prev => prev.filter(sal => sal.salary_id !== salary_id));
      setSuccess('Salary record deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.employee.trim() || !formData.store.trim() || !formData.amount || !formData.month.trim()) {
      setError('All fields except Date Paid are required');
      return;
    }
    if (editingSalary) {
      setSalaries(prev => prev.map(sal =>
        sal.salary_id === editingSalary.salary_id ? { ...sal, ...formData, date_paid: formData.date_paid ? new Date(formData.date_paid).toISOString() : '' } : sal
      ));
      setSuccess('Salary record updated successfully');
    } else {
      const newSal = {
        salary_id: Math.max(...salaries.map(s => s.salary_id), 0) + 1,
        ...formData,
        date_paid: formData.date_paid ? new Date(formData.date_paid).toISOString() : ''
      };
      setSalaries(prev => [...prev, newSal]);
      setSuccess('Salary record added successfully');
    }
    setFormData({ employee: '', store: '', amount: '', month: '', status: 'Pending', date_paid: '' });
    setEditingSalary(null);
    setTimeout(() => setViewMode('table'), 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredSalaries = salaries.filter(sal =>
    sal.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sal.store.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sal.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sal.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.stores}>
      <div className={styles['stores-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Salary</h1>
        <p>Manage employee salary records</p>
      </div>
      <div className={styles['stores-content']}>
        <div className={styles['action-buttons']}>
          <button className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`} onClick={handleViewTable}>
            <Eye size={20} />
            View Table
          </button>
          <button className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`} onClick={handleAddNew}>
            <Plus size={20} />
            Add New Salary
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
                  placeholder="Search salaries..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredSalaries.length} salary records found
              </div>
            </div>
            <div className={styles['table-wrapper']}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Salary ID</th>
                    <th>Employee Name</th>
                    <th>Store</th>
                    <th>Amount</th>
                    <th>Month</th>
                    <th>Status</th>
                    <th>Date Paid</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalaries.map(sal => (
                    <tr key={sal.salary_id}>
                      <td>{sal.salary_id}</td>
                      <td>{sal.employee}</td>
                      <td>{sal.store}</td>
                      <td>{sal.amount}</td>
                      <td>{sal.month}</td>
                      <td>{sal.status}</td>
                      <td>{sal.date_paid ? new Date(sal.date_paid).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className={styles['action-icons']}>
                          <button onClick={() => handleEdit(sal)} className={styles['icon-btn']} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(sal.salary_id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSalaries.length === 0 && (
                <div className={styles['no-data']}>
                  {searchTerm ? 'No salary records found matching your search' : 'No salary records found'}
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingSalary ? 'Edit Salary' : 'Add New Salary'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="employee">Employee Name *</label>
                <input
                  type="text"
                  id="employee"
                  name="employee"
                  value={formData.employee}
                  onChange={handleInputChange}
                  placeholder="Enter employee name"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="store">Store *</label>
                <input
                  type="text"
                  id="store"
                  name="store"
                  value={formData.store}
                  onChange={handleInputChange}
                  placeholder="Enter store name"
                  required
                  className={styles['form-input']}
                />
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
                  min="1"
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="month">Month *</label>
                <input
                  type="text"
                  id="month"
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  placeholder="e.g. May 2024"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={styles['form-input']}
                  required
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="date_paid">Date Paid</label>
                <input
                  type="date"
                  id="date_paid"
                  name="date_paid"
                  value={formData.date_paid}
                  onChange={handleInputChange}
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingSalary ? 'Update Salary' : 'Add Salary'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Salary; 
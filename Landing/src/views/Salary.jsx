import React, { useState, useEffect } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getSalaries,
  getSalaryById,
  createSalary,
  updateSalary,
  deleteSalary
} from '../services/salaryService';
import { getEmployees } from '../services/employeeService';
import { getAccounts } from '../services/accountService';

const Salary = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    employee: '',
    account: '',
    amount: '',
    pay_date: '',
    description: ''
  });
  const [editingSalary, setEditingSalary] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch salaries, employees, and accounts from backend
  const fetchSalaries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSalaries();
      setSalaries(data);
    } catch (err) {
      setError('Error fetching salaries');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      setError('Error fetching employees');
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
    fetchSalaries();
    fetchEmployees();
    fetchAccounts();
  }, []);

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
    setFormData({ employee: '', account: '', amount: '', pay_date: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingSalary(null);
    setFormData({ employee: '', account: '', amount: '', pay_date: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (sal) => {
    setEditingSalary(sal);
    setFormData({
      employee: sal.employee?._id || '',
      account: sal.account?._id || '',
      amount: sal.amount,
      pay_date: sal.pay_date ? sal.pay_date.slice(0, 10) : '',
      description: sal.description || ''
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      setLoading(true);
      setError('');
      try {
        await deleteSalary(id);
        setSuccess('Salary record deleted successfully');
        fetchSalaries();
      } catch (err) {
        setError('Error deleting salary record');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.employee || !formData.account || !formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0 || !formData.pay_date) {
      setError('All fields except description are required and must be valid');
      return;
    }
    setLoading(true);
    try {
      if (editingSalary) {
        await updateSalary(editingSalary._id, {
          ...formData,
          amount: Number(formData.amount)
        });
        setSuccess('Salary record updated successfully');
      } else {
        await createSalary({
          ...formData,
          amount: Number(formData.amount)
        });
        setSuccess('Salary record added successfully');
      }
      setFormData({ employee: '', account: '', amount: '', pay_date: '', description: '' });
      setEditingSalary(null);
      fetchSalaries();
      setTimeout(() => {
        setViewMode('table');
      }, 1200);
    } catch (err) {
      setError('Error saving salary record');
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

  const filteredSalaries = salaries.filter(sal => {
    const empName = sal.employee?.name || '';
    const accName = sal.account?.name || '';
    const accBank = sal.account?.bank || '';
    return (
      empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accBank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sal.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
            {loading ? (
              <div className={styles.loading}>Loading salaries...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Account</th>
                      <th>Bank</th>
                      <th>Amount</th>
                      <th>Pay Date</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalaries.map(sal => (
                      <tr key={sal._id}>
                        <td>{sal.employee?.name || ''}</td>
                        <td>{sal.account?.name || ''}</td>
                        <td>{sal.account?.bank || ''}</td>
                        <td>{sal.amount}</td>
                        <td>{sal.pay_date ? new Date(sal.pay_date).toLocaleDateString() : ''}</td>
                        <td>{sal.description}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button onClick={() => handleEdit(sal)} className={styles['icon-btn']} title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(sal._id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredSalaries.length === 0 && !loading && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No salary records found matching your search' : 'No salary records found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingSalary ? 'Edit Salary' : 'Add New Salary'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="employee">Employee</label>
                <select
                  id="employee"
                  name="employee"
                  className={styles['form-input']}
                  value={formData.employee}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.position})</option>
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
                <label htmlFor="pay_date">Pay Date</label>
                <input
                  type="date"
                  id="pay_date"
                  name="pay_date"
                  className={styles['form-input']}
                  value={formData.pay_date}
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
                  {editingSalary ? 'Update' : 'Add'}
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
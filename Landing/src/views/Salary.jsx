import React, { useState, useEffect, useRef } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getSalaries,
  getSalaryById,
  createSalary,
  updateSalary,
  deleteSalary,
  exportSalariesToExcel,
  importSalariesFromExcel,
  downloadSalaryTemplate
} from '../services/salaryService';
import { getEmployees } from '../services/employeeService';
import { getAccounts } from '../services/accountService';

const Salary = ({ onBack }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
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
  const [importResults, setImportResults] = useState(null);

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

  // Export handler
  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setImportResults(null);
      
      // Check if there are salaries to export
      if (salaries.length === 0) {
        setError('No salary records available to export. Please add some salary records first.');
        return;
      }
      
      console.log('Starting export...');
      const result = await exportSalariesToExcel();
      
      setSuccess(result.message || 'Export completed successfully');
      console.log('Export successful:', result);
    } catch (err) {
      console.error('Export failed:', err);
      
      // Handle structured error objects
      const errorMessage = err.errors && err.errors.length > 0
        ? `${err.message}: ${err.errors.join(', ')}`
        : err.message || 'Failed to export salaries';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Import handler
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

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
      const result = await importSalariesFromExcel(file);
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
          setSuccess(`Successfully imported ${result.imported} salary record(s). ${result.skipped > 0 ? `${result.skipped} record(s) were skipped.` : ''}`);
        }
      }
      
      // Refresh the salaries list
      await fetchSalaries();
    } catch (error) {
      console.error('Import error:', error);
      
      // Handle structured error objects
      const errorMessage = error.errors && error.errors.length > 0
        ? `${error.message}: ${error.errors.join(', ')}`
        : error.message || 'Error importing salaries';
      
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
      const result = await downloadSalaryTemplate();
      
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
            Add New Salary
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
                      <th>ID</th>
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
                        <td>{sal.salary_id}</td>
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
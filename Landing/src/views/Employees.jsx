import React, { useState, useEffect, useRef } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  exportEmployeesToExcel,
  importEmployeesFromExcel,
  downloadEmployeeTemplate
} from '../services/employeeService';
import { getStores } from '../services/storeService';

const Employees = ({ onBack }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [viewMode, setViewMode] = useState('table');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    store: '',
    contact: '',
    date_hired: ''
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stores, setStores] = useState([]);
  const [importResults, setImportResults] = useState(null);

  // Fetch employees from backend
  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEmployees();
      // Map backend fields to frontend expected fields
      const mapped = data.map(emp => ({
        ...emp,
        name: emp.name || emp.emp_name || '',
        store: emp.store || emp.emp_store || emp.store_name || '',
        contact: emp.contact || emp.emp_contact || emp.phone || '',
        position: emp.position || emp.emp_position || '',
        date_hired: emp.date_hired || emp.hire_date || '',
        employee_id: emp.employee_id || emp.emp_no || emp._id
      }));
      setEmployees(mapped);
    } catch (err) {
      setError('Error fetching employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // Fetch stores for dropdown
    const fetchStores = async () => {
      try {
        const data = await getStores();
        setStores(data.data || data);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchStores();
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
    setEditingEmployee(null);
    setFormData({ name: '', position: '', store: '', contact: '', date_hired: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingEmployee(null);
    setFormData({ name: '', position: '', store: '', contact: '', date_hired: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      position: emp.position,
      store: emp.store,
      contact: emp.contact,
      date_hired: emp.date_hired ? emp.date_hired.slice(0, 10) : ''
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setLoading(true);
      setError('');
      try {
        await deleteEmployee(id);
        setSuccess('Employee deleted successfully');
        fetchEmployees();
      } catch (err) {
        setError('Error deleting employee');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.name.trim() || !formData.position.trim() || !formData.store.trim() || !formData.contact.trim() || !formData.date_hired) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee._id, {
          ...formData,
          date_hired: new Date(formData.date_hired).toISOString()
        });
        setSuccess('Employee updated successfully');
      } else {
        await createEmployee({
          ...formData,
          date_hired: new Date(formData.date_hired).toISOString()
        });
        setSuccess('Employee added successfully');
      }
      setFormData({ name: '', position: '', store: '', contact: '', date_hired: '' });
      setEditingEmployee(null);
      fetchEmployees();
      setTimeout(() => {
        setViewMode('table');
      }, 1200);
    } catch (err) {
      setError('Error saving employee');
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
      
      // Check if there are employees to export
      if (employees.length === 0) {
        setError('No employees available to export. Please add some employees first.');
        return;
      }
      
      console.log('Starting export...');
      const result = await exportEmployeesToExcel();
      
      setSuccess(result.message || 'Export completed successfully');
      console.log('Export successful:', result);
    } catch (err) {
      console.error('Export failed:', err);
      
      // Handle structured error objects
      const errorMessage = err.errors && err.errors.length > 0
        ? `${err.message}: ${err.errors.join(', ')}`
        : err.message || 'Failed to export employees';
      
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
      const result = await importEmployeesFromExcel(file);
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
          setSuccess(`Successfully imported ${result.imported} employee(s). ${result.skipped > 0 ? `${result.skipped} record(s) were skipped.` : ''}`);
        }
      }
      
      // Refresh the employees list
      await fetchEmployees();
    } catch (error) {
      console.error('Import error:', error);
      
      // Handle structured error objects
      const errorMessage = error.errors && error.errors.length > 0
        ? `${error.message}: ${error.errors.join(', ')}`
        : error.message || 'Error importing employees';
      
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
      const result = await downloadEmployeeTemplate();
      
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

  const filteredEmployees = employees.filter(emp =>
    String(emp?.name || emp?.emp_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(emp?.position || emp?.emp_position || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(emp?.store || emp?.emp_store || emp?.store_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(emp?.contact || emp?.emp_contact || emp?.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.stores}>
      <div className={styles['stores-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Employees</h1>
        <p>Manage employees and their information</p>
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
            Add New Employee
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
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredEmployees.length} employees found
              </div>
            </div>
            {loading ? (
              <div className={styles.loading}>Loading employees...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Store</th>
                      <th>Contact</th>
                      <th>Date Hired</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map(emp => (
                      <tr key={emp._id}>
                        <td>{emp.employee_id || emp.emp_no || emp._id}</td>
                        <td>{emp.name}</td>
                        <td>{emp.position}</td>
                        <td>{emp.store}</td>
                        <td>{emp.contact}</td>
                        <td>{emp.date_hired ? new Date(emp.date_hired).toLocaleDateString() : ''}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button onClick={() => handleEdit(emp)} className={styles['icon-btn']} title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(emp._id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEmployees.length === 0 && !loading && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No employees found matching your search' : 'No employees found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="name">Name</label>
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
                <label htmlFor="position">Position</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  className={styles['form-input']}
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="store">Store</label>
                <select
                  id="store"
                  name="store"
                  className={styles['form-input']}
                  value={formData.store}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map(s => (
                    <option key={s.store_no || s._id} value={s.store_name || s.name}>{s.store_name || s.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="contact">Contact</label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  className={styles['form-input']}
                  value={formData.contact}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="date_hired">Date Hired</label>
                <input
                  type="date"
                  id="date_hired"
                  name="date_hired"
                  className={styles['form-input']}
                  value={formData.date_hired}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" className={styles['cancel-btn']} onClick={handleViewTable}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingEmployee ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;
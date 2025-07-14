import React, { useState } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Employees = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [employees, setEmployees] = useState([
    {
      emp_id: 1,
      name: 'John Doe',
      position: 'Manager',
      store: 'Main Street Store',
      contact: '555-1234',
      date_hired: '2023-05-10T09:00:00Z'
    },
    {
      emp_id: 2,
      name: 'Jane Smith',
      position: 'Cashier',
      store: 'Downtown Branch',
      contact: '555-5678',
      date_hired: '2023-06-15T10:30:00Z'
    }
  ]);
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
      date_hired: emp.date_hired.split('T')[0]
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = (emp_id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees(prev => prev.filter(emp => emp.emp_id !== emp_id));
      setSuccess('Employee deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.name.trim() || !formData.position.trim() || !formData.store.trim() || !formData.contact.trim() || !formData.date_hired) {
      setError('All fields are required');
      return;
    }
    if (editingEmployee) {
      setEmployees(prev => prev.map(emp =>
        emp.emp_id === editingEmployee.emp_id ? { ...emp, ...formData, date_hired: new Date(formData.date_hired).toISOString() } : emp
      ));
      setSuccess('Employee updated successfully');
    } else {
      const newEmp = {
        emp_id: Math.max(...employees.map(e => e.emp_id), 0) + 1,
        ...formData,
        date_hired: new Date(formData.date_hired).toISOString()
      };
      setEmployees(prev => [...prev, newEmp]);
      setSuccess('Employee added successfully');
    }
    setFormData({ name: '', position: '', store: '', contact: '', date_hired: '' });
    setEditingEmployee(null);
    setTimeout(() => setViewMode('table'), 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.store.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.contact.toLowerCase().includes(searchTerm.toLowerCase())
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
          <button className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`} onClick={handleAddNew}>
            <Plus size={20} />
            Add New Employee
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
            <div className={styles['table-wrapper']}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
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
                    <tr key={emp.emp_id}>
                      <td>{emp.emp_id}</td>
                      <td>{emp.name}</td>
                      <td>{emp.position}</td>
                      <td>{emp.store}</td>
                      <td>{emp.contact}</td>
                      <td>{new Date(emp.date_hired).toLocaleDateString()}</td>
                      <td>
                        <div className={styles['action-icons']}>
                          <button onClick={() => handleEdit(emp)} className={styles['icon-btn']} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(emp.emp_id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEmployees.length === 0 && (
                <div className={styles['no-data']}>
                  {searchTerm ? 'No employees found matching your search' : 'No employees found'}
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter employee name"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="position">Position *</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Enter position"
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
                <label htmlFor="contact">Contact *</label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Enter contact number"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="date_hired">Date Hired *</label>
                <input
                  type="date"
                  id="date_hired"
                  name="date_hired"
                  value={formData.date_hired}
                  onChange={handleInputChange}
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
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
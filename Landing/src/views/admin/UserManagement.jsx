import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Edit2, 
  UserCheck, 
  UserX, 
  Trash2, 
  Download, 
  UserPlus,
  ArrowLeft,
  Users,
  User,
  UserCog,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './UserManagement.module.css';

const UserManagement = () => {
  const navigate = useNavigate();
  
  // Handle back navigation
  const handleBack = (e) => {
    e?.preventDefault();
    navigate(-1); // Go back to previous page
  };
  
  // State management
  const [users, setUsers] = useState([]);

  // Fetch users from backend API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token'); // Adjust if you store token elsewhere
        const response = await fetch('/api/protected/admin/users/list', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Map backend _id to id for frontend compatibility
          setUsers(result.data.map(u => ({
            ...u,
            id: u._id,
            status: u.isActive ? 'active' : 'inactive',
            joinDate: u.createdAt ? u.createdAt.split('T')[0] : '',
            lastLogin: u.lastLogin || null
          })));
        } else {
          setUsers([]);
        }
      } catch (err) {
        setUsers([]);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);
  const [viewMode, setViewMode] = React.useState('table');
  
  // Track view mode changes
  React.useEffect(() => {
    console.log('Current view mode:', viewMode);
  }, [viewMode]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    role: 'user',
    status: 'active',
    phone: '',
    department: '',
    password: '' // Only used for create or reset
  });
  const [errors, setErrors] = useState({});

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Handle pagination
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle add new user
  const handleAddUser = (e) => {
    e?.preventDefault();
    setFormData({
      id: '',
      name: '',
      email: '',
      role: 'user',
      status: 'active',
      phone: '',
      department: ''
    });
    setViewMode('form');
  };
  
  const handleViewUsers = (e) => {
    e?.preventDefault();
    setViewMode('table');
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      department: user.department || '',
      password: '' // blank for edit
    });
    setViewMode('form');
  };

  // Handle delete user
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Handle toggle user status
  const handleToggleStatus = async (user) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`/api/protected/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: newStatus === 'active'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update the user in the state
        setUsers(users.map(u => 
          u.id === user.id 
            ? { ...u, status: newStatus, isActive: newStatus === 'active' } 
            : u
        ));
        
        setSuccess(`User "${user.name}" has been ${newStatus} successfully.`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setSuccess(result.message || `Failed to ${newStatus} user`);
      }
    } catch (err) {
      setSuccess(`Failed to ${user.status === 'active' ? 'deactivate' : 'activate'} user`);
    }
    setLoading(false);
  };

  // Confirm delete (API)
  const confirmDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/protected/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setUsers(users.filter(user => user.id !== selectedUser.id));
        setShowDeleteModal(false);
        setSuccess(`User "${selectedUser.name}" has been deleted successfully.`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setSuccess(result.message || 'Failed to delete user');
      }
    } catch (err) {
      setSuccess('Failed to delete user');
    }
    setLoading(false);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission (API)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    const token = localStorage.getItem('token');
    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      isActive: formData.status === 'active',
      phone: formData.phone,
      department: formData.department
    };
    // Only send password if creating or if admin wants to reset
    if (!formData.id && formData.password) payload.password = formData.password;
    if (formData.id && formData.password) payload.password = formData.password;
    try {
      let response, result;
      if (formData.id) {
        // Update user
        response = await fetch(`/api/protected/admin/users/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        result = await response.json();
        if (result.success) {
          setUsers(users.map(user => user.id === formData.id ? {
            ...user,
            ...result.data,
            id: result.data._id || user.id,
            status: result.data.isActive ? 'active' : 'inactive',
            joinDate: result.data.createdAt ? result.data.createdAt.split('T')[0] : user.joinDate
          } : user));
          setSuccess('User updated successfully');
        } else {
          setSuccess(result.message || 'Failed to update user');
        }
      } else {
        // Create user
        if (!formData.password) {
          setErrors(prev => ({ ...prev, password: 'Password is required' }));
          setLoading(false);
          return;
        }
        payload.password = formData.password;
        response = await fetch('/api/protected/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        result = await response.json();
        if (result.success) {
          const newUser = {
            ...result.data,
            id: result.data._id,
            status: result.data.isActive ? 'active' : 'inactive',
            joinDate: result.data.createdAt ? result.data.createdAt.split('T')[0] : '',
            lastLogin: result.data.lastLogin || null
          };
          setUsers([newUser, ...users]);
          setSuccess('User created successfully');
        } else {
          setSuccess(result.message || 'Failed to create user');
        }
      }
      setViewMode('table');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setSuccess('Failed to save user');
    }
    setLoading(false);
  };

  // Handle cancel form
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      setViewMode('table');
      setErrors({});
    }
  };

  // Format date with time
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate page numbers for pagination
  const pageNumbers = [];
  const maxPagesToShow = 5;
  
  if (totalPages <= maxPagesToShow) {
    // Show all pages if total pages are less than or equal to maxPagesToShow
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Always show first page
    pageNumbers.push(1);
    
    // Show ellipsis if current page is not within the first 3 pages
    if (currentPage > 3) {
      pageNumbers.push('...');
    }
    
    // Show current page and adjacent pages
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) {
        pageNumbers.push(i);
      }
    }
    
    // Show ellipsis if current page is not within the last 3 pages
    if (currentPage < totalPages - 2) {
      pageNumbers.push('...');
    }
    
    // Always show last page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
  }

  console.log('Rendering with viewMode:', viewMode);
  
  // Add global button styles to your main CSS file instead
  React.useEffect(() => {
    // Add global styles for buttons
    const style = document.createElement('style');
    style.textContent = `
      button {
        cursor: pointer;
      }
      button:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className={styles.container} style={{ position: 'relative', zIndex: 1 }}>
      {/* Debug overlay */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        zIndex: 9999,
        fontSize: '12px',
        pointerEvents: 'none'
      }}>
        Current View: {viewMode}
      </div>
      {/* Header */}
      <div className={styles.header}>
        <button 
          onClick={handleBack}
          className={styles.backButton}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className={styles.headerCenter}>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>Manage your users and their permissions</p>
        </div>
        <div style={{
        display: 'flex',
        gap: '1rem',
        zIndex: 1000,
        position: 'relative'
      }}>
        {/* View Users Button */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden',
          background: viewMode === 'table' ? '#4f46e5' : 'white'
        }}>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('View Users clicked');
              setViewMode('table');
            }}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              color: viewMode === 'table' ? 'white' : '#1e293b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            <User size={18} />
            View Users
          </button>
        </div>

        {/* Add User Button - Only show in table view */}
        {viewMode === 'table' && (
          <div style={{
            border: '1px solid #4f46e5',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#4f46e5'
          }}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add User clicked');
                setFormData({
                  id: '',
                  name: '',
                  email: '',
                  role: 'user',
                  status: 'active',
                  phone: '',
                  department: ''
                });
                setViewMode('form');
              }}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              <UserPlus size={18} />
              Add User
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className={styles.successMessage}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {viewMode === 'form' ? (
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2>{formData.id ? 'Edit User' : 'Add New User'}</h2>
            <p className={styles.formSubtitle}>
              {formData.id 
                ? 'Update the user details below.' 
                : 'Fill in the form below to create a new user account.'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Basic Information</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.formLabel}>
                    Full Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${errors.name ? styles.error : ''}`}
                    placeholder="John Doe"
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    Email Address <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${errors.email ? styles.error : ''}`}
                    placeholder="john@example.com"
                  />
                  {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                </div>
              </div>

              {/* Password field for create or reset */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.formLabel}>
                    {formData.id ? 'Reset Password' : 'Password'}{!formData.id && <span className={styles.required}>*</span>}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${errors.password ? styles.error : ''}`}
                    placeholder={formData.id ? 'Leave blank to keep current password' : 'Enter password'}
                  />
                  {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                  {formData.id && <span className={styles.helperText}>Leave blank to keep the current password.</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.formLabel}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="department" className={styles.formLabel}>
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    placeholder="e.g., Engineering, Marketing"
                  />
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Account Settings</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="role" className={styles.formLabel}>
                    User Role <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`${styles.formSelect} ${errors.role ? styles.error : ''}`}
                  >
                    <option value="">Select a role</option>
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                  {errors.role && <span className={styles.errorText}>{errors.role}</span>}
                  <p className={styles.helperText}>
                    {formData.role === 'admin' 
                      ? 'Administrators have full access to all features.'
                      : formData.role === 'manager'
                      ? 'Managers can manage users but have limited administrative access.'
                      : formData.role === 'user'
                      ? 'Standard users have basic access to the system.'
                      : 'Select the appropriate role for this user.'}
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="status" className={styles.formLabel}>
                    Account Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={styles.formSelect}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <p className={styles.helperText}>
                    {formData.status === 'active'
                      ? 'Active users can sign in and use the system.'
                      : 'Inactive users cannot sign in.'}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelBtn}
                disabled={loading}
              >
                <X size={16} />
                Cancel
              </button>
              <button
                type="submit"
                className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className={styles.spinner} size={16} />
                    {formData.id ? 'Saving Changes...' : 'Creating User...'}
                  </>
                ) : (
                  <>
                    <Save size={16} className={styles.buttonIcon} />
                    {formData.id ? 'Update User' : 'Create User'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.tableFilters}>
            <div className={styles.filtersContainer}>
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                  aria-label="Search users"
                />
              </div>
              
              <div className={styles.filtersGroup}>
                <div className={styles.filterField}>
                  <Filter size={14} className={styles.filterIcon} />
                  <select 
                    value={selectedRole} 
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className={styles.filterSelect}
                    aria-label="Filter by role"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                </div>
                
                <div className={styles.filterField}>
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={styles.filterSelect}
                    aria-label="Filter by status"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className={styles.tableInfo}>
              <span className={styles.infoCount}>{filteredUsers.length}</span>
              <span>{filteredUsers.length === 1 ? ' user' : ' users'} found</span>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>USER</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>LAST LOGIN</th>
                  <th>JOINED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatar}>
                            {user.avatar || user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.userName}>{user.name}</div>
                            <div className={styles.userEmail}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[user.role]}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.status} ${styles[user.status]}`}>
                          <span className={styles.statusIndicator}></span>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td>{formatDate(user.lastLogin)}</td>
                      <td>{new Date(user.joinDate).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            className={`${styles.actionButton} ${styles.editButton}`}
                            aria-label={`Edit ${user.name}`}
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className={`${styles.actionButton} ${user.status === 'active' ? styles.deactivateButton : styles.activateButton}`}
                            aria-label={`Set ${user.name} as ${user.status === 'active' ? 'inactive' : 'active'}`}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            aria-label={`Delete ${user.name}`}
                            onClick={() => handleDeleteClick(user)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.noResults}>
                      <div className={styles.noResultsContent}>
                        <User size={40} className={styles.noResultsIcon} />
                        <h3>No users found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className={styles.pageButton}
                aria-label="First page"
              >
                «
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.pageButton}
                aria-label="Previous page"
              >
                ‹
              </button>
              
              {pageNumbers.map((number, index) => (
                <button
                  key={index}
                  onClick={() => typeof number === 'number' && paginate(number)}
                  className={`${styles.pageButton} ${currentPage === number ? styles.active : ''}`}
                  disabled={number === '...'}
                  aria-label={number === '...' ? 'More pages' : `Page ${number}`}
                  aria-current={currentPage === number ? 'page' : undefined}
                >
                  {number}
                </button>
              ))}
              
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
                aria-label="Next page"
              >
                ›
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
                aria-label="Last page"
              >
                »
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Delete User</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className={styles.closeButton}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalIcon}>
                <Trash2 size={48} className={styles.dangerIcon} />
              </div>
              <h4>Delete User Account</h4>
              <p>Are you sure you want to delete the account for <strong>{selectedUser.name}</strong>? This action cannot be undone and all user data will be permanently removed.</p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className={`${styles.button} ${styles.secondaryButton}`}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className={`${styles.button} ${styles.dangerButton}`}
              >
                <Trash2 size={16} />
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

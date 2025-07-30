import React, { useState } from 'react';
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
  UserCog
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './UserManagement.module.css';

const UserManagement = ({ onBack }) => {
  const navigate = useNavigate();
  // Mock data - replace with real API calls
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2023-06-15T10:30:00Z',
      joinDate: '2023-01-15',
      avatar: 'JD'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'manager',
      status: 'active',
      lastLogin: '2023-06-14T15:45:00Z',
      joinDate: '2023-02-20',
      avatar: 'JS'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'user',
      status: 'inactive',
      lastLogin: '2023-06-10T09:15:00Z',
      joinDate: '2023-03-05',
      avatar: 'BJ'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  // Filter users based on search and filters
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

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    // In a real app, this would be an API call
    setUsers(users.filter(user => user.id !== selectedUser.id));
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const toggleUserStatus = (userId) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        // Show a confirmation for deactivating users
        if (user.status === 'active' && !window.confirm(`Are you sure you want to deactivate ${user.name}?`)) {
          return user; // Return unchanged user if cancelled
        }
        return { 
          ...user, 
          status: newStatus,
          lastLogin: newStatus === 'active' ? new Date().toISOString() : user.lastLogin
        };
      }
      return user;
    }));
  };

  // Handle back navigation
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Handle add new user
  const handleAddUser = () => {
    // Add your add user logic here
    console.log('Add new user clicked');
  };

  // Handle edit user
  const handleEditUser = (userId) => {
    // Add your edit user logic here
    console.log('Edit user:', userId);
  };

  // Format date with time
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    // If within the last 7 days, show relative time
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    
    // Otherwise show the date
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(undefined, options);
  };

  // Handle pagination
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of table on page change
    const tableElement = document.querySelector(`.${styles.tableWrapper}`);
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate page numbers for pagination
  const pageNumbers = [];
  const maxPagesToShow = 5;
  
  if (totalPages <= maxPagesToShow) {
    // Show all pages if there are 5 or fewer
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
    
    // Calculate start and end pages to show around current page
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust if we're near the start or end
    if (currentPage <= 3) {
      endPage = 4;
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
    }
    
    // Add the page numbers around current page
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

  return (
    <div className={styles.userManagement}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBackClick}>
          <ArrowLeft size={16} />
          Back
        </button>
        <h1>User Management</h1>
        <p>Manage your system users and their permissions</p>
      </div>
      
      <div className={styles.headerActions}>
        <button className={styles.secondaryButton}>
          <Download size={16} />
          Export
        </button>
        <button className={styles.primaryButton} onClick={handleAddUser}>
          <UserPlus size={16} />
          Add New User
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={20} />
          </div>
          <div className={styles.statValue}>{users.length}</div>
          <div className={styles.statLabel}>Total Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <UserCheck size={20} />
          </div>
          <div className={styles.statValue}>
            {users.filter(u => u.status === 'active').length}
          </div>
          <div className={styles.statLabel}>Active Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <UserCog size={20} />
          </div>
          <div className={styles.statValue}>
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className={styles.statLabel}>Administrators</div>
        </div>
      </div>

      {/* Table Container */}
      <div className={styles.tableContainer}>
        {/* Table Header with Search and Filters */}
        <div className={styles.tableHeader}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              aria-label="Search users"
            />
          </div>
          
          <div className={styles.tableActions}>
            <div className={styles.filterGroup}>
              <Filter size={16} className={styles.filterIcon} />
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
            
            <div className={styles.filterGroup}>
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
            
            <div className={styles.tableInfo}>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </div>
          </div>
        </div>

        {/* Table Wrapper */}
        <div className={styles.tableWrapper}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>USER</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>LAST LOGIN</th>
                <th>JOIN DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                      <span className={styles.statusDot}></span>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td>{formatDate(user.lastLogin)}</td>
                  <td>{formatDate(user.joinDate)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        onClick={() => toggleUserStatus(user.id)}
                        className={`${styles.actionButton} ${user.status === 'active' ? styles.warningButton : styles.successButton}`}
                        aria-label={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button 
                        onClick={() => handleEditUser(user.id)}
                        className={`${styles.actionButton} ${styles.editButton}`}
                        aria-label="Edit user"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        aria-label="Delete user"
                        title="Delete"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing <span>{Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length)}</span> to{' '}
            <span>{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span> of{' '}
            <span>{filteredUsers.length}</span> users
          </div>
          
          <div className={styles.paginationControls}>
            <button 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
              className={`${styles.paginationButton} ${styles.paginationNav}`}
              aria-label="Previous page"
            >
              <ArrowLeft size={16} />
              Previous
            </button>
            
            <div className={styles.pageNumbers}>
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`${styles.pageNumber} ${currentPage === number ? styles.active : ''}`}
                  aria-label={`Page ${number}`}
                  aria-current={currentPage === number ? 'page' : undefined}
                >
                  {number}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className={`${styles.paginationButton} ${styles.paginationNav}`}
              aria-label="Next page"
            >
              Next
              <ArrowLeft size={16} className={styles.nextIcon} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Confirm Deletion</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className={styles.closeButton}
                aria-label="Close"
              >
                &times;
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
                onClick={() => {
                  // In a real app, you would make an API call here
                  console.log('Deleting user:', selectedUser.id);
                  
                  // Simulate API call with timeout
                  setTimeout(() => {
                    setUsers(users.filter(user => user.id !== selectedUser.id));
                    setShowDeleteModal(false);
                    
                    // Show success message (you might want to use a toast notification in a real app)
                    alert(`User "${selectedUser.name}" has been deleted successfully.`);
                  }, 500);
                }}
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
    </div>
  );
};

export default UserManagement;

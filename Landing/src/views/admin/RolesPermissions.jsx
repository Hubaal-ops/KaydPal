import React, { useState } from 'react';
import styles from './RolesPermissions.module.css';
import { Plus, Edit, Trash2, Save, X, Check, Users, Lock, Eye, Settings, UserPlus, FileText, BarChart2, Mail, Bell, Shield } from 'lucide-react';

const RolesPermissions = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [editingRole, setEditingRole] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);

  // Sample roles data
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: 'Administrator',
      key: 'admin',
      description: 'Full access to all features and settings',
      permissions: {
        userManagement: ['read', 'create', 'update', 'delete'],
        content: ['read', 'create', 'update', 'delete', 'publish'],
        settings: ['read', 'update'],
        analytics: ['read'],
        notifications: ['read', 'create', 'update', 'delete'],
        roles: ['read', 'create', 'update', 'delete']
      },
      userCount: 3
    },
    {
      id: 2,
      name: 'Editor',
      key: 'editor',
      description: 'Can create and edit content but cannot manage users',
      permissions: {
        userManagement: ['read'],
        content: ['read', 'create', 'update'],
        settings: [],
        analytics: ['read'],
        notifications: ['read'],
        roles: []
      },
      userCount: 12
    },
    {
      id: 3,
      name: 'Viewer',
      key: 'viewer',
      description: 'Can only view content and analytics',
      permissions: {
        userManagement: [],
        content: ['read'],
        settings: [],
        analytics: ['read'],
        notifications: [],
        roles: []
      },
      userCount: 45
    }
  ]);

  // All available permissions
  const allPermissions = {
    userManagement: 'Manage Users',
    content: 'Content Management',
    settings: 'System Settings',
    analytics: 'View Analytics',
    notifications: 'Manage Notifications',
    roles: 'Manage Roles & Permissions'
  };

  // Permission levels
  const permissionLevels = [
    { key: 'read', label: 'View' },
    { key: 'create', label: 'Create' },
    { key: 'update', label: 'Edit' },
    { key: 'delete', label: 'Delete' },
    { key: 'publish', label: 'Publish' }
  ];

  const handlePermissionChange = (roleId, permission, level, checked) => {
    setRoles(prevRoles => 
      prevRoles.map(role => {
        if (role.id === roleId) {
          const newPermissions = { ...role.permissions };
          
          if (checked) {
            // Add permission
            newPermissions[permission] = [...(newPermissions[permission] || []), level];
          } else {
            // Remove permission
            newPermissions[permission] = newPermissions[permission].filter(p => p !== level);
          }
          
          return { ...role, permissions: newPermissions };
        }
        return role;
      })
    );
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    
    const newRole = {
      id: Date.now(),
      name: newRoleName,
      key: newRoleName.toLowerCase().replace(/\s+/g, '-'),
      description: '',
      permissions: {},
      userCount: 0
    };
    
    setRoles([...roles, newRole]);
    setNewRoleName('');
    setShowAddRole(false);
    setEditingRole(newRole.id);
  };

  const handleDeleteRole = (roleId) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      setRoles(roles.filter(role => role.id !== roleId));
    }
  };

  const getPermissionIcon = (permission) => {
    const icons = {
      userManagement: <Users size={16} />,
      content: <FileText size={16} />,
      settings: <Settings size={16} />,
      analytics: <BarChart2 size={16} />,
      notifications: <Bell size={16} />,
      roles: <Shield size={16} />
    };
    return icons[permission] || <Lock size={16} />;
  };

  const renderRoleBadge = (roleKey) => {
    const classes = {
      admin: styles.admin,
      editor: styles.editor,
      viewer: styles.viewer
    };
    
    return (
      <span className={`${styles.roleBadge} ${classes[roleKey] || ''}`}>
        {roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}
      </span>
    );
  };

  return (
    <div className={styles.rolesContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Roles & Permissions</h1>
        <p className={styles.description}>
          Manage user roles and their permissions to control access to different features and resources.
        </p>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'roles' ? styles.active : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Users size={18} style={{ marginRight: '8px' }} />
          Roles
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'permissions' ? styles.active : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <Lock size={18} style={{ marginRight: '8px' }} />
          Permissions
        </button>
      </div>

      {activeTab === 'roles' && (
        <div className={styles.rolesGrid}>
          {roles.map(role => (
            <div key={role.id} className={styles.roleCard}>
              <div className={styles.roleHeader}>
                {editingRole === role.id ? (
                  <input
                    type="text"
                    value={role.name}
                    onChange={(e) => {
                      const updatedRoles = roles.map(r => 
                        r.id === role.id ? { ...r, name: e.target.value } : r
                      );
                      setRoles(updatedRoles);
                    }}
                    className={styles.roleInput}
                    autoFocus
                  />
                ) : (
                  <h3 className={styles.roleTitle}>
                    {role.name}
                    {renderRoleBadge(role.key)}
                  </h3>
                )}
                <div className={styles.roleUserCount}>
                  <Users size={14} style={{ marginRight: '4px' }} />
                  {role.userCount} users
                </div>
              </div>
              
              {editingRole === role.id ? (
                <input
                  type="text"
                  value={role.description}
                  onChange={(e) => {
                    const updatedRoles = roles.map(r => 
                      r.id === role.id ? { ...r, description: e.target.value } : r
                    );
                    setRoles(updatedRoles);
                  }}
                  className={styles.roleDescriptionInput}
                  placeholder="Role description"
                />
              ) : (
                <p className={styles.roleDescription}>{role.description}</p>
              )}
              
              <div className={styles.permissionsList}>
                <h4 className={styles.permissionsTitle}>Permissions</h4>
                {Object.entries(allPermissions).map(([key, label]) => (
                  <div key={key} className={styles.permissionItem}>
                    <div className={styles.permissionIcon}>
                      {getPermissionIcon(key)}
                    </div>
                    <span className={styles.permissionLabel}>
                      {label}
                    </span>
                    <div className={styles.permissionLevels}>
                      {permissionLevels.map(level => (
                        <label key={level.key} className={styles.permissionLevel}>
                          <input
                            type="checkbox"
                            checked={role.permissions[key]?.includes(level.key) || false}
                            onChange={(e) => handlePermissionChange(role.id, key, level.key, e.target.checked)}
                            disabled={editingRole !== role.id}
                          />
                          <span>{level.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.roleActions}>
                {editingRole === role.id ? (
                  <>
                    <button 
                      className={`${styles.button} ${styles.primaryButton}`}
                      onClick={() => setEditingRole(null)}
                    >
                      <Save size={16} style={{ marginRight: '4px' }} />
                      Save
                    </button>
                    <button 
                      className={`${styles.button} ${styles.secondaryButton}`}
                      onClick={() => setEditingRole(null)}
                    >
                      <X size={16} style={{ marginRight: '4px' }} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className={`${styles.button} ${styles.secondaryButton}`}
                      onClick={() => setEditingRole(role.id)}
                    >
                      <Edit size={16} style={{ marginRight: '4px' }} />
                      Edit
                    </button>
                    {role.key !== 'admin' && (
                      <button 
                        className={`${styles.button} ${styles.dangerButton}`}
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 size={16} style={{ marginRight: '4px' }} />
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          
          {showAddRole ? (
            <div className={styles.roleCard}>
              <h3 className={styles.roleTitle}>New Role</h3>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className={styles.roleInput}
                placeholder="Role name"
                autoFocus
              />
              <div className={styles.roleActions}>
                <button 
                  className={`${styles.button} ${styles.primaryButton}`}
                  onClick={handleAddRole}
                  disabled={!newRoleName.trim()}
                >
                  <Plus size={16} style={{ marginRight: '4px' }} />
                  Create Role
                </button>
                <button 
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={() => setShowAddRole(false)}
                >
                  <X size={16} style={{ marginRight: '4px' }} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              className={styles.addRoleButton}
              onClick={() => setShowAddRole(true)}
            >
              <Plus size={20} style={{ marginRight: '8px' }} />
              Add New Role
            </button>
          )}
        </div>
      )}
      
      {activeTab === 'permissions' && (
        <div className={styles.permissionsTable}>
          <h2>Advanced Permissions</h2>
          <p>Manage detailed permission settings for each role.</p>
          {/* Permissions matrix would go here */}
          <div className={styles.placeholder}>
            <Lock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Advanced permissions management coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
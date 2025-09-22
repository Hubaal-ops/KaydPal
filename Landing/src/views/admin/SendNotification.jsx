import React, { useState, useEffect } from 'react';
import { sendGlobalNotification, sendUserNotification, sendRoleNotification, getUsersForNotifications } from '../../services/adminNotificationService';
import './SendNotification.css';

const SendNotification = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'info',
    category: 'general',
    target: 'global', // global, users, roles
    selectedUsers: [],
    selectedRoles: ['user', 'admin']
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsersForNotifications();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      showMessage('error', 'Failed to fetch users');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'selectedUsers') {
        setFormData(prev => {
          const selected = [...prev.selectedUsers];
          if (checked) {
            selected.push(value);
          } else {
            const index = selected.indexOf(value);
            if (index > -1) selected.splice(index, 1);
          }
          return { ...prev, selectedUsers: selected };
        });
      } else if (name === 'selectedRoles') {
        setFormData(prev => {
          const selected = [...prev.selectedRoles];
          if (checked) {
            selected.push(value);
          } else {
            const index = selected.indexOf(value);
            if (index > -1) selected.splice(index, 1);
          }
          return { ...prev, selectedRoles: selected };
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const notificationData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category
      };

      let result;
      switch (formData.target) {
        case 'global':
          result = await sendGlobalNotification(notificationData);
          break;
        case 'users':
          if (formData.selectedUsers.length === 0) {
            throw new Error('Please select at least one user');
          }
          result = await sendUserNotification({
            ...notificationData,
            userIds: formData.selectedUsers
          });
          break;
        case 'roles':
          if (formData.selectedRoles.length === 0) {
            throw new Error('Please select at least one role');
          }
          result = await sendRoleNotification({
            ...notificationData,
            roles: formData.selectedRoles
          });
          break;
        default:
          throw new Error('Invalid target selection');
      }

      if (result.success) {
        showMessage('success', result.message || 'Notification sent successfully');
        // Reset form
        setFormData({
          title: '',
          description: '',
          type: 'info',
          category: 'general',
          target: 'global',
          selectedUsers: [],
          selectedRoles: ['user', 'admin']
        });
      } else {
        throw new Error(result.message || 'Failed to send notification');
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const userRoles = [...new Set(users.map(user => user.role))];

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1>Send Notifications</h1>
        <p>Send notifications to users in your SaaS platform</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter notification title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Enter notification description"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., system, update, alert"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Target Audience *</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="target"
                  value="global"
                  checked={formData.target === 'global'}
                  onChange={handleChange}
                />
                All Users
              </label>
              <label>
                <input
                  type="radio"
                  name="target"
                  value="users"
                  checked={formData.target === 'users'}
                  onChange={handleChange}
                />
                Specific Users
              </label>
              <label>
                <input
                  type="radio"
                  name="target"
                  value="roles"
                  checked={formData.target === 'roles'}
                  onChange={handleChange}
                />
                By Role
              </label>
            </div>
          </div>

          {formData.target === 'users' && (
            <div className="form-group">
              <label>Select Users</label>
              <div className="checkbox-group">
                {users.map(user => (
                  <label key={user._id} className="checkbox-item">
                    <input
                      type="checkbox"
                      name="selectedUsers"
                      value={user._id}
                      checked={formData.selectedUsers.includes(user._id)}
                      onChange={handleChange}
                    />
                    <span className="checkbox-label">
                      {user.username} ({user.email}) - {user.role}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.target === 'roles' && (
            <div className="form-group">
              <label>Select Roles</label>
              <div className="checkbox-group">
                {userRoles.map(role => (
                  <label key={role} className="checkbox-item">
                    <input
                      type="checkbox"
                      name="selectedRoles"
                      value={role}
                      checked={formData.selectedRoles.includes(role)}
                      onChange={handleChange}
                    />
                    <span className="checkbox-label">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendNotification;
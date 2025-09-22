import React, { useState, useEffect } from 'react';
import { 
  Bell, Check, Trash2, Filter, Search, X, 
  AlertCircle, CheckCircle, AlertTriangle, Info, Clock, Settings, Mail, User, CreditCard, Send
} from 'lucide-react';
import styles from './Notifications.module.css';
import SendNotification from './SendNotification';

const iconMap = {
  info: <Info size={20} />, success: <CheckCircle size={20} />, warning: <AlertTriangle size={20} />, error: <AlertCircle size={20} />,
  users: <User size={20} />, payments: <CreditCard size={20} />, system: <Settings size={20} />, security: <AlertCircle size={20} />, messages: <Mail size={20} />
};

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'send'
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewActiveTab, setViewActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Load notifications from backend
  useEffect(() => {
    if (activeTab === 'view') {
      const fetchNotifications = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/protected/admin/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setNotifications(data.data.map(n => ({
              ...n,
              icon: iconMap[n.category] || iconMap[n.type] || <Info size={20} />,
              timestamp: n.timestamp || n.createdAt
            })));
          }
        } catch (e) {
          // fallback: show nothing
        }
        setLoading(false);
      };
      fetchNotifications();
    }
  }, [activeTab]);

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      viewActiveTab === 'all' || 
      (viewActiveTab === 'unread' && !notification.read) ||
      (viewActiveTab === 'read' && notification.read);
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      notification.category === selectedCategory;
    
    const matchesType = 
      selectedType === 'all' || 
      notification.type === selectedType;
    
    return matchesSearch && matchesTab && matchesCategory && matchesType;
  });

  // Get unique categories for filter
  const getCategories = () => {
    const categories = new Set();
    notifications.forEach(notification => categories.add(notification.category));
    return Array.from(categories);
  };

  // Mark notification as read (API)
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/protected/admin/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  // Mark all as read (API)
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/protected/admin/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch {}
  };

  // Delete notification (API)
  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/protected/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n._id !== id));
    } catch {}
  };

  // Clear all notifications (API)
  const clearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/protected/admin/notifications/clear-all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications([]);
    } catch {}
  };

  // Get notification type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} />;
      case 'error': return <AlertCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      default: return <Info size={16} />;
    }
  };

  // Format date
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    
    return 'Just now';
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={styles.notifications}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.description}>
            {activeTab === 'view' && (
              unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'You have no unread notifications'
            )}
            {activeTab === 'send' && (
              'Send notifications to users in your SaaS platform'
            )}
          </p>
        </div>
        {activeTab === 'view' && (
          <div className={styles.headerActions}>
            <button 
              className={styles.secondaryButton}
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check size={16} />
              <span>Mark all as read</span>
            </button>
            <button 
              className={`${styles.secondaryButton} ${styles.danger}`}
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 size={16} />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          <Bell size={16} />
          <span>View Notifications</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          <Send size={16} />
          <span>Send Notifications</span>
        </button>
      </div>

      {activeTab === 'view' ? (
        <>
          {/* View Notifications Content */}
          {/* Tabs */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${viewActiveTab === 'all' ? 'active' : ''}`}
              onClick={() => setViewActiveTab('all')}
            >
              All
              {notifications.length > 0 && (
                <span className={styles.tabBadge}>{notifications.length}</span>
              )}
            </button>
            <button 
              className={`${styles.tab} ${viewActiveTab === 'unread' ? 'active' : ''}`}
              onClick={() => setViewActiveTab('unread')}
            >
              Unread
              {unreadCount > 0 && (
                <span className={styles.tabBadge}>{unreadCount}</span>
              )}
            </button>
            <button 
              className={`${styles.tab} ${viewActiveTab === 'read' ? 'active' : ''}`}
              onClick={() => setViewActiveTab('read')}
            >
              Read
              <span className={styles.tabBadge}>
                {notifications.filter(n => n.read).length}
              </span>
            </button>
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.searchContainer}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search notifications..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button 
              className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              <span>Filters</span>
              {showFilters ? <X size={16} /> : null}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className={styles.advancedFilters}>
              <div className={styles.filterGroup}>
                <label>Category</label>
                <select 
                  className={styles.filterSelect}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {getCategories().map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Type</label>
                <select 
                  className={styles.filterSelect}
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="info">Information</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className={styles.notificationsList}>
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.loadingSpinner}></div>
                <span>Loading notifications...</span>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <div 
                  key={notification._id || notification.id} 
                  className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                >
                  <div className={`${styles.notificationIcon} ${styles[notification.type]}`}>
                    {notification.icon || getTypeIcon(notification.type)}
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>
                      <span style={{ fontWeight: 600 }}>{notification.title}</span>
                      <span className={styles.notificationTime}>
                        <Clock size={14} style={{ marginRight: '4px' }} />
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                    </div>
                    <p className={styles.notificationDescription}>
                      {notification.description}
                    </p>
                    <div className={styles.notificationActions}>
                      {!notification.read && (
                        <button 
                          className={styles.actionButton}
                          onClick={() => markAsRead(notification._id)}
                        >
                          <Check size={14} />
                          <span>Mark as read</span>
                        </button>
                      )}
                      <button 
                        className={`${styles.actionButton} ${styles.danger}`}
                        onClick={() => deleteNotification(notification._id)}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <Bell size={32} />
                </div>
                <h3 className={styles.emptyStateTitle}>No notifications found</h3>
                <p className={styles.emptyStateDescription}>
                  {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'All caught up! You have no notifications at this time.'}
                </p>
                {(searchTerm || selectedCategory !== 'all' || selectedType !== 'all') && (
                  <button 
                    className={styles.primaryButton}
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedType('all');
                    }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Send Notifications Content */
        <SendNotification />
      )}
    </div>
  );
};

export default Notifications;
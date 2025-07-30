import React, { useState, useEffect } from 'react';
import { 
  Bell, Check, Trash2, Filter, Search, X, 
  AlertCircle, CheckCircle, AlertTriangle, Info, Clock, Settings, Mail, User, CreditCard
} from 'lucide-react';
import styles from './Notifications.module.css';

// Mock data for notifications
const mockNotifications = [
  {
    id: 1,
    title: 'New user registered',
    description: 'John Doe has created a new account with the email john@example.com',
    type: 'info',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    icon: <User size={20} />,
    category: 'users'
  },
  {
    id: 2,
    title: 'Payment received',
    description: 'Payment of $99.99 has been successfully processed for order #12345',
    type: 'success',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    icon: <CreditCard size={20} />,
    category: 'payments'
  },
  {
    id: 3,
    title: 'System update available',
    description: 'A new system update (v2.1.0) is available for installation',
    type: 'warning',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    icon: <Settings size={20} />,
    category: 'system'
  },
  {
    id: 4,
    title: 'Failed login attempt',
    description: 'There was a failed login attempt for admin@example.com from 192.168.1.100',
    type: 'error',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    icon: <AlertCircle size={20} />,
    category: 'security'
  },
  {
    id: 5,
    title: 'New message received',
    description: 'You have a new message from Sarah in the support channel',
    type: 'info',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    icon: <Mail size={20} />,
    category: 'messages'
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Load notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'unread' && !notification.read) ||
      (activeTab === 'read' && notification.read);
    
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

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })));
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
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
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'You have no unread notifications'}
          </p>
        </div>
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
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
          {notifications.length > 0 && (
            <span className={styles.tabBadge}>{notifications.length}</span>
          )}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Unread
          {unreadCount > 0 && (
            <span className={styles.tabBadge}>{unreadCount}</span>
          )}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'read' ? 'active' : ''}`}
          onClick={() => setActiveTab('read')}
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
              key={notification.id} 
              className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
            >
              <div className={`${styles.notificationIcon} ${styles[notification.type]}`}>
                {notification.icon || getTypeIcon(notification.type)}
              </div>
              <div className={styles.notificationContent}>
                <div className={styles.notificationTitle}>
                  <span>{notification.title}</span>
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
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check size={14} />
                      <span>Mark as read</span>
                    </button>
                  )}
                  <button 
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={() => deleteNotification(notification.id)}
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
    </div>
  );
};

export default Notifications;
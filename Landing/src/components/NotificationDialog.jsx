import React, { useState, useEffect } from 'react';
import { X, Bell, Check, Trash2, Clock, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { getUserNotifications, markNotificationAsRead, deleteNotification, markAllAsRead, clearAllNotifications } from '../services/notificationService';
import './NotificationDialog.css';

const iconMap = {
  info: <Info size={20} />,
  success: <CheckCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  error: <AlertCircle size={20} />
};

const NotificationDialog = ({ isOpen, onClose, onNotificationCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Load notifications from backend
  const fetchNotifications = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const data = await getUserNotifications();
      if (data.success) {
        setNotifications(data.data.map(n => ({
          ...n,
          icon: iconMap[n.type] || <Info size={20} />,
          timestamp: n.timestamp || n.createdAt
        })));
        
        // Update notification count in parent component
        if (onNotificationCountChange) {
          const unreadCount = data.data.filter(n => !n.read).length;
          onNotificationCountChange(unreadCount);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isOpen]);

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'read') return notification.read;
    return true;
  });

  // Mark notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
      
      // Update notification count
      const unreadCount = notifications.filter(n => n._id !== id && !n.read).length;
      if (onNotificationCountChange) {
        onNotificationCountChange(unreadCount);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n._id !== id));
      
      // Update notification count
      const wasUnread = notifications.find(n => n._id === id)?.read === false;
      if (wasUnread && onNotificationCountChange) {
        const unreadCount = notifications.filter(n => n._id !== id && !n.read).length;
        onNotificationCountChange(unreadCount);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      
      // Update notification count
      if (onNotificationCountChange) {
        onNotificationCountChange(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        await clearAllNotifications();
        setNotifications([]);
        
        // Update notification count
        if (onNotificationCountChange) {
          onNotificationCountChange(0);
        }
      } catch (err) {
        console.error('Error clearing notifications:', err);
      }
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

  if (!isOpen) return null;

  return (
    <div className="notification-dialog-overlay" onClick={onClose}>
      <div className="notification-dialog" onClick={e => e.stopPropagation()}>
        <div className="notification-dialog-header">
          <div className="notification-dialog-title">
            <Bell size={20} />
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
          <button className="notification-dialog-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="notification-dialog-actions">
          <div className="notification-tabs">
            <button 
              className={`notification-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              className={`notification-tab ${activeTab === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread
            </button>
            <button 
              className={`notification-tab ${activeTab === 'read' ? 'active' : ''}`}
              onClick={() => setActiveTab('read')}
            >
              Read
            </button>
          </div>
          
          <div className="notification-dialog-buttons">
            {unreadCount > 0 && (
              <button 
                className="notification-action-button"
                onClick={handleMarkAllAsRead}
              >
                <Check size={16} />
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button 
                className="notification-action-button danger"
                onClick={handleClearAll}
              >
                <Trash2 size={16} />
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="notification-dialog-content">
          {loading ? (
            <div className="notification-loading">
              <div className="notification-spinner"></div>
              <span>Loading notifications...</span>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="notification-list">
              {filteredNotifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                >
                  <div className={`notification-icon ${notification.type}`}>
                    {notification.icon}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <p className="notification-description">
                      {notification.description}
                    </p>
                    <div className="notification-meta">
                      <span className="notification-time">
                        <Clock size={14} />
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <button 
                          className="notification-mark-read"
                          onClick={() => handleMarkAsRead(notification._id)}
                        >
                          <Check size={14} />
                          Mark as read
                        </button>
                      )}
                      <button 
                        className="notification-delete"
                        onClick={() => handleDelete(notification._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="notification-empty">
              <Bell size={48} />
              <h3>No notifications</h3>
              <p>You have no {activeTab !== 'all' ? activeTab : ''} notifications at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDialog;
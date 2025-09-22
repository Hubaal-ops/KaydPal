import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { Sun, Moon, Bell } from 'lucide-react';
import NotificationDialog from './NotificationDialog';
import { getUserNotifications } from '../services/notificationService';

const Navbar = ({ isDarkMode, toggleTheme, user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const handleSmoothScroll = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const data = await getUserNotifications();
          if (data.success) {
            const unreadCount = data.data.filter(n => !n.read).length;
            setUnreadNotificationCount(unreadCount);
          }
        } catch (err) {
          console.error('Error fetching notification count:', err);
        }
      }
    };

    fetchUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo-left">
            <Link to={user ? (user.role === 'admin' ? '/admin-dashboard' : '/dashboard') : "/"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img 
                src={isDarkMode ? "/src/assets/Kaydpalw.png" : "/src/assets/Kaydpal.png"} 
                alt="KaydPal Logo" 
                style={{ height: '150px', width: 'auto' }} 
              />
            </Link>
          </div>
          <div className="nav-menu-center">
            {user && user.role === 'user' && (
              <NavLink to="/dashboard">Dashboard</NavLink>
            )}
            {user && user.role === 'admin' && (
              <NavLink to="/admin-dashboard">Admin Dashboard</NavLink>
            )}
            {!user && isLandingPage && (
              <>
                <button onClick={() => handleSmoothScroll('features')} className="nav-link">Features</button>
                <button onClick={() => handleSmoothScroll('pricing')} className="nav-link">Pricing</button>
                <button onClick={() => handleSmoothScroll('contact')} className="nav-link">Contact</button>
              </>
            )}
          </div>
          <div className="nav-cta-right">
            {user && user.role === 'user' && (
              <button 
                className="notification-button"
                onClick={() => setIsNotificationDialogOpen(true)}
              >
                <Bell size={20} />
                {unreadNotificationCount > 0 && (
                  <span className="notification-badge">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}
            <button onClick={toggleTheme} className="theme-toggle">
              {isDarkMode ? <Sun /> : <Moon />}
            </button>
            {user ? (
              <button onClick={handleLogout} className="btn-secondary">Logout</button>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Login</Link>
                <Link to="/register" className="btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {user && user.role === 'user' && (
        <NotificationDialog 
          isOpen={isNotificationDialogOpen}
          onClose={() => setIsNotificationDialogOpen(false)}
          onNotificationCountChange={setUnreadNotificationCount}
        />
      )}
    </>
  );
};

export default Navbar;
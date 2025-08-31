import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { Sun, Moon } from 'lucide-react';

const Navbar = ({ isDarkMode, toggleTheme, user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

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

  return (
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
  );
};

export default Navbar;

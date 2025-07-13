import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Navbar from './components/Navbar';
import Inventory from './components/Inventory';
import Transactions from './components/Transactions';
import Financial from './components/Financial';
import Stocks from './components/Stocks';
import Employees from './components/Employees';
import Payments from './components/Payments';
import { fetchUserProfile } from '../../APIs/auth';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const getProfile = async () => {
      const profile = await fetchUserProfile();
      if (profile && profile.success) {
        setUser(profile.data.user);
      }
      setLoading(false);
    };
    getProfile();
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  return (
    <div className="app">
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} setUser={setUser} />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginForm setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterForm />} />
          <Route
            path="/dashboard"
            element={
              user && user.role === 'user'
                ? <Dashboard />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/inventory"
            element={
              user && user.role === 'user'
                ? <Inventory />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/transactions"
            element={
              user && user.role === 'user'
                ? <Transactions />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/financial"
            element={
              user && user.role === 'user'
                ? <Financial />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/stocks"
            element={
              user && user.role === 'user'
                ? <Stocks />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/employees"
            element={
              user && user.role === 'user'
                ? <Employees />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/payments"
            element={
              user && user.role === 'user'
                ? <Payments />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              user && user.role === 'admin'
                ? <AdminDashboard />
                : <Navigate to={user && user.role === 'user' ? "/dashboard" : "/login"} />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;

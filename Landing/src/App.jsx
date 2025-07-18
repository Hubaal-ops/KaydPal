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
import StockAdjustment from './views/StockAdjustment';
import StockTransfer from './views/StockTransfer';
import Employees from './components/Employees';
import Payments from './components/Payments';
import EmployeesView from './views/Employees';
import Salary from './views/Salary';
import ExpenseCategory from './views/ExpenseCategory';
import Expenses from './views/Expenses';
import Transfer from './views/Transfer';
import Account from './views/Account';
import Deposit from './views/Deposit';
import Withdrawal from './views/Withdrawal';
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
            path="/financial/expense-category"
            element={
              user && user.role === 'user'
                ? <ExpenseCategory onBack={() => window.history.back()} />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/financial/expenses"
            element={
              user && user.role === 'user'
                ? <Expenses onBack={() => window.history.back()} />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/financial/transfers"
            element={
              user && user.role === 'user'
                ? <Transfer onBack={() => window.history.back()} />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/financial/accounts"
            element={
              user && user.role === 'user'
                ? <Account onBack={() => window.history.back()} />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/financial/deposits"
            element={
              user && user.role === 'user'
                ? <Deposit onBack={() => window.history.back()} />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/financial/withdrawals"
            element={
              user && user.role === 'user'
                ? <Withdrawal onBack={() => window.history.back()} />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/stocks/stock-transfer"
            element={
              user && user.role === 'user'
                ? <StockTransfer onBack={() => window.history.back()} />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route path="/stocks">
            <Route
              index
              element={
                user && user.role === 'user'
                  ? <Stocks />
                  : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
              }
            />
            <Route
              path="stock-adjustment"
              element={
                user && user.role === 'user'
                  ? <StockAdjustment onBack={() => window.history.back()} />
                  : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
              }
            />
          </Route>
          <Route path="/employees">
            <Route
              index
              element={
                user && user.role === 'user'
                  ? <Employees />
                  : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
              }
            />
            <Route
              path="employees"
              element={
                user && user.role === 'user'
                  ? <EmployeesView onBack={() => window.history.back()} />
                  : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
              }
            />
            <Route
              path="salaries"
              element={
                user && user.role === 'user'
                  ? <Salary onBack={() => window.history.back()} />
                  : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
              }
            />
          </Route>
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

import ResetPasswordForm from './components/ResetPasswordForm';
import React, { useState, useEffect, createContext, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
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
import Analytics from './views/Analytics';
import ErrorBoundary from './components/ErrorBoundary';
import Reports from './views/Reports';
import SalesReports from './views/SalesReports';
import PurchaseReports from './views/PurchaseReports';
import InventoryReports from './views/InventoryReports';
import AdvancedInventoryReports from './views/AdvancedInventoryReports';
import FinancialReports from './views/FinancialReports';
import BusinessManagement from './views/BusinessManagement';
import UserManagement from './views/admin/UserManagement';
import SystemSettings from './views/admin/SystemSettings';
import AuditLogs from './views/admin/AuditLogs';
import Notifications from './views/admin/Notifications';
import RolesPermissions from './views/admin/RolesPermissions';
import UserSupport from './views/user/Support';
import ForgotPasswordForm from './components/ForgotPasswordForm';
// import { fetchUserProfile } from '../../APIs/auth';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

function App() {
  const [mode, setMode] = useState('light');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light theme settings
                background: {
                  default: '#f5f5f5',
                  paper: '#ffffff',
                },
              }
            : {
                // Dark theme settings
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
              }),
        },
      }),
    [mode],
  );

  const isDarkMode = mode === 'dark';

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);




  useEffect(() => {
    const getProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/protected/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const profile = await response.json();
        if (profile && profile.success) {
          setUser(profile.data.user);
        }
      } catch (err) {
        // Optionally handle error
      }
      setLoading(false);
    };
    getProfile();
  }, []);

  const toggleTheme = () => {
    colorMode.toggleColorMode();
  }

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <div className="app">
          <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} setUser={setUser} />
          <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginForm setUser={setUser} />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
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
            path="/business"
            element={
              user && user.role === 'user'
                ? <BusinessManagement />
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
            path="/analytics"
            element={
              user && user.role === 'user'
                ? (
                    <ErrorBoundary>
                      <Analytics />
                    </ErrorBoundary>
                  )
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/reports"
            element={
              user && user.role === 'user'
                ? <Reports />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/reports/sales-advanced"
            element={
              user && user.role === 'user'
                ? <SalesReports />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/reports/purchases-advanced"
            element={
              user && user.role === 'user'
                ? <PurchaseReports />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/reports/inventory-advanced"
            element={
              user && user.role === 'user'
                ? <InventoryReports />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/reports/inventory-advanced-new"
            element={
              user && user.role === 'user'
                ? <AdvancedInventoryReports />
                : <Navigate to={user && user.role === 'admin' ? "/admin-dashboard" : "/login"} />
            }
          />
          <Route
            path="/reports/financial-advanced"
            element={
              user && user.role === 'user'
                ? <FinancialReports />
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
          <Route
            path="/admin/user-management"
            element={user && user.role === 'admin' ? <UserManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/system-settings"
            element={user && user.role === 'admin' ? <SystemSettings /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/audit-logs"
            element={user && user.role === 'admin' ? <AuditLogs /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/notifications"
            element={user && user.role === 'admin' ? <Notifications /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/roles-permissions"
            element={user && user.role === 'admin' ? <RolesPermissions /> : <Navigate to="/login" />}
          />
          <Route
            path="/support"
            element={user ? <UserSupport /> : <Navigate to="/login" />}
          />
        </Routes>
          </main>
        </div>
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;

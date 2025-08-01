import React from 'react';
import styles from './Dashboard.module.css';
import { 
  Package, 
  DollarSign, 
  ArrowLeftRight,
  TrendingUp, 
  Users, 
  BarChart3, 
  FileText 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const modules = [
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Manage products, categories, and stock levels',
      icon: Package,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      id: 'transactions',
      title: 'Transactions',
      description: 'View and manage all business transactions',
      icon: ArrowLeftRight,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
    },
    {
      id: 'financial',
      title: 'Financial',
      description: 'Track expenses, revenue, and financial reports',
      icon: DollarSign,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      id: 'stocks',
      title: 'Stocks',
      description: 'Monitor stock movements and warehouse management',
      icon: TrendingUp,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      id: 'employees',
      title: 'Employees',
      description: 'Manage staff, roles, and permissions',
      icon: Users,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Data insights and performance metrics',
      icon: BarChart3,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Generate and view detailed reports',
      icon: FileText,
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
    }
  ];

  const handleCardClick = (moduleId) => {
    console.log(`Navigating to ${moduleId} module`);
    const routes = {
      'inventory': '/inventory',
      'transactions': '/transactions',
      'financial': '/financial',
      'stocks': '/stocks',
      'employees': '/employees',
      'analytics': '/analytics',
      'reports': '/reports'
    };

    if (routes[moduleId]) {
      navigate(routes[moduleId]);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles['dashboard-header']}>
        <h1>Inventory Management System</h1>
        <p>Welcome to your modern business management dashboard</p>
      </div>
      
      <div className={styles['dashboard-content']}>
        <div className={styles['modules-grid']}>
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <div
                key={module.id}
                className={styles['module-card']}
                onClick={() => handleCardClick(module.id)}
                style={{ '--card-gradient': module.gradient }}
              >
                <div className={styles['card-header']}>
                  <div className={styles['icon-container']} style={{ backgroundColor: module.color }}>
                    <IconComponent size={32} color="white" />
                  </div>
                  <h3>{module.title}</h3>
                </div>
                <p className={styles['card-description']}>{module.description}</p>
                <div className={styles['card-footer']}>
                  <span className={styles['access-text']}>Click to access</span>
                  <div className={styles['arrow-icon']}>→</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
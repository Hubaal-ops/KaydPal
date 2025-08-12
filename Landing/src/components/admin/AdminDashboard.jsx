import React from 'react';
import './AdminDashboard.css';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Settings,
  ClipboardList,
  Bell,
  ShieldCheck,
  LifeBuoy
} from 'lucide-react';

const adminModules = [
  {
    id: 'user-management',
    title: 'User Management',
    description: 'Add, edit, or remove users and manage profiles',
    icon: Users,
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
  },
  {
    id: 'system-settings',
    title: 'System Settings',
    description: 'Configure system preferences and integrations',
    icon: Settings,
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #065f46 100%)'
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    description: 'View system activity and audit trails',
    icon: ClipboardList,
    color: '#f59e42',
    gradient: 'linear-gradient(135deg, #f59e42 0%, #b45309 100%)'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage alerts and notification settings',
    icon: Bell,
    color: '#e11d48',
    gradient: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)'
  },
  {
    id: 'roles-permissions',
    title: 'Roles & Permissions',
    description: 'Assign roles and set access permissions',
    icon: ShieldCheck,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)'
  },
  // ...removed support module from admin dashboard...
];

const routeMap = {
  'user-management': '/admin/user-management',
  'system-settings': '/admin/system-settings',
  'audit-logs': '/admin/audit-logs',
  'notifications': '/admin/notifications',
  'roles-permissions': '/admin/roles-permissions',
  // ...removed support route from admin dashboard...
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const handleCardClick = (moduleId) => {
    if (routeMap[moduleId]) {
      navigate(routeMap[moduleId]);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Quick access to administrative functions</p>
      </div>
      <div className="admin-dashboard-content">
        <div className="admin-modules-grid">
          {adminModules.map((module) => {
            const IconComponent = module.icon;
            return (
              <div
                key={module.id}
                className="admin-module-card"
                onClick={() => handleCardClick(module.id)}
                style={{ '--card-gradient': module.gradient }}
              >
                <div className="admin-card-header">
                  <div className="admin-icon-container" style={{ backgroundColor: module.color }}>
                    <IconComponent size={28} color="white" />
                  </div>
                  <h3>{module.title}</h3>
                </div>
                <p className="admin-card-description">{module.description}</p>
                <div className="admin-card-footer">
                  <span className="admin-access-text">Click to access</span>
                  <div className="admin-arrow-icon">→</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 
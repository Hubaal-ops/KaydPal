import React, { useState, useEffect } from 'react';
import { Settings, User, Lock, Bell, Mail, Database, Globe, CreditCard, Shield, Palette } from 'lucide-react';
import styles from './SystemSettings.module.css';

const SystemSettings = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/protected/admin/system-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSettings(data.data);
        } else {
          setError('Failed to load settings');
        }
      } catch {
        setError('Failed to load settings');
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/protected/admin/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to save settings');
      }
    } catch {
      setError('Failed to save settings');
    }
    setSaving(false);
  };

  const sections = [
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'authentication', label: 'Authentication', icon: <Lock size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'email', label: 'Email Settings', icon: <Mail size={18} /> },
    { id: 'backup', label: 'Backup', icon: <Database size={18} /> },
    { id: 'localization', label: 'Localization', icon: <Globe size={18} /> },
    { id: 'payment', label: 'Payment', icon: <CreditCard size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className={styles.settingGroup}>
            <h3 className={styles.sectionTitle}>General Settings</h3>
            <p className={styles.sectionDescription}>
              Configure basic system settings including site information and display preferences.
            </p>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4 className={styles.settingTitle}>Site Title</h4>
                <p className={styles.settingDescription}>
                  The name of your application.
                </p>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="text"
                  name="siteTitle"
                  value={settings.siteTitle}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4 className={styles.settingTitle}>Site Description</h4>
                <p className={styles.settingDescription}>
                  A brief description of your application.
                </p>
              </div>
              <div className={styles.settingControl}>
                <textarea
                  name="siteDescription"
                  value={settings.siteDescription}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={3}
                />
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4 className={styles.settingTitle}>Timezone</h4>
                <p className={styles.settingDescription}>
                  Set the default timezone for your application.
                </p>
              </div>
              <div className={styles.settingControl}>
                <select
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="Africa/Nairobi">Nairobi (EAT)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">New York (EST)</option>
                  <option value="Europe/London">London (GMT)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'authentication':
        return (
          <div className={styles.settingGroup}>
            <h3 className={styles.sectionTitle}>Authentication Settings</h3>
            <p className={styles.sectionDescription}>
              Configure how users authenticate and access your application.
            </p>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4 className={styles.settingTitle}>User Registration</h4>
                <p className={styles.settingDescription}>
                  Allow new users to register accounts.
                </p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="enableRegistration"
                    checked={settings.enableRegistration}
                    onChange={handleInputChange}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4 className={styles.settingTitle}>Email Verification</h4>
                <p className={styles.settingDescription}>
                  Require users to verify their email address.
                </p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="requireEmailVerification"
                    checked={settings.requireEmailVerification}
                    onChange={handleInputChange}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4 className={styles.settingTitle}>Two-Factor Authentication</h4>
                <p className={styles.settingDescription}>
                  Require users to use two-factor authentication.
                </p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="enable2FA"
                    checked={settings.enable2FA}
                    onChange={handleInputChange}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </div>
        );

      // Add more cases for other sections...

      default:
        return (
          <div className={styles.settingGroup}>
            <h3 className={styles.sectionTitle}>Coming Soon</h3>
            <p className={styles.sectionDescription}>
              This section is under development and will be available soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>System Settings</h1>
        <p className={styles.description}>
          Configure your application settings and preferences.
        </p>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading settings...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className={styles.settingsGrid}>
            <div className={styles.sidebar}>
              <h3 className={styles.sidebarTitle}>Settings</h3>
              <nav className={styles.sidebarNav}>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className={`${styles.navItem} ${
                      activeSection === section.id ? styles.active : ''
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className={styles.settingsContent}>
              {renderSection()}
              <button type="submit" className={styles.saveButton} disabled={saving}>
                <Settings size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {success && <div className={styles.success}>Settings saved successfully!</div>}
              {error && <div className={styles.error}>{error}</div>}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SystemSettings;
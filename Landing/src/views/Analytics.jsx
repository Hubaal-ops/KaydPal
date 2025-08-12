
import React, { useEffect, useState } from 'react';
import styles from './Analytics.module.css';
import { fetchAnalytics } from '../services/analyticsService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';

const colorMap = {
  good: '#22c55e',
  warning: '#facc15',
  critical: '#ef4444',
  fast: '#22c55e',
  slow: '#f59e42',
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nlQuery, setNlQuery] = useState('');
  const [nlResult, setNlResult] = useState(null);
  const [range, setRange] = useState('month');

  useEffect(() => {
    setLoading(true);
    fetchAnalytics({ range }).then(setData).finally(() => setLoading(false));
  }, [range]);

  // Simulate AI/NLQ result
  const handleNLQuery = (e) => {
    e.preventDefault();
    // In real app, call backend AI endpoint
    setNlResult(`Showing results for: "${nlQuery}"`);
  };

  if (loading) return <div className={styles.analyticsContainer}>Loading...</div>;

  // Demo data fallback for UI
  const salesTrends = data?.salesTrends || [
    { period: 'Week 1', value: 12000 },
    { period: 'Week 2', value: 18000 },
    { period: 'Week 3', value: 22000 },
    { period: 'Week 4', value: 52300 },
  ];
  const stockLevels = data?.stockLevels || [
    { name: 'Item A', qty: 150, status: 'good' },
    { name: 'Item B', qty: 30, status: 'warning' },
    { name: 'Item C', qty: 10, status: 'critical' },
  ];
  const fastSlowProducts = data?.fastSlowProducts || [
    { name: 'Product X', status: 'fast' },
    { name: 'Product Y', status: 'slow' },
    { name: 'Product Z', status: 'slow' },
  ];
  const debtTracking = data?.debtTracking || [
    { name: 'John Doe', amount: 1200, days: 45 },
    { name: 'Mary Smith', amount: 1500, days: 38 },
    { name: 'James Brown', amount: 1100, days: 32 },
  ];
  const aiPrediction = data?.aiPrediction || 'Item B is likely to run out in 3 days';
  const restockRecommendation = data?.restockRecommendation || 'Recommended reorder quantity for Item A: 180';
  const debtRiskAlerts = data?.debtRiskAlerts || [
    { name: 'John Doe', risk: 'High' },
  ];

  return (
    <div className={styles.analyticsContainer}>
      <h2 className={styles.title}>Smart Inventory Management System</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 500 }}>Time Range:</label>
        <select value={range} onChange={e => setRange(e.target.value)} style={{ borderRadius: 8, padding: 6, border: '1px solid #e5e7eb' }}>
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
      <div className={styles.statsGrid}>
        {/* Sales Trends */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Sales Trends</span>
          </div>
          <div className={styles.chartContainer} style={{ height: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrends}>
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
                <XAxis dataKey="period" hide />
                <YAxis hide />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.statValue}>
            ${salesTrends[salesTrends.length - 1]?.value?.toLocaleString() || '0'}
          </div>
        </div>

        {/* Stock Levels */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Stock Levels</span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {stockLevels.map((item) => (
              <li key={item.name} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <span style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: colorMap[item.status],
                  marginRight: 8,
                }} />
                <span style={{ flex: 1 }}>{item.name}</span>
                <span style={{ fontWeight: 600 }}>{item.qty}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Fast-moving vs. Slow-moving Products (Bar) */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Fast-moving vs. Slow-moving Products</span>
          </div>
          <div className={styles.chartContainer} style={{ height: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Fast-moving', value: fastSlowProducts.filter(p => p.status === 'fast').length },
                { name: 'Slow-moving', value: fastSlowProducts.filter(p => p.status === 'slow').length },
              ]}>
                <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 8, 8]} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Debt Tracking */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Debt Tracking</span>
            <span style={{ marginLeft: 'auto', color: colorMap.critical, fontSize: 32 }}>
              <AlertCircle />
            </span>
          </div>
          <div className={styles.statValue} style={{ color: colorMap.critical, fontWeight: 700, fontSize: 28 }}>
            {debtTracking.length} Customers
          </div>
        </div>
      </div>

      {/* Fast/Slow Table & Debt Table */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Fast-moving vs. Slow-moving Products</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 6 }}>Product</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {fastSlowProducts.map((p) => (
                  <tr key={p.name}>
                    <td style={{ padding: 6 }}>{p.name}</td>
                    <td style={{ padding: 6 }}>
                      <span style={{
                        background: p.status === 'fast' ? colorMap.fast : colorMap.slow,
                        color: '#fff',
                        borderRadius: 8,
                        padding: '2px 10px',
                        fontSize: 13,
                        fontWeight: 500,
                      }}>{p.status === 'fast' ? 'Fast-moving' : 'Slow-moving'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Debt Tracking</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 6 }}>Customer</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Amount</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Days And</th>
                </tr>
              </thead>
              <tbody>
                {debtTracking.map((c) => (
                  <tr key={c.name}>
                    <td style={{ padding: 6 }}>{c.name}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>${c.amount.toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{c.days} day</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Features */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>AI Prediction</span>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: 8, padding: 12, fontWeight: 500, color: '#222' }}>
              {aiPrediction}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Smart Restock Recommendations</span>
            </div>
            <div style={{ background: '#e7fbe7', borderRadius: 8, padding: 12, fontWeight: 500, color: '#166534' }}>
              {restockRecommendation}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Debt Risk Alerts</span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {debtRiskAlerts.map((a) => (
                <li key={a.name} style={{ color: colorMap.critical, fontWeight: 600, marginBottom: 4 }}>
                  {a.name} - {a.risk} risk
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Natural Language Query</span>
            </div>
            <form onSubmit={handleNLQuery} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={nlQuery}
                onChange={e => setNlQuery(e.target.value)}
                placeholder="Top selling products this month"
                style={{ flex: 1, borderRadius: 8, border: '1px solid #e5e7eb', padding: 8 }}
              />
              <button type="submit" style={{ borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', fontWeight: 600 }}>
                Search
              </button>
            </form>
            {nlResult && <div style={{ marginTop: 8, color: '#222', fontWeight: 500 }}>{nlResult}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

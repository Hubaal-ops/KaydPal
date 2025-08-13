
import React, { useState, useContext, useEffect } from 'react';
import { ColorModeContext } from '../App';
import {
  Box, Card, CardContent, Grid, Typography, TextField, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { Search, AlertCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import styles from './Analytics.module.css';
import { fetchAnalytics } from '../services/analyticsService';


// Real data state
const defaultColors = ['#4CAF50', '#FFB300', '#F44336', '#6366f1', '#FF9800'];



const Analytics = () => {
  const [nlQuery, setNlQuery] = useState('');
  const [nlResult, setNlResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [fastSlowTable, setFastSlowTable] = useState([]);
  const [debtTracking, setDebtTracking] = useState([]);
  const [aiPrediction, setAiPrediction] = useState({ product: '', days: 0 });
  const [restockRec, setRestockRec] = useState({ product: '', qty: 0 });
  useEffect(() => {
    async function getAnalytics() {
      setLoading(true);
      try {
        const res = await fetchAnalytics();
        // Map backend response to frontend state
        // Example assumes backend returns keys: salesTrends, stockLevels, fastSlowTable, debtTracking, aiPrediction, restockRec
        setSalesTrendData(res.data.salesTrends || []);
        setStockLevels((res.data.stockLevels || []).map((item) => {
          let color = '#4CAF50'; // green for good
          if (item.status === 'warning') color = '#FF9800'; // orange for medium
          if (item.status === 'critical') color = '#F44336'; // red for low
          return { ...item, color };
        }));
        setFastSlowTable(res.data.fastSlowTable || []);
        setDebtTracking(res.data.debtTracking || []);
        setAiPrediction(res.data.aiPrediction || { product: '', days: 0 });
        setRestockRec(res.data.restockRec || { product: '', qty: 0 });
      } catch (err) {
        // Optionally handle error
      }
      setLoading(false);
    }
    getAnalytics();
  }, []);
  const colorMode = useContext(ColorModeContext);
  const isDarkMode = document.body.classList.contains('dark');

  // Natural language query mock
  const handleNlQuery = () => {
    if (nlQuery.toLowerCase().includes('top selling')) {
      setNlResult(
        <Box>
          <Typography variant="subtitle1">Top Selling Products This Month</Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {stockLevels.slice(0, 3).map(p => (
              <li key={p.name}>{p.name} - {p.stock} sold</li>
            ))}
          </ul>
        </Box>
      );
    } else {
      setNlResult(<Typography color="text.secondary">No results for: {nlQuery}</Typography>);
    }
  };

  if (loading) {
    return <div className={styles.analyticsContainer}><h2>Loading analytics...</h2></div>;
  }
  return (
  <div className={styles.analyticsContainer}>
      <div className={styles.header}>
        <h1 className={styles.title} style={{ color: isDarkMode ? 'var(--text-primary)' : '#fff' }}>Smart Inventory Analytics</h1>
      </div>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Sales Trends</span>
          </div>
          <div className={styles.chartContainer} style={{height: 40}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData.map(d => ({ name: d.period, value: d.value }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.statValue}>
            ${salesTrendData.length > 0 ? salesTrendData[salesTrendData.length - 1].value.toLocaleString() : '0'}
          </div>
        </div>
        <div className={styles.chartCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Stock Levels</span>
          </div>
          <div>
            {stockLevels.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ width: 13, height: 13, borderRadius: '50%', background: item.color, marginRight: 8, display: 'inline-block' }} />
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{item.name}</span>
                <span style={{ fontWeight: 700, color: item.color }}>{item.stock}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.chartCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Fast-moving vs. Slow-moving</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, borderRadius: 2, background: '#4CAF50', width: '90%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, borderRadius: 2, background: '#FF9800', width: '70%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 13, height: 13, borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />Fast-moving</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 13, height: 13, borderRadius: '50%', background: '#FF9800', display: 'inline-block' }} />Slow-moving</span>
          </div>
        </div>
        <div className={styles.chartCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Debt Tracking</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
            <span style={{ background: '#F44336', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <AlertCircle color="#fff" size={32} />
            </span>
            <span style={{ fontWeight: 700, color: '#F44336', fontSize: 32 }}>3 Customers</span>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        {/* Existing analytics */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Fast-moving vs. Slow-moving Products</div>
          </div>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fastSlowTable.map(row => (
                  <TableRow key={row.name + row.status}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      <span className={styles.statusBadge} style={{ background: row.color, color: '#fff' }}>{row.status}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Debt Tracking</div>
          </div>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Days</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {debtTracking.map(row => (
                  <TableRow key={row.name}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>${row.amount.toLocaleString()}</TableCell>
                    <TableCell>{row.days} days</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>AI Prediction</div>
          </div>
          <div className={`${styles.aiCardBg} ${isDarkMode ? styles.aiCardBgDark : styles.aiCardBgLight}`}>
            <div className={styles.aiCardText} style={{ color: 'var(--text-primary)' }}>
              <b>{aiPrediction.product}</b> is likely to run out in <b>{aiPrediction.days} days</b>
            </div>
          </div>
          <TextField
            value={nlQuery}
            onChange={e => setNlQuery(e.target.value)}
            placeholder="Top selling products this month"
            size="medium"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="#b0b0b0" />
                </InputAdornment>
              )
            }}
            sx={{ background: isDarkMode ? 'var(--surface-hover)' : '#f7fafd', borderRadius: 2, marginTop: 4, color: isDarkMode ? 'var(--text-primary)' : undefined }}
          />
          {nlResult && <div style={{ marginTop: 8 }}>{nlResult}</div>}
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Smart Restock Recommendations</div>
          </div>
          <div className={`${styles.aiCardBg} ${isDarkMode ? styles.aiCardBgDark : styles.aiCardBgLight}`}>
            <div className={styles.aiCardText} style={{ color: 'var(--text-primary)' }}>
              Recommended reorder quantity for <b>{restockRec.product}</b>: <b>{restockRec.qty}</b>
            </div>
          </div>
          <TextField
            disabled
            value="Natural Language Query"
            size="medium"
            fullWidth
            sx={{ background: isDarkMode ? 'var(--surface-hover)' : '#f7fafd', borderRadius: 2, marginTop: 4, color: isDarkMode ? 'var(--text-secondary)' : '#b0b0b0' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Analytics;

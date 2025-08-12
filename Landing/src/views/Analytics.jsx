
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, CardHeader, Grid, Typography, Select, MenuItem, FormControl, InputLabel, TextField, InputAdornment, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { AlertTriangle, Search, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, differenceInDays, subMonths } from 'date-fns';
import { useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';

// --- MOCK DATA (Replace with API calls in production) ---
const salesTrendData = [
  { name: '', sales: 48000 },
  { name: '', sales: 50000 },
  { name: '', sales: 47000 },
  { name: '', sales: 51000 },
  { name: '', sales: 52000 },
];
const stockLevels = [
  { name: 'Item A', stock: 150, color: '#4CAF50' },
  { name: 'Item B', stock: 30, color: '#FFB300' },
  { name: 'Item C', stock: 10, color: '#F44336' },
];
const fastSlowBar = [
  { label: 'Fast-moving', value: 60, color: '#4CAF50' },
  { label: 'Slow-moving', value: 40, color: '#FF9800' },
];
const fastSlowTable = [
  { name: 'Product X', status: 'Fast-moving', color: '#4CAF50' },
  { name: 'Product X', status: 'Slow-moving', color: '#4CAF50' },
  { name: 'Product Z', status: 'Slow-moving', color: '#FF9800' },
];
const debtTracking = [
  { name: 'John Doe', amount: 1200, days: 45 },
  { name: 'Mary Smith', amount: 1500, days: 38 },
  { name: 'James Brown', amount: 1100, days: 32 },
];
const aiPrediction = { product: 'Item B', days: 3 };
const restockRec = { product: 'Item A', qty: 180 };


const Analytics = () => {
  const theme = useTheme();
  const [nlQuery, setNlQuery] = useState('');
  const [nlResult, setNlResult] = useState(null);

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

  return (
    <Box sx={{ p: 0, bgcolor: '#f7f7f7', minHeight: '100vh', color: 'text.primary' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, ml: 4, mt: 3 }}>Smart Inventory Management System</Typography>
      {/* Top 4 summary cards */}
      <Grid container spacing={2} sx={{ mb: 0, px: 3 }}>
        {/* Sales Trends */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 0, borderRadius: 3, minHeight: 210, boxShadow: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: '#fff', border: '1.5px solid #e0e0e0' }}>
            <CardContent sx={{ width: '100%', textAlign: 'center', p: 3 }}>
              <Typography fontWeight={700} fontSize={20} color="#444" sx={{ mb: 1 }}>Sales Trends</Typography>
              <Box sx={{ height: 40, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="h3" fontWeight={700} sx={{ mt: 2, color: '#222', fontSize: 38 }}>$52,300</Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Stock Levels */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 0, borderRadius: 3, minHeight: 210, boxShadow: 2, bgcolor: '#fff', border: '1.5px solid #e0e0e0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <CardContent sx={{ width: '100%', p: 3 }}>
              <Typography fontWeight={700} fontSize={20} color="#444" sx={{ mb: 1 }}>Stock Levels</Typography>
              <Box sx={{ mt: 1 }}>
                {stockLevels.map((item, i) => (
                  <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: item.color, mr: 1 }} />
                    <Typography fontSize={16} sx={{ flex: 1 }}>{item.name}</Typography>
                    <Typography fontWeight={700} fontSize={16} color={item.color}>{item.stock}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* Fast-moving vs. Slow-moving Products (bar) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 0, borderRadius: 3, minHeight: 210, boxShadow: 2, bgcolor: '#fff', border: '1.5px solid #e0e0e0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <CardContent sx={{ width: '100%', p: 3 }}>
              <Typography fontWeight={700} fontSize={20} color="#444" sx={{ mb: 1 }}>Fast-moving vs. Slow-moving Products</Typography>
              <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1, mr: 1 }}>
                  <Box sx={{ height: 14, borderRadius: 2, bgcolor: '#4CAF50', width: '90%' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ height: 14, borderRadius: 2, bgcolor: '#FF9800', width: '70%' }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                  <Typography fontSize={15}>Fast-moving</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: '#FF9800' }} />
                  <Typography fontSize={15}>Slow-moving</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* Debt Tracking (summary) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 0, borderRadius: 3, minHeight: 210, boxShadow: 2, bgcolor: '#fff', border: '1.5px solid #e0e0e0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CardContent sx={{ textAlign: 'center', width: '100%', p: 3 }}>
              <Typography fontWeight={700} fontSize={20} color="#444">Debt Tracking</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                <Box sx={{ bgcolor: '#F44336', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <AlertCircle color="#fff" size={32} />
                </Box>
                <Typography variant="h4" fontWeight={700} color="#F44336" sx={{ fontSize: 32 }}>3 Customers</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Second row: Fast/Slow Table, Debt Table (horizontal fit) */}
      <Grid container spacing={2} sx={{ mb: 1, px: 3 }} alignItems="stretch">
        {/* Fast-moving vs. Slow-moving Table */}
        <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
          <Card sx={{ p: 0, borderRadius: 3, boxShadow: 2, bgcolor: '#fff', border: '1.5px solid #e0e0e0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography fontWeight={700} fontSize={20} sx={{ mb: 1, color: '#607188' }}>Fast-moving vs. Slow-moving Products</Typography>
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
                          <Box component="span" sx={{ px: 2, py: 0.5, borderRadius: 2, fontWeight: 600, color: '#fff', bgcolor: row.color, fontSize: 15, minWidth: 90, display: 'inline-block', textAlign: 'center' }}>
                            {row.status}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        {/* Debt Tracking Table */}
        <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
          <Card sx={{ p: 0, borderRadius: 3, boxShadow: 2, bgcolor: '#fff', border: '1.5px solid #e0e0e0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography fontWeight={700} fontSize={20} sx={{ mb: 1, color: '#607188' }}>Cabt Tracking</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Days And</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {debtTracking.map(row => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>${row.amount.toLocaleString()}</TableCell>
                        <TableCell>{row.days} day</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom row: AI Prediction and Smart Restock horizontally, styled as in image */}
      <Grid container spacing={2} sx={{ px: 3, mb: 2 }} alignItems="stretch">
        {/* AI Prediction */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 0, borderRadius: 3, boxShadow: 2, bgcolor: '#fff', border: '1.5px solid #e0e0e0', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 150 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={700} fontSize={18} sx={{ mb: 1, color: '#607188' }}>AI Prediction</Typography>
              <Box sx={{ bgcolor: '#e8f1fa', borderRadius: 2, p: 1.5, mb: 2, display: 'flex', alignItems: 'center' }}>
                <Typography fontSize={16} fontWeight={600} color="#222">
                  <b>{aiPrediction.product}</b> is likely to run out in <b>{aiPrediction.days} days</b>
                </Typography>
              </Box>
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
                sx={{ background: '#f7fafd', borderRadius: 2, mt: 0.5 }}
              />
              {nlResult && <Box sx={{ mt: 1 }}>{nlResult}</Box>}
            </CardContent>
          </Card>
        </Grid>
        {/* Smart Restock Recommendations */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 0, borderRadius: 3, boxShadow: 2, bgcolor: '#fff', border: '1.5px solid #e0e0e0', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 150 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={700} fontSize={18} sx={{ mb: 1, color: '#607188' }}>Smart Restock Recommendations</Typography>
              <Box sx={{ bgcolor: '#e6f6ea', borderRadius: 2, p: 1.5, mb: 2, display: 'flex', alignItems: 'center' }}>
                <Typography fontSize={16} fontWeight={600} color="#222">
                  Recommended reorder quantity for <b>{restockRec.product}</b>: <b>{restockRec.qty}</b>
                </Typography>
              </Box>
              <TextField
                disabled
                value="Natural Language Qury"
                size="medium"
                fullWidth
                sx={{ background: '#f7fafd', borderRadius: 2, mt: 0.5, color: '#b0b0b0' }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;

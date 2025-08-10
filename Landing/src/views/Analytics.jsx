import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Card, CardContent, CardHeader, Grid, Typography } from '@mui/material';
import { TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme, useMediaQuery } from '@mui/material';

// Mock data - replace with actual API calls
const salesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 2780 },
  { name: 'May', sales: 1890 },
  { name: 'Jun', sales: 2390 },
];

const productData = [
  { name: 'Product A', value: 400 },
  { name: 'Product B', value: 300 },
  { name: 'Product C', value: 300 },
  { name: 'Product D', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Analytics = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      title: 'Total Sales',
      value: '$24,780',
      change: '+12.5%',
      icon: <DollarSign size={24} />, 
      color: '#4CAF50'
    },
    {
      title: 'Orders',
      value: '1,245',
      change: '+8.2%',
      icon: <ShoppingCart size={24} />, 
      color: '#2196F3'
    },
    {
      title: 'Customers',
      value: '845',
      change: '+5.3%',
      icon: <Users size={24} />, 
      color: '#9C27B0'
    },
    {
      title: 'Growth',
      value: '18.7%',
      change: '+2.4%',
      icon: <TrendingUp size={24} />, 
      color: '#FF9800'
    }
  ];

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/analytics/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setSummary(data.data);
        else setError(data.message || 'Failed to load analytics');
      } catch (err) {
        setError('Failed to load analytics');
      }
      setIsLoading(false);
    };
    fetchAnalytics();
  }, []);

  // ...existing code...



  const MotionCard = motion(Card);
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography>Loading analytics data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      bgcolor: 'background.default',
      minHeight: '100vh',
      color: 'text.primary',
      transition: 'background-color 0.3s ease-in-out',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Analytics Dashboard
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <MotionCard
              component={Card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(30, 41, 59, 0.5)' 
                  : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography color="textSecondary" variant="subtitle2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Box
                        component="span"
                        sx={{
                          color: stat.change.startsWith('+') ? '#4CAF50' : '#F44336',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.875rem',
                        }}
                      >
                        {stat.change}
                        <TrendingUp 
                          size={16} 
                          style={{
                            marginLeft: 4,
                            transform: stat.change.startsWith('+') ? 'rotate(0deg)' : 'rotate(180deg)'
                          }} 
                        />
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                        vs last period
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      backgroundColor: `${stat.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Sales Trend */}
        <Grid item xs={12} md={8}>
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            sx={{ p: 3, height: '100%', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)', border: `1px solid ${theme.palette.divider}` }}
          >
            <CardHeader 
              title="Sales Trend" 
              titleTypographyProps={{ 
                fontWeight: 'bold',
                color: theme.palette.text.primary,
              }}
              subheader="Monthly sales performance"
              subheaderTypographyProps={{
                color: theme.palette.text.secondary,
              }}
            />
            <CardContent sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px',
                      boxShadow: theme.shadows[2],
                      color: theme.palette.text.primary,
                      padding: '8px 12px',
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    fill="url(#colorSales)" 
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={0.2}
                    name="Sales ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Product Distribution */}
        <Grid item xs={12} md={4}>
          <MotionCard
            component={Card}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(30, 41, 59, 0.5)' 
                : 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardHeader 
              title="Product Distribution" 
              subheader="Top selling products" 
              titleTypographyProps={{ 
                fontWeight: 'bold',
                color: theme.palette.text.primary,
              }}
              subheaderTypographyProps={{
                color: theme.palette.text.secondary,
              }}
            />
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ height: 350, width: '100%', mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {productData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `$${value}`,
                        props.payload.name
                      ]}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: '8px',
                        boxShadow: theme.shadows[2],
                        color: theme.palette.text.primary,
                        padding: '8px 12px',
                      }}
                    />
                    <Legend 
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{
                        paddingTop: '20px',
                        color: theme.palette.text.primary,
                        fontSize: '0.875rem',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;

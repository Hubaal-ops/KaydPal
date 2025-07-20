const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config({ path: './config.env' });

// Force MongoDB URI to use Inventory database
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/Inventory';

// Import routes
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const accountRoutes = require('./routes/accounts');
const depositRoutes = require('./routes/deposits');
const withdrawalRoutes = require('./routes/withdrawals');
const transferRoutes = require('./routes/transfers');
const expenseCategoryRoutes = require('./routes/expenseCategories');
const expenseRoutes = require('./routes/expenses');
const employeeRoutes = require('./routes/employees');
const salaryRoutes = require('./routes/salaries');
const storeRoutes = require('./routes/stores');
const salesRoutes = require('./routes/sales');
const customersRoutes = require('./routes/customers');
const suppliersRoutes = require('./routes/suppliers');
const purchasesRoutes = require('./routes/purchases');
const paymentsRoutes = require('./routes/payments');
const paymentOutsRoutes = require('./routes/paymentouts');
const stockAdjustmentsRoute = require('./routes/stockAdjustments');
const storeProductsRoutes = require('./routes/storeProducts');
const stockTransfersRoutes = require('./routes/stockTransfers');
const purchaseReturnsRoutes = require('./routes/purchaseReturns');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_URI_TEST 
      : process.env.MONGODB_URI;

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');
    
    // Log connection details
    const db = mongoose.connection;
    console.log(`📊 Database: ${db.name}`);
    console.log(`🌐 Host: ${db.host}`);
    console.log(`🔌 Port: ${db.port}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/paymentouts', paymentOutsRoutes);
app.use('/api/stock-adjustments', stockAdjustmentsRoute);
app.use('/api/store-products', storeProductsRoutes);
app.use('/api/stock-transfers', stockTransfersRoutes);
app.use('/api/purchase-returns', purchaseReturnsRoutes);

// Health check endpoint for tests
app.get('/api/auth/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth system is ready for testing!',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    message: 'Professional Auth System is running! 🚀',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(200).json(healthCheck);
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Professional Auth System API',
    version: '1.0.0',
    documentation: {
      authentication: {
        baseUrl: '/api/auth',
        endpoints: {
          'POST /register': 'Register a new user',
          'POST /login': 'Login user and get JWT token',
          'GET /profile': 'Get current user profile (requires auth)',
          'PUT /profile': 'Update user profile (requires auth)',
          'POST /logout': 'Logout user (requires auth)',
          'GET /verify': 'Verify JWT token validity (requires auth)'
        }
      },
      protected: {
        baseUrl: '/api/protected',
        endpoints: {
          'GET /admin': 'Admin-only access (requires admin role)',
          'GET /user': 'User-only access (requires user role)',
          'GET /dashboard': 'Dashboard for any authenticated user',
          'GET /content': 'Content with role-based access',
          'GET /admin/users': 'Admin user management',
          'GET /admin/analytics': 'Admin analytics dashboard',
          'GET /user/profile': 'User profile page',
          'GET /user/settings': 'User settings page',
          'GET /public': 'Public content for authenticated users'
        }
      }
    },
    middleware: {
      'verifyToken': 'JWT token verification',
      'isAdmin': 'Admin role verification',
      'isUser': 'User role verification',
      'auth': 'Enhanced authentication with user lookup',
      'adminAuth': 'Admin authentication with user lookup'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'INTERNAL_SERVER_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('🚀 Professional Auth System Server');
  console.log('=====================================');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${mongoose.connection.name}`);
  console.log('');
  console.log('📝 API Documentation:');
  console.log('🔐 Authentication Routes:');
  console.log(`   POST /api/auth/register - Register a new user`);
  console.log(`   POST /api/auth/login - Login user`);
  console.log(`   GET  /api/auth/profile - Get user profile (requires auth)`);
  console.log(`   PUT  /api/auth/profile - Update user profile (requires auth)`);
  console.log(`   POST /api/auth/logout - Logout user (requires auth)`);
  console.log(`   GET  /api/auth/verify - Verify JWT token (requires auth)`);
  console.log('');
  console.log('🛡️ Protected Routes (require JWT token):');
  console.log(`   GET  /api/protected/admin - Admin only access`);
  console.log(`   GET  /api/protected/user - User only access`);
  console.log(`   GET  /api/protected/dashboard - Any authenticated user`);
  console.log(`   GET  /api/protected/content - Role-based content access`);
  console.log(`   GET  /api/protected/admin/users - Admin user management`);
  console.log(`   GET  /api/protected/admin/analytics - Admin analytics`);
  console.log(`   GET  /api/protected/user/profile - User profile page`);
  console.log(`   GET  /api/protected/user/settings - User settings page`);
  console.log(`   GET  /api/protected/public - Public content area`);
  console.log('');
  console.log('🔧 Utility Endpoints:');
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api - API documentation`);
  console.log('');
  console.log('🎯 Developer Integration:');
  console.log('   ✅ Developer 1: Auth system ready');
  console.log('   ✅ Developer 2: Middleware protection ready');
  console.log('   ✅ Both systems integrated and tested');
  console.log('');
  console.log('💡 Testing:');
  console.log('   npm test - Run all tests');
  console.log('   npm run test:auth - Test authentication');
  console.log('   npm run test:middleware - Test middleware');
  console.log('');
  console.log('🔗 Ready for frontend integration!');
});

module.exports = server; 
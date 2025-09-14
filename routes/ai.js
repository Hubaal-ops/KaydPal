const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();
const fetch = require('node-fetch');
const Account = require('../models/Account');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Payment = require('../models/Payment');
const PaymentOut = require('../models/PaymentOut');
const Purchase = require('../models/Purchase');
const StoreProduct = require('../models/StoreProduct');
const { 
  analyzeQueryIntent, 
  extractTimeContext, 
  getBusinessInsights, 
  formatEnhancedResponse,
  getSalesWithTimeFilter,
  getPurchasesWithTimeFilter
} = require('../utils/aiHelpers');
const { 
  updateConversationHistory, 
  getConversationContext, 
  trackDataAccess 
} = require('../utils/aiMemory');
const { 
  generateBusinessAlerts, 
  formatAlertsForAI 
} = require('../utils/aiAlerts');
const { generateAdvancedSalesReport } = require('../controllers/reportController');
const { generateAdvancedPurchaseReport } = require('../controllers/reportController');
const { generateAdvancedInventoryReport } = require('../controllers/reportController');
const { generateAdvancedFinancialReport } = require('../controllers/reportController');

// Enhanced function to determine if a query is about internal data
function isInternalDataQuery(messages) {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMessage) return false;
  
  const content = lastUserMessage.content.toLowerCase();
  
  // Use enhanced intent analysis
  const intentAnalysis = analyzeQueryIntent(content);
  
  // Consider it internal if confidence is above threshold or contains business keywords
  const businessKeywords = [
    // English keywords
    'account', 'balance', 'money', 'bank', 'cash', 'funds',
    'purchase', 'buy', 'procurement', 'supplier order', 'vendor', 'cost',
    'customer', 'client', 'buyer', 'consumer', 'customer debt', 'receivable',
    'sale', 'sell', 'revenue', 'transaction', 'order', 'invoice', 'customer order',
    'product', 'inventory', 'stock', 'item', 'goods', 'storing', 'warehouse',
    'report', 'summary', 'overview', 'dashboard', 'export', 'statement',
    'analysis', 'trend', 'compare', 'growth', 'performance', 'metric', 'kpi', 'insight',
    'financial', 'cash flow', 'balance sheet', 'financial report',
    'debt', 'profit', 'loss', 'income', 'expense',
    // Somali keywords with improved translations
    'xisaab', 'badeecad', 'iib', 'macmiil', 'alaab-qeybiye', 'iibsasho', 'badeecad kayd ah',
    'faa\'iido', 'khasaaro', 'dakhli', 'dakhliga', 'lacag soo-gal', 'kharash', 
    'socodka lacagta', 'qulqulka lacagta', 'xaashida xisaabeed', 'balansiga', 'warbixinta maaliyadeed',
    'hadhaag', 'lacag', 'maalgelin', 'hanti lacageed',
    'kayd', 'sahay', 'kayd badeeco', 'shay', 'qodob', 'alaab', 'kaydin', 'bakhaar',
    'sahay yari', 'kayd la\'aan', 'alaab ka dhammaatay',
    'iibka', 'iibin', 'hawlgal maaliyadeed', 'dalab', 'qaansheegad',
    'soo iibsi', 'qandaraas',
    'daynta macmiilka', 'lacag la sugayo', 'la qaabilo', 'daynta alaab-qeybiye', 'lacag la bixinayo',
    'isbeddel', 'falanqayn', 'is barbar dhig', 'koboc', 'horumar', 'waxqabad',
    'cabbir', 'kpi', 'tilmaame muhiim ah', 'faham', 'aragti ganacsi',
    'warbixin', 'soo koobid', 'guudmar', 'jaantus xogeed', 'dhoofin', 'bayaanka', 'xisaab celin',
    'ganacsi', 'talo', 'digniin', 'ururinta deynta', 'istaraatiijiyadda qiimaynta', 'jadwalka lacag bixinta',
    // Additional Somali expressions
    'hadhaagga', 'hadhaagga xisaabta', 'immisa badeecad ayaan kaydsanayaa', 'maanta', 'shalay', 
    'usbuucan', 'bishaan', 'sanadkan', 'lacagta daynta kuma maqan', 'daynta kuma maqan', 'aan la bixin'
  ];
  
  const hasBusinessKeywords = businessKeywords.some(keyword => content.includes(keyword));
  const hasHighConfidence = intentAnalysis.confidence > 0.3;
  
  return hasBusinessKeywords || hasHighConfidence;
}

// Helper function to extract information from user query
function extractQueryInfo(content) {
  const contentLower = content.toLowerCase();
  
  // Extract account name if mentioned
  const accountMatch = contentLower.match(/account\s+["']?([^"']+)["']?/i);
  
  // Extract product name if mentioned
  const productMatch = contentLower.match(/product\s+["']?([^"']+)["']?/i);
  
  // Extract time period if mentioned
  const timePeriod = contentLower.includes('today') ? 'today' :
                    contentLower.includes('week') ? 'week' :
                    contentLower.includes('month') ? 'month' :
                    contentLower.includes('year') ? 'year' : 'all';
  
  return {
    accountName: accountMatch ? accountMatch[1] : null,
    productName: productMatch ? productMatch[1] : null,
    timePeriod: timePeriod
  };
}

// Helper function to get account data for user
async function getAccountData(userId, accountName = null) {
  try {
    // Convert string userId to ObjectId if needed
    const userObjectId = typeof userId === 'string' ? userId : userId.toString();
    let query = { userId: userObjectId };
    
    console.log('Searching for accounts with userId:', userObjectId);
    console.log('Query object:', JSON.stringify(query));
    
    // If specific account name is mentioned, add to query
    if (accountName && accountName !== 'balance') { // Don't filter by 'balance' as account name
      query.name = new RegExp(accountName, 'i'); // Case insensitive match
      console.log('Filtering by account name:', accountName);
    }
    
    const accounts = await Account.find(query);
    console.log('Found accounts:', accounts.length);
    console.log('Sample account data:', accounts.length > 0 ? accounts[0] : 'No accounts found');
    
    // If no accounts found, try without ObjectId conversion (fallback)
    if (accounts.length === 0) {
      console.log('No accounts found, trying alternative query...');
      const alternativeQuery = { userId: userId };
      if (accountName) {
        alternativeQuery.name = new RegExp(accountName, 'i');
      }
      const alternativeAccounts = await Account.find(alternativeQuery);
      console.log('Alternative query found:', alternativeAccounts.length, 'accounts');
      return alternativeAccounts;
    }
    
    return accounts;
  } catch (err) {
    console.error('Error fetching account data:', err);
    return [];
  }
}

// Helper function to get product data for user with storing balance
async function getProductData(userId, productName = null) {
  try {
    let query = { userId: userId };
    
    // If specific product name is mentioned, add to query
    if (productName) {
      query.product_name = new RegExp(productName, 'i'); // Case insensitive match
    }
    
    const products = await Product.find(query);
    
    // For each product, get the storing balance from StoreProduct
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const storeProducts = await StoreProduct.find({ 
        product_no: product.product_no, 
        userId: userId 
      });
      
      // Sum up storing balances from all stores
      const totalStoringBalance = storeProducts.reduce((sum, sp) => sum + sp.qty, 0);
      product.storing_balance = totalStoringBalance;
    }
    
    return products;
  } catch (err) {
    console.error('Error fetching product data:', err);
    return [];
  }
}

// Helper function to get sales data for user
async function getSalesData(userId, timePeriod = 'all') {
  try {
    let query = { userId: userId };
    
    // Add date filtering based on time period
    if (timePeriod !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timePeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }
      
      if (startDate) {
        query.sel_date = { $gte: startDate };
      }
    }
    
    const sales = await Sale.find(query);
    return sales;
  } catch (err) {
    console.error('Error fetching sales data:', err);
    return [];
  }
}

// Helper function to get purchase data for user
async function getPurchaseData(userId, timePeriod = 'all') {
  try {
    let query = { userId: userId };
    
    // Add date filtering based on time period
    if (timePeriod !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timePeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }
      
      if (startDate) {
        query.created_at = { $gte: startDate };
      }
    }
    
    const purchases = await Purchase.find(query);
    return purchases;
  } catch (err) {
    console.error('Error fetching purchase data:', err);
    return [];
  }
}

// Helper function to get customer data for user
async function getCustomerData(userId) {
  try {
    const customers = await Customer.find({ userId: userId });
    return customers;
  } catch (err) {
    console.error('Error fetching customer data:', err);
    return [];
  }
}

// Helper function to get supplier data for user
async function getSupplierData(userId) {
  try {
    const suppliers = await Supplier.find({ userId: userId });
    return suppliers;
  } catch (err) {
    console.error('Error fetching supplier data:', err);
    return [];
  }
}

// Helper function to get payment data for user (customer debts)
async function getPaymentData(userId) {
  try {
    const payments = await Payment.find({ userId: userId });
    return payments;
  } catch (err) {
    console.error('Error fetching payment data:', err);
    return [];
  }
}

// Helper function to get payment out data for user (supplier debts)
async function getPaymentOutData(userId) {
  try {
    const payments = await PaymentOut.find({ userId: userId });
    return payments;
  } catch (err) {
    console.error('Error fetching payment out data:', err);
    return [];
  }
}

// Helper function to format account data for AI response
function formatAccountData(accounts) {
  if (accounts.length === 0) {
    return "I couldn't find any accounts in the system.";
  }
  
  if (accounts.length === 1) {
    const account = accounts[0];
    return `The account "${account.name}" at ${account.bank} has a balance of $${account.balance.toFixed(2)}.`;
  }
  
  let response = `I found ${accounts.length} accounts:\n`;
  accounts.forEach(account => {
    response += `- ${account.name} at ${account.bank}: $${account.balance.toFixed(2)}\n`;
  });
  
  // Calculate total balance
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  response += `\nTotal balance across all accounts: $${totalBalance.toFixed(2)}`;
  
  return response;
}

// Helper function to format product data for AI response
function formatProductData(products) {
  if (products.length === 0) {
    return "I couldn't find any products in the system.";
  }
  
  if (products.length === 1) {
    const product = products[0];
    return `Product: "${product.product_name}" - Price: $${product.price.toFixed(2)}, Quantity in stock: ${product.quantity}, Storing balance: ${product.storing_balance || 0}`;
  }
  
  // For multiple products, show a summary
  let response = `I found ${products.length} products in your inventory:\n`;
  
  // Show top 5 products with highest quantity
  const topProducts = [...products]
    .sort((a, b) => (b.quantity + (b.storing_balance || 0)) - (a.quantity + (a.storing_balance || 0)))
    .slice(0, 5);
  
  response += "\nTop products by total stock (quantity + storing balance):\n";
  topProducts.forEach(product => {
    const totalStock = product.quantity + (product.storing_balance || 0);
    response += `- ${product.product_name}: ${totalStock} units total (Quantity: ${product.quantity}, Storing: ${product.storing_balance || 0}) @ $${product.price.toFixed(2)} each\n`;
  });
  
  // Calculate total inventory value
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  response += `\nTotal inventory value (based on quantity): $${totalValue.toFixed(2)}`;
  
  return response;
}

// Helper function to format sales data for AI response
function formatSalesData(sales, timePeriod) {
  if (sales.length === 0) {
    return `I couldn't find any sales records${timePeriod !== 'all' ? ` for this ${timePeriod}` : ''}.`;
  }
  
  // Calculate sales statistics
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalPaid = sales.reduce((sum, sale) => sum + sale.paid, 0);
  const totalBalanceDue = sales.reduce((sum, sale) => sum + sale.balance_due, 0);
  
  let response = `Sales Summary${timePeriod !== 'all' ? ` for this ${timePeriod}` : ''}:\n`;
  response += `- Total sales transactions: ${totalSales}\n`;
  response += `- Total revenue: $${totalRevenue.toFixed(2)}\n`;
  response += `- Total amount paid: $${totalPaid.toFixed(2)}\n`;
  response += `- Total balance due: $${totalBalanceDue.toFixed(2)}\n`;
  
  // Find top selling products
  const productSales = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (productSales[item.product_name]) {
        productSales[item.product_name].quantity += item.qty;
        productSales[item.product_name].revenue += item.subtotal;
      } else {
        productSales[item.product_name] = {
          quantity: item.qty,
          revenue: item.subtotal
        };
      }
    });
  });
  
  // Sort by revenue and show top 3
  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b.revenue - a.revenue)
    .slice(0, 3);
  
  if (topProducts.length > 0) {
    response += "\nTop selling products:\n";
    topProducts.forEach(([name, data]) => {
      response += `- ${name}: ${data.quantity} units sold, $${data.revenue.toFixed(2)} revenue\n`;
    });
  }
  
  return response;
}

// Helper function to format purchase data for AI response
function formatPurchaseData(purchases, timePeriod) {
  if (purchases.length === 0) {
    return `I couldn't find any purchase records${timePeriod !== 'all' ? ` for this ${timePeriod}` : ''}.`;
  }
  
  // Calculate purchase statistics
  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const totalPaid = purchases.reduce((sum, purchase) => sum + purchase.paid, 0);
  const totalBalanceDue = purchases.reduce((sum, purchase) => sum + purchase.balance_due, 0);
  
  let response = `Purchase Summary${timePeriod !== 'all' ? ` for this ${timePeriod}` : ''}:\n`;
  response += `- Total purchase transactions: ${totalPurchases}\n`;
  response += `- Total purchase amount: $${totalAmount.toFixed(2)}\n`;
  response += `- Total amount paid: $${totalPaid.toFixed(2)}\n`;
  response += `- Total balance due: $${totalBalanceDue.toFixed(2)}\n`;
  
  // Find most purchased products with actual names
  const productPurchases = {};
  purchases.forEach(purchase => {
    purchase.items.forEach(item => {
      const productKey = item.product_name || item.product_no || 'Unknown Product';
      if (productPurchases[productKey]) {
        productPurchases[productKey].quantity += item.qty;
        productPurchases[productKey].total += item.subtotal;
      } else {
        productPurchases[productKey] = {
          quantity: item.qty,
          total: item.subtotal,
          productNo: item.product_no
        };
      }
    });
  });
  
  // Sort by quantity and show top 3
  const topProducts = Object.entries(productPurchases)
    .sort(([,a], [,b]) => b.quantity - a.quantity)
    +slice(0, 3);
  
  if (topProducts.length > 0) {
    response += "\nMost purchased products:\n";
    topProducts.forEach(([productName, data]) => {
      response += `- ${productName}: ${data.quantity} units purchased, $${data.total.toFixed(2)} total\n`;
    });
  }
  
  return response;
}

// Helper function to format customer data for AI response
function formatCustomerData(customers) {
  if (customers.length === 0) {
    return "I couldn't find any customers in the system.";
  }
  
  if (customers.length === 1) {
    const customer = customers[0];
    return `Customer: "${customer.name}" - Phone: ${customer.phone || 'N/A'}, Balance: $${customer.bal.toFixed(2)}`;
  }
  
  let response = `I found ${customers.length} customers in the system:\n`;
  
  // Show customers with highest balances
  const topCustomers = [...customers]
    .sort((a, b) => b.bal - a.bal)
    .slice(0, 5);
  
  response += "\nCustomers with highest balances:\n";
  topCustomers.forEach(customer => {
    response += `- ${customer.name}: $${customer.bal.toFixed(2)}\n`;
  });
  
  // Calculate total customer debt
  const totalDebt = customers.reduce((sum, customer) => sum + customer.bal, 0);
  response += `\nTotal customer debt: $${totalDebt.toFixed(2)}`;
  
  return response;
}

// Helper function to format supplier data for AI response
function formatSupplierData(suppliers) {
  if (suppliers.length === 0) {
    return "I couldn't find any suppliers in the system.";
  }
  
  if (suppliers.length === 1) {
    const supplier = suppliers[0];
    return `Supplier: "${supplier.name}" - Phone: ${supplier.phone || 'N/A'}, Balance: $${supplier.balance.toFixed(2)}`;
  }
  
  let response = `I found ${suppliers.length} suppliers in the system:\n`;
  
  // Show suppliers with highest balances
  const topSuppliers = [...suppliers]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);
  
  response += "\nSuppliers with highest balances:\n";
  topSuppliers.forEach(supplier => {
    response += `- ${supplier.name}: $${supplier.balance.toFixed(2)}\n`;
  });
  
  // Calculate total supplier debt
  const totalDebt = suppliers.reduce((sum, supplier) => sum + supplier.balance, 0);
  response += `\nTotal amount owed to suppliers: $${totalDebt.toFixed(2)}`;
  
  return response;
}

// Helper function to format debt data for AI response
function formatDebtData(payments, paymentOuts, customers, suppliers) {
  let response = "Debt Summary:\n";
  
  // Customer debts (amounts they owe you)
  const totalCustomerDebt = customers.reduce((sum, customer) => sum + customer.bal, 0);
  response += `- Amounts owed by customers: $${totalCustomerDebt.toFixed(2)}\n`;
  
  // Supplier debts (amounts you owe them)
  const totalSupplierDebt = suppliers.reduce((sum, supplier) => sum + supplier.balance, 0);
  response += `- Amounts owed to suppliers: $${totalSupplierDebt.toFixed(2)}\n`;
  
  // Net position
  const netPosition = totalCustomerDebt - totalSupplierDebt;
  response += `- Net debt position: $${netPosition.toFixed(2)} ${netPosition >= 0 ? '(you are owed)' : '(you owe)'}`;
  
  return response;
}

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  const { messages, language = 'english' } = req.body; // Extract language from request body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: 'Messages array required.' });
  }
  
  // Log for debugging
  console.log('AI Chat Request:', { 
    userId: req.user?.id, 
    messages: messages.map(m => `${m.role}: ${m.content}`),
    language: language
  });
  
  // Check if this is a query about internal data
  if (isInternalDataQuery(messages)) {
    try {
      console.log('Processing internal data query with enhanced AI');
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      const content = lastUserMessage.content;
      
      // Use enhanced intent analysis
      const intentAnalysis = analyzeQueryIntent(content);
      const timeContext = extractTimeContext(content);
      const queryInfo = extractQueryInfo(content.toLowerCase());
      
      console.log('Enhanced analysis:', { 
        intent: intentAnalysis.intent, 
        confidence: intentAnalysis.confidence,
        timeContext,
        queryInfo 
      });
      
      // Get conversation context and business alerts
      const [conversationContext, businessAlerts, insights] = await Promise.all([
        getConversationContext(req.user.id, req.sessionID || 'default'),
        generateBusinessAlerts(req.user.id),
        getBusinessInsights(req.user.id, intentAnalysis.intent, timeContext)
      ]);
      
      // Format alerts for AI context
      const alertsSummary = formatAlertsForAI(businessAlerts);
      
      let dataResponse = "";
      let specificData = null;
      
      // Handle specific data requests based on intent
      switch (intentAnalysis.intent) {
        case 'accounts':
        case 'financial':
          specificData = await getAccountData(req.user.id, queryInfo.accountName);
          dataResponse = formatAccountData(specificData);
          // Track data access
          await trackDataAccess(req.user.id, req.sessionID || 'default', 'accounts');
          break;
          
        case 'inventory':
          specificData = await getProductData(req.user.id, queryInfo.productName);
          dataResponse = formatProductData(specificData);
          await trackDataAccess(req.user.id, req.sessionID || 'default', 'products');
          break;
          
        case 'sales':
          specificData = await getSalesWithTimeFilter(req.user.id, timeContext);
          dataResponse = formatSalesData(specificData, timeContext);
          await trackDataAccess(req.user.id, req.sessionID || 'default', 'sales');
          break;
          
        case 'purchases':
          specificData = await getPurchasesWithTimeFilter(req.user.id, timeContext);
          dataResponse = formatPurchaseData(specificData, timeContext);
          await trackDataAccess(req.user.id, req.sessionID || 'default', 'purchases');
          break;
          
        case 'customers':
          specificData = await getCustomerData(req.user.id);
          dataResponse = formatCustomerData(specificData);
          await trackDataAccess(req.user.id, req.sessionID || 'default', 'customers');
          break;
          
        case 'suppliers':
          specificData = await getSupplierData(req.user.id);
          dataResponse = formatSupplierData(specificData);
          await trackDataAccess(req.user.id, req.sessionID || 'default', 'suppliers');
          break;
          
        case 'reports':
        case 'analytics':
          // Generate advanced report based on query
          if (content.toLowerCase().includes('sales')) {
            try {
              const reportData = await generateAdvancedSalesReport({
                user: { id: req.user.id },
                query: { includeItems: true, includeComparisons: true }
              });
              dataResponse = `Advanced Sales Analytics:\n${JSON.stringify(reportData.summary, null, 2)}`;
            } catch (err) {
              console.error('Error generating sales report:', err);
              dataResponse = formatEnhancedResponse(null, intentAnalysis.intent, insights);
            }
          } else {
            dataResponse = formatEnhancedResponse(null, intentAnalysis.intent, insights);
          }
          break;
          
        default:
          // Use enhanced formatting with business insights
          dataResponse = formatEnhancedResponse(specificData, intentAnalysis.intent, insights);
      }
      
      console.log('Enhanced data response generated');
      
      // Create enhanced context for AI
      const enhancedMessages = [...messages];
      const lastUserMessageIndex = enhancedMessages.map((m, i) => m.role === 'user' ? i : -1).filter(i => i !== -1).pop();
      
      if (lastUserMessageIndex !== undefined) {
        // Add language instruction to the context prompt
        const languageInstruction = language === 'somali' 
          ? 'IMPORTANT: Respond ONLY in Somali language. Translate all responses to Somali.' 
          : 'IMPORTANT: Respond ONLY in English language.';
          
        const contextPrompt = `You are KaydPal AI, an intelligent business management assistant with memory of past conversations.

${languageInstruction}

User Query Intent: ${intentAnalysis.intent} (confidence: ${(intentAnalysis.confidence * 100).toFixed(1)}%)
Time Context: ${timeContext}

Conversation Context:
${conversationContext ? `Recent topics: ${conversationContext.topQueries.join(', ')}
User preferences: ${JSON.stringify(conversationContext.userPreferences)}` : 'New conversation'}

Current Business Data & Insights:
${dataResponse}

${alertsSummary ? `Current Business Alerts:
${alertsSummary}` : ''}

Instructions:
- Provide conversational, helpful responses with context awareness
- Reference previous conversations when relevant
- Use the business data to answer specifically
- Include actionable insights and proactive recommendations
- Mention critical alerts if they relate to the query
- Keep responses concise but informative
- DO NOT use markdown formatting (no asterisks, no bold text)
- Use proper paragraphing with line breaks for better readability
- Structure responses with clear sections when providing multiple pieces of information
- Use simple dashes for lists, not markdown bullets
- If asked about trends or analysis, provide data-driven insights
- Format numbers clearly with currency symbols where appropriate

Original Question: ${content}`;
        
        enhancedMessages[lastUserMessageIndex] = {
          role: 'user',
          content: contextPrompt
        };
      }
      
      console.log('Enhanced messages:', enhancedMessages.map(m => `${m.role}: ${m.content}`));
      
      // Call the AI with the enhanced context
      const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'https://kaydpal.com',
          'X-Title': 'KaydPal Support Chat'
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'openai/gpt-3.5-turbo',
          messages: enhancedMessages.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      const data = await openRouterRes.json();
      
      if (!openRouterRes.ok) {
        console.error('AI API error:', data);
        return res.status(500).json({ 
          success: false, 
          message: data.error?.message || 'AI service error',
          error: data.error
        });
      }
      
      const aiResponse = data.choices[0].message.content;
      console.log('AI Response:', aiResponse);
      
      // Track data access and update conversation history
      await Promise.all([
        trackDataAccess(req.user.id, req.sessionID || 'default', intentAnalysis.intent),
        updateConversationHistory(req.user.id, req.sessionID || 'default', {
          userQuery: content,
          intent: intentAnalysis.intent,
          confidence: intentAnalysis.confidence,
          aiResponse: aiResponse,
          dataUsed: intentAnalysis.intent
        })
      ]);
      
      res.json({ 
        success: true, 
        aiMessage: aiResponse,
        model: data.model || process.env.AI_MODEL || 'openai/gpt-3.5-turbo',
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence,
        alerts: businessAlerts.critical.length + businessAlerts.warning.length
      });
    } catch (err) {
      console.error('Server error in AI chat:', err);
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
    return;
  }
  
  console.log('Processing external query');
  
  // For non-internal queries, use the original implementation but add language instruction
  try {
    // Add language instruction to the last user message
    const enhancedMessages = [...messages];
    const lastUserMessageIndex = enhancedMessages.map((m, i) => m.role === 'user' ? i : -1).filter(i => i !== -1).pop();
    
    if (lastUserMessageIndex !== undefined) {
      const languageInstruction = language === 'somali' 
        ? 'IMPORTANT: Respond ONLY in Somali language. Translate all responses to Somali.' 
        : 'IMPORTANT: Respond ONLY in English language.';
        
      enhancedMessages[lastUserMessageIndex] = {
        role: 'user',
        content: `${languageInstruction}\n\n${enhancedMessages[lastUserMessageIndex].content}`
      };
    }
    
    // Using OpenRouter instead of OpenAI directly
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'https://kaydpal.com', // Your site URL
        'X-Title': 'KaydPal Support Chat'  // Your app name
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'openai/gpt-3.5-turbo', // Default model
        messages: enhancedMessages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    const data = await openRouterRes.json();
    
    if (!openRouterRes.ok) {
      console.error('AI API error:', data);
      return res.status(500).json({ 
        success: false, 
        message: data.error?.message || 'AI service error',
        error: data.error
      });
    }
    
    res.json({ 
      success: true, 
      aiMessage: data.choices[0].message.content,
      model: data.model || process.env.AI_MODEL || 'openai/gpt-3.5-turbo'
    });
  } catch (err) {
    console.error('Server error in AI chat:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/ai/dashboard - Proactive business insights dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    console.log('Generating AI dashboard for user:', req.user.id);
    
    // Get comprehensive business insights and alerts
    const [businessAlerts, insights, conversationContext] = await Promise.all([
      generateBusinessAlerts(req.user.id),
      getBusinessInsights(req.user.id, 'analytics', 'thisMonth'),
      getConversationContext(req.user.id, req.sessionID || 'default')
    ]);
    
    // Generate proactive recommendations
    const proactiveInsights = {
      summary: {
        totalAlerts: businessAlerts.critical.length + businessAlerts.warning.length,
        criticalAlerts: businessAlerts.critical.length,
        recommendations: businessAlerts.recommendations.length,
        ...insights.summary
      },
      alerts: businessAlerts,
      insights: insights,
      conversationSummary: {
        frequentQueries: conversationContext?.topQueries || [],
        userPreferences: conversationContext?.userPreferences || {},
        lastActivity: conversationContext?.lastAccessedData || {}
      },
      quickActions: [
        { action: 'Check low stock items', query: 'show me products with low stock' },
        { action: 'Review customer debts', query: 'which customers owe money' },
        { action: 'Analyze sales performance', query: 'how are sales this month' },
        { action: 'Check cash flow', query: 'what is my account balance' }
      ]
    };
    
    res.json({
      success: true,
      dashboard: proactiveInsights
    });
  } catch (err) {
    console.error('Error generating AI dashboard:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/ai/alerts - Get current business alerts
router.get('/alerts', auth, async (req, res) => {
  try {
    const alerts = await generateBusinessAlerts(req.user.id);
    res.json({
      success: true,
      alerts: alerts
    });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
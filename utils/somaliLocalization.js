/**
 * Somali Localization System for KaydPal
 * Provides natural, fluent Somali responses for common business queries
 */

// Somali templates for different business scenarios
const somaliTemplates = {
  // Welcome messages
  welcome: "Salaan! Waxaan ahay caawiyahaaga AI ee KaydPal. Waxaan kuu caawin karaa su'aalaha ku saabsan xogta ganacsigaaga, sida xisaabada, badeecadaha, iibka, macaamiilka, alaab-qeybiyeyaasha iyo daynka. Tijaabi su'aal ku saabsan \"Hadhaagga xisaabta?\", \"Immisa badeecad ayaan kaydsanayaa?\", ama \"Iibka bishan maxaa leh?\"",

  // Account balance responses
  accountBalance: {
    single: "Xisaabta {{name}} ee {{bank}} wuxuu leeyahay hadhaag ${{balance}}.",
    multiple: "Waxaan helay {{count}} xisaab oo aad leedahay:\n{{accounts}}\n\nWadarta hadhaagga xisaabada oo dhan: ${{totalBalance}}"
  },

  // Product responses
  products: {
    none: "Ma helin badeecad kasto nidaamka.",
    single: "Badeecad: \"{{name}}\" - Qiimaha: ${{price}}, Tirada kaydsan: {{quantity}}, Tirada bakooran: {{storing}}",
    multiple: "Waxaan helay {{count}} badeecad oo aad leedahay kaydkaaga:\n\nBadeecadaha ugu horreeya tirada kaydsan:\n{{topProducts}}\n\nQiimaha kaydka guud (ku salaysan tirada): ${{totalValue}}"
  },

  // Sales responses
  sales: {
    none: "Ma helin diiwaan iibkeed {{timePeriod}}.",
    summary: "Koobiga Iibka {{timePeriod}}:\n- Wadarta iibka: {{totalSales}}\n- Dakhliga guud: ${{totalRevenue}}\n- Lacagta la bixiyay: ${{totalPaid}}\n- Lacagta daynta kuma maqan: ${{totalBalanceDue}}\n\nBadeecadaha ugu iibiyata:\n{{topProducts}}"
  },

  // Purchase responses
  purchases: {
    none: "Ma helin diiwaan iibsasho {{timePeriod}}.",
    summary: "Koobiga Iibsashada {{timePeriod}}:\n- Wadarta iibsashada: {{totalPurchases}}\n- Tirada iibsashada: ${{totalAmount}}\n- Lacagta la bixiyay: ${{totalPaid}}\n- Lacagta daynta kuma maqan: ${{totalBalanceDue}}\n\nBadeecadaha ugu iibsata:\n{{topProducts}}"
  },

  // Customer responses
  customers: {
    none: "Ma helin macmiil kasto nidaamka.",
    single: "Macmiilka: \"{{name}}\" - Telifoonka: {{phone}}, Lacagta daynta kuma maqan: ${{balance}}",
    multiple: "Waxaan helay {{count}} macmiil oo aad leedahay nidaamka:\n\nMacmiilasha lacagta ugu badan daynta kuma maqan:\n{{topCustomers}}\n\nWadarta lacagta daynta kuma maqan: ${{totalDebt}}"
  },

  // Supplier responses
  suppliers: {
    none: "Ma helin alaab-qeybiye kasto nidaamka.",
    single: "Alaab-qeybiye: \"{{name}}\" - Telifoonka: {{phone}}, Lacagta daynta kuma maqan: ${{balance}}",
    multiple: "Waxaan helay {{count}} alaab-qeybiye oo aad leedahay nidaamka:\n\nAlaab-qeybiyasha lacagta ugu badan daynta kuma maqan:\n{{topSuppliers}}\n\nWadarta lacagta daynta kuma maqan: ${{totalDebt}}"
  },

  // Debt summary
  debtSummary: "Koobiga Daynka:\n- Lacagta macaamiilku daynta kuma maqan: ${{customerDebt}}\n- Lacagta aad alaab-qeybiyasha ku daynta kuma maqan: ${{supplierDebt}}\n- Xaaladda daynka guud: ${{netPosition}} {{positionText}}",

  // Generic responses
  languageSwitch: "Waxaan ku jawaabi doonaa af Soomaali.",
  tryThese: "Tijaabi: \"Hadhaagga xisaabta?\", \"Immisa badeecad ayaan kaydsanayaa?\", \"Iibka bishan maxaa leh?\""
};

// Somali formatting functions
const somaliFormatters = {
  formatAccountList(accounts) {
    return accounts.map(acc => `- ${acc.name} ee ${acc.bank}: $${acc.balance.toFixed(2)}`).join('\n');
  },

  formatProductList(products) {
    return products.map(prod => {
      const totalStock = prod.quantity + (prod.storing_balance || 0);
      return `- ${prod.product_name}: ${totalStock} badeecad oo wadajir ah (Tirada: ${prod.quantity}, Bakoor: ${prod.storing_balance || 0}) @ $${prod.price.toFixed(2)} mid kasta`;
    }).join('\n');
  },

  formatSalesProductList(productSales) {
    return Object.entries(productSales)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 3)
      .map(([name, data]) => `- ${name}: ${data.quantity} badeecad oo la iibiyay, $${data.revenue.toFixed(2)} dakhliga`)
      .join('\n');
  },

  formatPurchaseProductList(productPurchases) {
    return Object.entries(productPurchases)
      .sort(([,a], [,b]) => b.quantity - a.quantity)
      .slice(0, 3)
      .map(([name, data]) => `- ${name}: ${data.quantity} badeecad oo la iibsaday, $${data.total.toFixed(2)} wadajir`)
      .join('\n');
  },

  formatCustomerList(customers) {
    return customers.map(cust => `- ${cust.name}: $${cust.bal.toFixed(2)}`).join('\n');
  },

  formatSupplierList(suppliers) {
    return suppliers.map(sup => `- ${sup.name}: $${sup.balance.toFixed(2)}`).join('\n');
  }
};

// Function to generate natural Somali responses
function generateSomaliResponse(intent, data, timeContext = 'all') {
  const timePeriod = getTimePeriodText(timeContext);
  
  switch (intent) {
    case 'accounts':
    case 'financial':
      return formatAccountResponse(data, somaliTemplates.accountBalance);
      
    case 'inventory':
      return formatProductResponse(data, somaliTemplates.products);
      
    case 'sales':
      return formatSalesResponse(data, somaliTemplates.sales, timePeriod);
      
    case 'purchases':
      return formatPurchaseResponse(data, somaliTemplates.purchases, timePeriod);
      
    case 'customers':
      return formatCustomerResponse(data, somaliTemplates.customers);
      
    case 'suppliers':
      return formatSupplierResponse(data, somaliTemplates.suppliers);
      
    default:
      // For other intents, we'll still use the AI but with better prompting
      return null;
  }
}

// Helper functions for formatting responses
function formatAccountResponse(accounts, template) {
  if (accounts.length === 0) {
    return "Ma helin xisaab kasto nidaamka.";
  }
  
  if (accounts.length === 1) {
    const account = accounts[0];
    return template.single
      .replace("{{name}}", account.name)
      .replace("{{bank}}", account.bank)
      .replace("{{balance}}", account.balance.toFixed(2));
  }
  
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const accountList = somaliFormatters.formatAccountList(accounts);
  
  return template.multiple
    .replace("{{count}}", accounts.length)
    .replace("{{accounts}}", accountList)
    .replace("{{totalBalance}}", totalBalance.toFixed(2));
}

function formatProductResponse(products, template) {
  if (products.length === 0) {
    return template.none;
  }
  
  if (products.length === 1) {
    const product = products[0];
    return template.single
      .replace("{{name}}", product.product_name)
      .replace("{{price}}", product.price.toFixed(2))
      .replace("{{quantity}}", product.quantity)
      .replace("{{storing}}", product.storing_balance || 0);
  }
  
  // For multiple products, show a summary
  const topProducts = [...products]
    .sort((a, b) => (b.quantity + (b.storing_balance || 0)) - (a.quantity + (a.storing_balance || 0)))
    .slice(0, 5);
  
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const productList = somaliFormatters.formatProductList(topProducts);
  
  return template.multiple
    .replace("{{count}}", products.length)
    .replace("{{topProducts}}", productList)
    .replace("{{totalValue}}", totalValue.toFixed(2));
}

function formatSalesResponse(sales, template, timePeriod) {
  if (sales.length === 0) {
    return template.none.replace("{{timePeriod}}", timePeriod);
  }
  
  // Calculate sales statistics
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalPaid = sales.reduce((sum, sale) => sum + sale.paid, 0);
  const totalBalanceDue = sales.reduce((sum, sale) => sum + sale.balance_due, 0);
  
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
  
  const topProducts = somaliFormatters.formatSalesProductList(productSales);
  
  return template.summary
    .replace("{{timePeriod}}", timePeriod)
    .replace("{{totalSales}}", totalSales)
    .replace("{{totalRevenue}}", totalRevenue.toFixed(2))
    .replace("{{totalPaid}}", totalPaid.toFixed(2))
    .replace("{{totalBalanceDue}}", totalBalanceDue.toFixed(2))
    .replace("{{topProducts}}", topProducts);
}

function formatPurchaseResponse(purchases, template, timePeriod) {
  if (purchases.length === 0) {
    return template.none.replace("{{timePeriod}}", timePeriod);
  }
  
  // Calculate purchase statistics
  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const totalPaid = purchases.reduce((sum, purchase) => sum + purchase.paid, 0);
  const totalBalanceDue = purchases.reduce((sum, purchase) => sum + purchase.balance_due, 0);
  
  // Find most purchased products
  const productPurchases = {};
  purchases.forEach(purchase => {
    purchase.items.forEach(item => {
      const productKey = item.product_name || item.product_no || 'Badeecad aan la aqoon';
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
  
  const topProducts = somaliFormatters.formatPurchaseProductList(productPurchases);
  
  return template.summary
    .replace("{{timePeriod}}", timePeriod)
    .replace("{{totalPurchases}}", totalPurchases)
    .replace("{{totalAmount}}", totalAmount.toFixed(2))
    .replace("{{totalPaid}}", totalPaid.toFixed(2))
    .replace("{{totalBalanceDue}}", totalBalanceDue.toFixed(2))
    .replace("{{topProducts}}", topProducts);
}

function formatCustomerResponse(customers, template) {
  if (customers.length === 0) {
    return template.none;
  }
  
  if (customers.length === 1) {
    const customer = customers[0];
    return template.single
      .replace("{{name}}", customer.name)
      .replace("{{phone}}", customer.phone || 'N/A')
      .replace("{{balance}}", customer.bal.toFixed(2));
  }
  
  // Show customers with highest balances
  const topCustomers = [...customers]
    .sort((a, b) => b.bal - a.bal)
    .slice(0, 5);
  
  const totalDebt = customers.reduce((sum, customer) => sum + customer.bal, 0);
  const customerList = somaliFormatters.formatCustomerList(topCustomers);
  
  return template.multiple
    .replace("{{count}}", customers.length)
    .replace("{{topCustomers}}", customerList)
    .replace("{{totalDebt}}", totalDebt.toFixed(2));
}

function formatSupplierResponse(suppliers, template) {
  if (suppliers.length === 0) {
    return template.none;
  }
  
  if (suppliers.length === 1) {
    const supplier = suppliers[0];
    return template.single
      .replace("{{name}}", supplier.name)
      .replace("{{phone}}", supplier.phone || 'N/A')
      .replace("{{balance}}", supplier.balance.toFixed(2));
  }
  
  // Show suppliers with highest balances
  const topSuppliers = [...suppliers]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);
  
  const totalDebt = suppliers.reduce((sum, supplier) => sum + supplier.balance, 0);
  const supplierList = somaliFormatters.formatSupplierList(topSuppliers);
  
  return template.multiple
    .replace("{{count}}", suppliers.length)
    .replace("{{topSuppliers}}", supplierList)
    .replace("{{totalDebt}}", totalDebt.toFixed(2));
}

// Helper function to get time period text in Somali
function getTimePeriodText(timeContext) {
  const timePeriods = {
    'today': 'maanta',
    'yesterday': 'shalay',
    'thisWeek': 'usbuucan',
    'lastWeek': 'usbuucii hore',
    'thisMonth': 'bishaan',
    'lastMonth': 'bisha hore',
    'thisYear': 'sanadkan',
    'lastYear': 'sanadkii hore',
    'ytd': 'Sanadka ilaa hadda',
    'mtd': 'Bisha ilaa hada',
    'all': 'dhamaan'
  };
  
  return timePeriods[timeContext] || timePeriods['all'];
}

module.exports = {
  somaliTemplates,
  generateSomaliResponse,
  getTimePeriodText
};
# AI Chatbot Integration with Internal System Data

This document explains how the AI chatbot in KaydPal has been enhanced to access and provide information about internal system data, such as accounts, products, sales, purchases, customers, suppliers, and debts.

## Overview

The AI chatbot now has the capability to:
1. Detect when users are asking about internal business data
2. Access relevant data from the system
3. Provide accurate, real-time responses based on actual system data

## How It Works

### 1. Query Detection
The system analyzes user messages to determine if they're asking about internal data. Keywords that trigger internal data access include:
- **Account related**: "account balance", "how much money", "money in account", "my accounts"
- **Product related**: "products", "inventory", "stock levels", "product list", "storing balance"
- **Sales related**: "sales", "revenue", "transactions", "sold items"
- **Purchase related**: "purchases", "buy", "procurement", "purchase orders"
- **Customer related**: "customers", "client", "customer list"
- **Supplier related**: "suppliers", "vendor", "supplier list"
- **Debt/Credit related**: "debts", "credits", "amount owed", "money owed"

### 2. Data Retrieval
When an internal data query is detected:
1. The system extracts relevant information from the user's query (e.g., specific account names, time periods)
2. It retrieves the appropriate data from the database using the user's authentication context
3. The data is formatted in a way that's easy for the AI to understand and present

### 3. AI Response Enhancement
The retrieved data is added directly to the user's question as context, providing the AI with real information to generate an accurate response. The AI is instructed to provide responses in plain text without markdown formatting for better readability.

## Example Interactions

Users can now ask questions like:
- "What is my account balance?"
- "Show me all products in inventory"
- "How are my sales this month?"
- "What purchases have I made this week?"
- "List all customers"
- "Show suppliers"
- "What debts do I have?"
- "How many products do I have in stock?"
- "What were my sales like this week?"
- "Do I owe any money to suppliers?"

The AI will respond with actual data from the system in plain text format, such as:
- "The account 'Checking Account' at Bank of America has a balance of $5,420.75."
- "I found 15 products in your inventory. Top products by stock quantity: Product A: 100 units, Product B: 75 units. Total inventory value: $12,500.00"
- "Sales Summary for this month: Total sales transactions: 42, Total revenue: $25,420.50, Total amount paid: $22,150.75"
- "Purchase Summary for this week: Total purchase transactions: 8, Total purchase amount: $18,750.00, Total amount paid: $15,200.00"

## Technical Implementation

### Backend Changes
- Modified `/routes/ai.js` to include comprehensive internal data detection and retrieval functions
- Added database queries to fetch account, product, sales, purchase, customer, supplier, and payment information
- Enhanced product data retrieval to include accurate storing balances from StoreProduct model
- Improved purchase data handling with proper time-based filtering
- Enhanced the AI communication to include system context directly in the user's message
- Instructed the AI to provide responses in plain text without markdown formatting
- Added comprehensive logging for debugging purposes
- Implemented data type detection to provide relevant information based on query type

### Frontend Changes
- Updated the AI chat window with helpful hints for users
- Improved the initial message to guide users on what they can ask
- Made the interface more clearly identify as a KaydPal-specific assistant

## Security

- All data access is performed within the authenticated user context
- Users can only access their own data
- The system uses the existing authentication middleware to ensure security
- Data isolation is maintained across all tenants in the system

## Troubleshooting

If the AI is not providing account information and is giving generic responses instead, check:

1. **Server Restart**: Ensure the server has been restarted to pick up code changes

2. **Environment Variables**: Verify that the API keys are properly configured:
   - `OPENROUTER_API_KEY` or `OPENAI_API_KEY`
   - These should be set in your environment or `.env` file

3. **Authentication**: Ensure the authentication middleware is working correctly:
   - Check that `req.user.id` is properly populated
   - Verify that users can access their data through the regular dashboard

4. **Database Connection**: Verify that the database is accessible and contains data:
   - Check that data exists for the test user
   - Verify that the `userId` field in data models matches the authenticated user's ID

5. **Logging**: Check the server logs for debugging information:
   - Look for "Processing internal data query" messages
   - Check for any errors in the data retrieval process

## Future Enhancements

This system can be extended to support other types of internal data:
- Employee data
- Financial reports
- Expense tracking
- Store/warehouse information

Each extension would follow the same pattern:
1. Add keywords to the detection system
2. Create data retrieval functions
3. Format data for AI consumption
const mongoose = require('mongoose');

/**
 * AI Conversation Memory System
 * Stores conversation context and user preferences for better AI responses
 */

// Schema for AI conversation memory
const aiMemorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  conversationHistory: [{
    timestamp: { type: Date, default: Date.now },
    userQuery: String,
    intent: String,
    confidence: Number,
    aiResponse: String,
    dataUsed: String
  }],
  userPreferences: {
    preferredTimeContext: { type: String, default: 'thisMonth' },
    favoriteMetrics: [String],
    alertThresholds: {
      lowStock: { type: Number, default: 10 },
      highDebt: { type: Number, default: 1000 },
      lowCash: { type: Number, default: 500 }
    },
    responseStyle: { type: String, default: 'conversational' } // conversational, formal, brief
  },
  businessContext: {
    lastAccessedData: {
      accounts: Date,
      products: Date,
      sales: Date,
      purchases: Date,
      customers: Date,
      suppliers: Date
    },
    frequentQueries: [{
      query: String,
      count: { type: Number, default: 1 },
      lastUsed: { type: Date, default: Date.now }
    }]
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const AIMemory = mongoose.model('AIMemory', aiMemorySchema);

// Get or create AI memory for user session
async function getAIMemory(userId, sessionId = 'default') {
  try {
    let memory = await AIMemory.findOne({ userId, sessionId });
    
    if (!memory) {
      memory = new AIMemory({
        userId,
        sessionId,
        conversationHistory: [],
        userPreferences: {},
        businessContext: {
          lastAccessedData: {},
          frequentQueries: []
        }
      });
      await memory.save();
    }
    
    return memory;
  } catch (error) {
    console.error('Error getting AI memory:', error);
    return null;
  }
}

// Update conversation history
async function updateConversationHistory(userId, sessionId, conversationData) {
  try {
    const memory = await getAIMemory(userId, sessionId);
    if (!memory) return;

    // Add new conversation entry
    memory.conversationHistory.push({
      timestamp: new Date(),
      userQuery: conversationData.userQuery,
      intent: conversationData.intent,
      confidence: conversationData.confidence,
      aiResponse: conversationData.aiResponse,
      dataUsed: conversationData.dataUsed
    });

    // Keep only last 50 conversations to manage memory
    if (memory.conversationHistory.length > 50) {
      memory.conversationHistory = memory.conversationHistory.slice(-50);
    }

    // Update frequent queries
    updateFrequentQueries(memory, conversationData.userQuery);

    memory.updated_at = new Date();
    await memory.save();
  } catch (error) {
    console.error('Error updating conversation history:', error);
  }
}

// Update frequent queries tracking
function updateFrequentQueries(memory, query) {
  const normalizedQuery = query.toLowerCase().trim();
  const existingQuery = memory.businessContext.frequentQueries.find(
    q => q.query.toLowerCase() === normalizedQuery
  );

  if (existingQuery) {
    existingQuery.count += 1;
    existingQuery.lastUsed = new Date();
  } else {
    memory.businessContext.frequentQueries.push({
      query: normalizedQuery,
      count: 1,
      lastUsed: new Date()
    });
  }

  // Keep only top 20 frequent queries
  memory.businessContext.frequentQueries.sort((a, b) => b.count - a.count);
  memory.businessContext.frequentQueries = memory.businessContext.frequentQueries.slice(0, 20);
}

// Get conversation context for better AI responses
async function getConversationContext(userId, sessionId = 'default') {
  try {
    const memory = await getAIMemory(userId, sessionId);
    if (!memory) return null;

    // Get recent conversation history (last 5 exchanges)
    const recentHistory = memory.conversationHistory.slice(-5);
    
    // Get most frequent queries
    const topQueries = memory.businessContext.frequentQueries
      .slice(0, 5)
      .map(q => q.query);

    return {
      recentHistory,
      topQueries,
      userPreferences: memory.userPreferences,
      lastAccessedData: memory.businessContext.lastAccessedData
    };
  } catch (error) {
    console.error('Error getting conversation context:', error);
    return null;
  }
}

// Update user preferences based on interaction patterns
async function updateUserPreferences(userId, sessionId, preferences) {
  try {
    const memory = await getAIMemory(userId, sessionId);
    if (!memory) return;

    // Merge new preferences with existing ones
    memory.userPreferences = { ...memory.userPreferences, ...preferences };
    memory.updated_at = new Date();
    
    await memory.save();
  } catch (error) {
    console.error('Error updating user preferences:', error);
  }
}

// Track data access patterns
async function trackDataAccess(userId, sessionId, dataType) {
  try {
    const memory = await getAIMemory(userId, sessionId);
    if (!memory) return;

    memory.businessContext.lastAccessedData[dataType] = new Date();
    memory.updated_at = new Date();
    
    await memory.save();
  } catch (error) {
    console.error('Error tracking data access:', error);
  }
}

module.exports = {
  AIMemory,
  getAIMemory,
  updateConversationHistory,
  getConversationContext,
  updateUserPreferences,
  trackDataAccess
};

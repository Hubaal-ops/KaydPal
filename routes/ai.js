const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();
const fetch = require('node-fetch');

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: 'Messages array required.' });
  }
  try {
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
        messages: messages.map(m => ({ role: m.role, content: m.content })),
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

module.exports = router;
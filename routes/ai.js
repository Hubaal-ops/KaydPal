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
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7
      })
    });
    const data = await openaiRes.json();
    if (!openaiRes.ok) {
      return res.status(500).json({ success: false, message: data.error?.message || 'AI error' });
    }
    res.json({ success: true, aiMessage: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;

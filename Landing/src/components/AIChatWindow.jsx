import React, { useState, useRef, useEffect } from 'react';
import styles from './Support.module.css';

const AIChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setError('');
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setTyping(true);
    setLoading(true);
    try {
      // Example: OpenAI-compatible endpoint
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        setMessages([...newMessages, { role: 'assistant', content: data.choices[0].message.content }]);
      } else {
        setError(data.error?.message || 'AI error');
      }
    } catch (err) {
      setError('Network error.');
    }
    setTyping(false);
    setLoading(false);
  };

  return (
    <div className={styles.aiChatOverlay}>
      <div className={styles.aiChatWindow}>
        <div className={styles.aiChatHeader}>
          <span>AI Assistant</span>
          <button className={styles.aiChatClose} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.aiChatBody}>
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? styles.aiChatUser : styles.aiChatAssistant}>
              {msg.content}
            </div>
          ))}
          {typing && <div className={styles.aiChatTyping}>AI is typing...</div>}
          <div ref={chatEndRef} />
        </div>
        <form className={styles.aiChatForm} onSubmit={sendMessage}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className={styles.aiChatInput}
            autoFocus
          />
          <button type="submit" className={styles.aiChatSend} disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
        {error && <div className={styles.aiChatError}>{error}</div>}
      </div>
    </div>
  );
};

export default AIChatWindow;

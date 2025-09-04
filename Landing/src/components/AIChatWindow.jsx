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
  const [modelName, setModelName] = useState('');
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
      // Call our backend API instead of OpenAI directly
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      
      const data = await res.json();
      
      if (data.success && data.aiMessage) {
        setMessages([...newMessages, { role: 'assistant', content: data.aiMessage }]);
        if (data.model && data.model !== modelName) {
          setModelName(data.model);
        }
      } else {
        setError(data.message || 'Error communicating with AI assistant');
        console.error('AI chat error:', data);
      }
    } catch (err) {
      console.error('Network error in AI chat:', err);
      setError('Network error. Please check your connection and try again.');
    }
    setTyping(false);
    setLoading(false);
  };

  return (
    <div className={styles.aiChatOverlay}>
      <div className={styles.aiChatWindow}>
        <div className={styles.aiChatHeader}>
          <span>AI Assistant {modelName && <small>({modelName.split('/').pop()})</small>}</span>
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
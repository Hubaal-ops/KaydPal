import React, { useState, useRef, useEffect } from 'react';
import styles from './Support.module.css';

const AIChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(false);
  const [modelName, setModelName] = useState('');
  const [language, setLanguage] = useState('english'); // New state for language selection
  const chatEndRef = useRef(null);

  // Initialize with language-appropriate welcome message
  useEffect(() => {
    const welcomeMessage = language === 'somali' 
      ? 'Salaan! Waxaan ahay caawiyahaaga AI ee KaydPal. Waxaan kuu caawin karaa su\'aalaha ku saabsan xogta ganacsigaaga, sida xisaabada, badeecadaha, iibka, macaamiilka, alaab-qeybiyeyaasha iyo daynka. Tijaabi su\'aal ku saabsan "Hadhaagga xisaabta?", "Immisa badeecad ayaan kaydsanayaa?", ama "Iibka bishan maxaa leh?"'
      : 'Hi! I am your KaydPal AI assistant. I can help you with questions about your business data including accounts, products, sales, customers, suppliers, and debts. Try asking "What is my account balance?", "Show me my products", or "How are my sales this month?"';
    
    setMessages([
      { role: 'assistant', content: welcomeMessage }
    ]);
  }, [language]);

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
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          language: language // Send language preference to backend
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

  // Function to switch language
  const switchLanguage = (lang) => {
    setLanguage(lang);
    // Add a system message to inform user about language change
    const languageMessage = lang === 'somali' 
      ? 'Waxaan ku jawaabi doonaa af Soomaali.' 
      : 'I will respond in English language.';
    
    setMessages(prev => [...prev, { role: 'system', content: languageMessage }]);
  };

  return (
    <div className={styles.aiChatOverlay}>
      <div className={styles.aiChatWindow}>
        <div className={styles.aiChatHeader}>
          <span>KaydPal AI Assistant {modelName && <small>({modelName.split('/').pop()})</small>}</span>
          <button className={styles.aiChatClose} onClick={onClose}>&times;</button>
        </div>
        
        {/* Language Tabs */}
        <div className={styles.languageTabs}>
          <button 
            className={`${styles.languageTab} ${language === 'english' ? styles.activeTab : ''}`}
            onClick={() => switchLanguage('english')}
          >
            English
          </button>
          <button 
            className={`${styles.languageTab} ${language === 'somali' ? styles.activeTab : ''}`}
            onClick={() => switchLanguage('somali')}
          >
            Somali
          </button>
        </div>
        
        <div className={styles.aiChatBody}>
          {messages.filter(msg => msg.role !== 'system').map((msg, i) => (
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
            placeholder={language === 'somali' ? "Weydiiso wax ku saabsan ganacsigaaga..." : "Ask about your business data..."}
            disabled={loading}
            className={styles.aiChatInput}
            autoFocus
          />
          <button type="submit" className={styles.aiChatSend} disabled={loading || !input.trim()}>
            {language === 'somali' ? 'Dir' : 'Send'}
          </button>
        </form>
        {error && <div className={styles.aiChatError}>{error}</div>}
        <div className={styles.aiChatHint}>
          {language === 'somali' 
            ? 'Tijaabi: "Hadhaagga xisaabta?", "Immisa badeecad ayaan kaydsanayaa?", "Iibka bishan maxaa leh?"'
            : 'Try: "What\'s my account balance?", "Show products", "Sales this month"'}
        </div>
      </div>
    </div>
  );
};

export default AIChatWindow;
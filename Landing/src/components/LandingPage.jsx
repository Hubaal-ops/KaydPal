import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './LandingPage.css';

function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  const handleSmoothScroll = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const features = [
    { 
      title: "Smart Analytics", 
      description: "Real-time insights into your business performance", 
      icon: "📊" 
    },
    { 
      title: "Multi-Store Management", 
      description: "Manage multiple locations from one dashboard", 
      icon: "🏪" 
    },
    { 
      title: "Automated Workflows", 
      description: "Streamline operations with intelligent automation", 
      icon: "⚡" 
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <motion.div 
            className="hero-content"
            initial="initial"
            animate="animate"
            variants={staggerChildren}
          >
            <motion.div className="hero-badge" variants={fadeInUp}>
              <span className="badge-text">✨ Trusted by 10,000+ businesses</span>
            </motion.div>
            
            <motion.h1 className="hero-title" variants={fadeInUp}>
              Business management made simple
            </motion.h1>
            
            <motion.p className="hero-subtitle" variants={fadeInUp}>
              All-in-one platform for inventory, sales, and financial management.
            </motion.p>
            
            <motion.div className="hero-actions" variants={fadeInUp}>
              <Link to="/register" className="btn-primary">
                Get started for free
              </Link>
              <Link to="/demo" className="btn-secondary">
                View demo
              </Link>
            </motion.div>
            
            <motion.div className="hero-stats" variants={fadeInUp}>
              <div className="stat">
                <div className="stat-value">10k+</div>
                <div className="stat-label">Active users</div>
              </div>
              <div className="stat">
                <div className="stat-value">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
              <div className="stat">
                <div className="stat-value">4.9/5</div>
                <div className="stat-label">User rating</div>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="app-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="preview-title">KaydPal Dashboard</div>
              </div>
              
              <div className="preview-content">
                <div className="preview-sidebar">
                  <div className="nav-item active">📊 Dashboard</div>
                  <div className="nav-item">📦 Inventory</div>
                  <div className="nav-item">💰 Finance</div>
                  <div className="nav-item">📈 Analytics</div>
                  <div className="nav-item">👥 Team</div>
                </div>
                
                <div className="preview-main">
                  <div className="metric-cards">
                    <div className="metric-card">
                      <div className="metric-label">Revenue</div>
                      <div className="metric-value">$24,500</div>
                      <div className="metric-change positive">+12%</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Orders</div>
                      <div className="metric-value">1,247</div>
                      <div className="metric-change positive">+8%</div>
                    </div>
                  </div>
                  
                  <div className="chart-area">
                    <div className="chart-header">
                      <div className="chart-title">Sales Overview</div>
                    </div>
                    <div className="simple-chart">
                      {[...Array(7)].map((_, i) => (
                        <div 
                          key={i} 
                          className="chart-bar"
                          style={{ 
                            height: `${30 + Math.random() * 40}%`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Everything you need</h2>
            <p>Simple tools to manage your business effectively</p>
          </motion.div>
          
          <motion.div 
            className="features-grid"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.div className="feature-item" variants={fadeInUp}>
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
              </div>
              <h3>Inventory Management</h3>
              <p>Track stock levels and manage suppliers</p>
            </motion.div>
            
            <motion.div className="feature-item" variants={fadeInUp}>
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <h3>Financial Reports</h3>
              <p>Generate detailed financial insights</p>
            </motion.div>
            
            <motion.div className="feature-item" variants={fadeInUp}>
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                </svg>
              </div>
              <h3>Sales Management</h3>
              <p>Streamline your sales processes</p>
            </motion.div>
            
            <motion.div className="feature-item" variants={fadeInUp}>
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"/>
                </svg>
              </div>
              <h3>Analytics</h3>
              <p>Real-time business insights</p>
            </motion.div>
            
            <motion.div className="feature-item" variants={fadeInUp}>
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                </svg>
              </div>
              <h3>Team Collaboration</h3>
              <p>Manage teams and permissions</p>
            </motion.div>
            
            <motion.div className="feature-item" variants={fadeInUp}>
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <h3>Automation</h3>
              <p>Automate repetitive workflows</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Simple, transparent pricing</h2>
            <p>Start free and scale as you grow. No hidden fees, no surprises.</p>
          </motion.div>
          
          <motion.div 
            className="pricing-grid"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.div className="pricing-card" variants={fadeInUp}>
              <div className="plan-name">Starter</div>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">29</span>
                <span className="period">/month</span>
              </div>
              <div className="plan-description">For small businesses</div>
              <Link to="/register" className="plan-button">Get started</Link>
            </motion.div>

            <motion.div className="pricing-card featured" variants={fadeInUp}>
              <div className="plan-badge">Popular</div>
              <div className="plan-name">Professional</div>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">79</span>
                <span className="period">/month</span>
              </div>
              <div className="plan-description">For growing businesses</div>
              <Link to="/register" className="plan-button primary">Get started</Link>
            </motion.div>

            <motion.div className="pricing-card" variants={fadeInUp}>
              <div className="plan-name">Enterprise</div>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">199</span>
                <span className="period">/month</span>
              </div>
              <div className="plan-description">For large organizations</div>
              <button className="plan-button">Contact sales</button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2>Ready to get started?</h2>
            <p>Join thousands of businesses using KaydPal to manage their operations.</p>
            
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary">
                Start free trial
              </Link>
              <Link to="/demo" className="btn-secondary">
                Schedule demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <motion.div 
            className="contact-content"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="contact-info">
              <h2>Get in Touch</h2>
              <p>Have questions about KaydPal? Our team is here to help you find the perfect solution for your business needs.</p>
              
              <div className="contact-methods">
                <motion.div 
                  className="contact-method"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Email Support</h4>
                    <p>support@kaydpal.com</p>
                    <span>Response within 4 hours</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="contact-method"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Live Chat</h4>
                    <p>Available 24/7</p>
                    <span>Instant response</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="contact-method"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Phone Support</h4>
                    <p>+1 (555) 123-KAYD</p>
                    <span>Mon-Fri, 9AM-6PM EST</span>
                  </div>
                </motion.div>
              </div>
              
              <div className="contact-badges">
                <div className="badge">
                  <span className="badge-icon">🏆</span>
                  <span>Award-winning support</span>
                </div>
                <div className="badge">
                  <span className="badge-icon">🔒</span>
                  <span>SOC 2 Type II Certified</span>
                </div>
              </div>
            </div>
            
            <motion.div 
              className="contact-form"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h3>Send us a Message</h3>
              <form>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" placeholder="John" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" placeholder="Doe" required />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" name="email" placeholder="john@company.com" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input type="text" id="company" name="company" placeholder="Your Company" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">How can we help?</label>
                  <select id="subject" name="subject" required>
                    <option value="">Select a topic</option>
                    <option value="demo">Request a Demo</option>
                    <option value="pricing">Pricing Questions</option>
                    <option value="technical">Technical Support</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows="4" 
                    placeholder="Tell us more about your business needs..." 
                    required
                  ></textarea>
                </div>
                
                <button type="submit" className="btn-primary btn-full">
                  <span>Send Message</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>KaydPal</h3>
              <p>Business management made simple.</p>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Discord">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="footer-links">
              <div className="footer-section">
                <h4>Product</h4>
                <button onClick={() => handleSmoothScroll('features')} className="footer-link">Features</button>
                <button onClick={() => handleSmoothScroll('pricing')} className="footer-link">Pricing</button>
                <a href="/downloads" className="footer-link">Downloads</a>
              </div>
              
              <div className="footer-section">
                <h4>Resources</h4>
                <a href="/docs" className="footer-link">Docs</a>
                <a href="/blog" className="footer-link">Blog</a>
                <a href="/faqs" className="footer-link">FAQs</a>
                <a href="/changelog" className="footer-link">Changelog</a>
              </div>
              
              <div className="footer-section">
                <h4>Legal</h4>
                <a href="/terms" className="footer-link">Terms of Service</a>
                <a href="/privacy" className="footer-link">Privacy Policy</a>
              </div>
              
              <div className="footer-section">
                <h4>Connect</h4>
                <button onClick={() => handleSmoothScroll('contact')} className="footer-link">Contact <span className="arrow">↗</span></button>
                <a href="/forum" className="footer-link">Forum</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 KaydPal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default LandingPage; 
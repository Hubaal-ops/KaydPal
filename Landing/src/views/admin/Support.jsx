import React, { useState } from 'react';
import styles from './Support.module.css';
import { Mail, MessageSquare, HelpCircle, FileText, AlertCircle, Phone, Send } from 'lucide-react';

const Support = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking on the "Forgot Password" link on the login page. Follow the instructions sent to your email to set a new password.'
    },
    {
      question: 'How can I update my account information?',
      answer: 'You can update your account information by going to the Profile section in your account settings. Make sure to save your changes after updating.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers. You can view all available payment methods during the checkout process.'
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can reach our customer support team 24/7 through the contact form on this page, or by emailing support@kaydpal.com. We typically respond within 24 hours.'
    },
    {
      question: 'Is there a mobile app available?',
      answer: 'Yes, our mobile app is available for both iOS and Android devices. You can download it from the App Store or Google Play Store.'
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    // Show success message
    alert('Your message has been sent! We\'ll get back to you soon.');
  };

  return (
    <div className={styles.support}>
      <header className={styles.header}>
        <h1 className={styles.title}>Support Center</h1>
        <p className={styles.description}>
          Get help with your account, find answers to common questions, or contact our support team.
        </p>
      </header>

      <div className={styles.supportGrid}>
        <div className={styles.supportCard}>
          <div className={`${styles.cardIcon} ${styles.primary}`}>
            <MessageSquare size={24} />
          </div>
          <h3 className={styles.cardTitle}>Chat with us</h3>
          <p className={styles.cardDescription}>
            Our support team is available 24/7 to help with any questions or issues you might have.
          </p>
          <button className={`${styles.secondaryButton} ${styles.withIcon}`}>
            <MessageSquare size={16} /> Start Chat
          </button>
        </div>

        <div className={styles.supportCard}>
          <div className={`${styles.cardIcon} ${styles.success}`}>
            <Mail size={24} />
          </div>
          <h3 className={styles.cardTitle}>Email us</h3>
          <p className={styles.cardDescription}>
            Send us an email and we'll get back to you as soon as possible.
          </p>
          <a href="mailto:support@kaydpal.com" className={`${styles.secondaryButton} ${styles.withIcon}`}>
            <Mail size={16} /> support@kaydpal.com
          </a>
        </div>

        <div className={styles.supportCard}>
          <div className={`${styles.cardIcon} ${styles.warning}`}>
            <HelpCircle size={24} />
          </div>
          <h3 className={styles.cardTitle}>Help Center</h3>
          <p className={styles.cardDescription}>
            Browse our knowledge base for answers to frequently asked questions.
          </p>
          <button className={`${styles.secondaryButton} ${styles.withIcon}`}>
            <HelpCircle size={16} /> Visit Help Center
          </button>
        </div>
      </div>

      <div className={styles.contactSection}>
        <h2 className={styles.sectionTitle}>Contact Us</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className={styles.formControl}
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.formControl}
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              className={styles.formControl}
              value={formData.subject}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              className={`${styles.formControl} ${styles.textarea}`}
              value={formData.message}
              onChange={handleInputChange}
              required
            ></textarea>
          </div>
          
          <button type="submit" className={styles.primaryButton}>
            <Send size={16} style={{ marginRight: '8px' }} /> Send Message
          </button>
        </form>
      </div>

      <div className={styles.faqSection}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <div key={index} className={styles.faqItem}>
              <button 
                className={`${styles.faqQuestion} ${activeFaq === index ? 'active' : ''}`}
                onClick={() => toggleFaq(index)}
              >
                {faq.question}
              </button>
              <div 
                className={`${styles.faqAnswer} ${activeFaq === index ? styles.show : ''}`}
              >
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Support;
import React, { useState } from 'react';
import { register } from '../../../APIs/auth';
import { Link } from 'react-router-dom';
import './Auth.css';

function RegisterForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      const [errors, setErrors] = useState({});
      const [success, setSuccess] = useState(null);
    
      const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
      };
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccess(null);
    
        // Password confirmation validation
        if (formData.password !== formData.confirmPassword) {
          setErrors({ confirmPassword: 'Passwords do not match' });
          return;
        }
    
        try {
          await register(formData);
          setSuccess('Registration successful! You can now log in.');
          setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        } catch (err) {
            if (err.errors) {
                const newErrors = {};
                err.errors.forEach(e => {
                    newErrors[e.field] = e.message;
                });
                setErrors(newErrors);
            } else {
                setErrors({ form: err.message });
            }
        }
      };

  return (
    <div className="auth-container">
      <div className="auth-form-card">
        <h3>Create an Account</h3>
        {errors.form && <p className="error-message">{errors.form}</p>}
        {success && <p className="success-message">{success}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
           
            <input type="text" id="register-name" name="name" placeholder="Enter your full name" required value={formData.name} onChange={handleChange} />
            {errors.name && <p className="field-error-message">{errors.name}</p>}
          </div>
          <div className="form-group">
      
            <input type="email" id="register-email" name="email" placeholder="Enter your email" required value={formData.email} onChange={handleChange} />
            {errors.email && <p className="field-error-message">{errors.email}</p>}
          </div>
          <div className="form-group">
            
            <input type="password" id="register-password" name="password" placeholder="Choose a password" required value={formData.password} onChange={handleChange} />
            {errors.password && <p className="field-error-message">{errors.password}</p>}
          </div>
          <div className="form-group">
           
            <input type="password" id="register-confirm-password" name="confirmPassword" placeholder="Confirm your password" required value={formData.confirmPassword} onChange={handleChange} />
            {errors.confirmPassword && <p className="field-error-message">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" className="btn-primary btn-full">Sign Up</button>
          <div className="auth-switch">
            <span>Already have an account?</span>
            <Link to="/login" className="switch-btn">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm; 

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function LoginForm({ setUser }) {
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                setUser(data.data.user);
                localStorage.setItem('token', data.data.token); // Save token for auth
                if (data.data.user.role === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else if (data.errors) {
                const newErrors = {};
                data.errors.forEach(e => { newErrors[e.field] = e.message; });
                setErrors(newErrors);
            } else {
                setErrors({ form: data.message || 'Login failed' });
            }
        } catch (err) {
            setErrors({ form: err.message });
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form-card">
                <h3>Sign In</h3>
                {errors.form && <p className="error-message">{errors.form}</p>}
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input type="text" id="login-identifier" name="identifier" placeholder="Enter your email or username" required value={formData.identifier} onChange={handleChange} />
                        {errors.identifier && <p className="field-error-message">{errors.identifier}</p>}
                    </div>
                    <div className="form-group">
                        <input type="password" id="login-password" name="password" placeholder="Enter your password" required value={formData.password} onChange={handleChange} />
                        {errors.password && <p className="field-error-message">{errors.password}</p>}
                    </div>
                    <button type="submit" className="btn-primary btn-full">Sign In</button>
                    <div className="auth-switch">
                        <span>Don't have an account?</span>
                        <Link to="/register" className="switch-btn">Sign up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginForm;
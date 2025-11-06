import React, { useState } from 'react';
import { authAPI } from '../../services/api';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
    setSuccess(''); // Clear success message on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register(formData.email, formData.password);
      
      if (response.success) {
        setSuccess(response.message || 'Registration successful! Please wait for admin approval.');
        setFormData({
          email: '',
          password: '',
          confirmPassword: ''
        });
        // Optionally switch to login after successful registration
        // setTimeout(() => {
        //   onSwitchToLogin();
        // }, 2000);
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.map(e => e.msg).join(', ') ||
                          'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="form-group">
          <label htmlFor="register-email">Email</label>
          <input
            type="email"
            id="register-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-password">Password</label>
          <input
            type="password"
            id="register-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password (min 6 characters)"
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-confirm-password">Confirm Password</label>
          <input
            type="password"
            id="register-confirm-password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
            minLength={6}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="link-button">
          Login here
        </button>
      </p>
    </div>
  );
};

export default Register;


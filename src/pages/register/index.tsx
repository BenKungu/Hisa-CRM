import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { logoWhite } from "../../core/data/json/imagepath";
import { authService } from '../../services/auth';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );

      if (response.success) {
        setShowSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      // ✅ NO BYPASS - Show actual error
      setError(err.error || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // If success is shown, display the success message
  if (showSuccess) {
    return (
      <div className="main-wrapper login-body">
        <div className="login-wrapper">
          <div className="container">
            <div className="loginbox">
              <div className="login-left">
                <img className="img-fluid" src={logoWhite} alt="Logo" />
              </div>
              <div className="login-right">
                <div className="login-right-wrap">
                  <div className="success-cont" style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div 
                      className="success-icon" 
                      style={{
                        width: '80px',
                        height: '80px',
                        background: '#28a745',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                      }}
                    >
                      <i 
                        className="fas fa-check" 
                        style={{ 
                          color: 'white', 
                          fontSize: '40px' 
                        }}
                      />
                    </div>
                    <h3 style={{ color: '#2c3e8f', marginBottom: '15px' }}>
                      Registration Submitted!
                    </h3>
                    <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
                      Your account registration has been submitted successfully.
                      <br />
                      You will receive a confirmation email once your account is approved by the administrator.
                    </p>
                    <div style={{ marginTop: '25px' }}>
                      <Link 
                        to="/login" 
                        className="btn btn-primary w-100"
                        style={{ 
                          padding: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Return to Login
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-wrapper login-body">
      <div className="login-wrapper">
        <div className="container">
          <div className="loginbox">
            <div className="login-left">
              <img className="img-fluid" src={logoWhite} alt="Logo" />
            </div>
            <div className="login-right">
              <div className="login-right-wrap">
                <h1>Register</h1>
                <p className="account-subtitle">Access Hisa dashboard</p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <input
                      className="form-control"
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="form-control"
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="form-control"
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="form-control"
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="form-control"
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <button 
                      className="btn btn-primary w-100" 
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Register'}
                    </button>
                  </div>
                </form>

                <div className="login-or">
                  <span className="or-line" />
                  <span className="span-or">or</span>
                </div>

                <div className="text-center dont-have">
                  Already have an account? <Link to="/login">Login</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;

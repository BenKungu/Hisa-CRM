import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logoWhite } from "../../core/data/json/imagepath";
import { authService } from '../../services/auth';

const AdminOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email and password from location state
  const email = location.state?.email || '';
  const password = location.state?.password || '';
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // If no email, redirect to login
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Handle OTP verification using the service
  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authService.verifyOTP(email, otp, password);

      if (response.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setMessage('✅ Login successful! Redirecting...');
        
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 1000);
      } else {
        setError(response.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                <h1>Verify OTP</h1>
                <p className="account-subtitle">
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="alert alert-success" role="alert">
                    {message}
                  </div>
                )}

                <form onSubmit={handleVerifyOTP}>
                  <div className="form-group">
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <button 
                      className="btn btn-primary w-100" 
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                  </div>
                </form>

                <div className="text-center dont-have">
                  <Link to="/login">← Back to Login</Link>
                </div>

                {/* Display OTP hint for testing */}
                <div style={{ marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                  <small style={{ color: '#6c757d' }}>
                    💡 Check your terminal or database for the OTP code
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOTP;
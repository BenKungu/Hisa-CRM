import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logoWhite } from "../../core/data/json/imagepath";
import { authService } from '../../services/auth';

const AdminOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email and password from location state
  const email = location.state?.email || '';
  const password = location.state?.password || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Refs for each input
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // If no email, redirect to login
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle key down (backspace to go to previous input)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const digits = pasteData.replace(/\D/g, '').slice(0, 6);
    
    if (digits) {
      const newOtp = [...otp];
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      
      // Focus the next empty input or last input
      const nextIndex = digits.length < 6 ? digits.length : 5;
      inputRefs[nextIndex].current?.focus();
    }
  };

  // Handle OTP verification using the service
  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const otpValue = otp.join('');

    if (otpValue.length < 6) {
      setError('Please enter all 6 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.verifyOTP(email, otpValue, password);

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
        // Clear OTP fields on error
        setOtp(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (err: any) {
      setError(err.error || 'Invalid OTP. Please try again.');
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
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
                    <label className="form-label">Enter OTP Code</label>
                    <div className="otp-input-container" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          ref={inputRefs[index]}
                          type="text"
                          className="form-control otp-input"
                          style={{
                            width: '50px',
                            height: '60px',
                            textAlign: 'center',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            border: '2px solid #e0e0e0',
                            padding: '0',
                          }}
                          maxLength={1}
                          value={otp[index]}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          disabled={loading}
                          autoFocus={index === 0}
                          aria-label={`OTP digit ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '20px' }}>
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

                {/* Resend OTP Link */}
                <div className="text-center" style={{ marginTop: '15px' }}>
                  <button 
                    type="button" 
                    className="btn btn-link" 
                    style={{ padding: '0', fontSize: '14px' }}
                    onClick={async () => {
                      setError('');
                      setMessage('');
                      setLoading(true);
                      try {
                        await authService.sendOTP(email);
                        setMessage('✅ New OTP sent! Check your terminal.');
                        setOtp(['', '', '', '', '', '']);
                        inputRefs[0].current?.focus();
                      } catch (err) {
                        setError('Failed to resend OTP. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </div>

                {/* Display OTP hint for testing */}
                <div style={{ marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                  <small style={{ color: '#6c757d' }}>
                    💡 Check your terminal for the OTP code
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
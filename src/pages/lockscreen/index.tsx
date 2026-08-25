import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoWhite } from "../../core/data/json/imagepath";
import { authService } from '../../services/auth';

const AdminLockscreen = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Get user from localStorage
  useEffect(() => {
    const userData = authService.getCurrentUser();
    console.log('User data from localStorage:', userData); // Debug log
    
    if (userData) {
      setUser(userData);
    } else {
      // If no user, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.unlockScreen(password);
      
      if (response.success) {
        const redirectUrl = localStorage.getItem('redirectAfterUnlock') || '/admin-dashboard';
        localStorage.removeItem('redirectAfterUnlock');
        navigate(redirectUrl);
      } else {
        setError(response.message || 'Invalid password');
      }
    } catch (err: any) {
      setError(err.error || 'Invalid password. Please try again.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  // Get user initials (like whitelist table)
  const getUserInitials = () => {
    if (!user) return 'U';
    // Try different possible field names
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  // Get user display name
  const getUserName = () => {
    if (!user) return 'User';
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'User';
  };

  // Get user email
  const getUserEmail = () => {
    if (!user) return '';
    return user.email || '';
  };

  // Get user role
  const getUserRole = () => {
    if (!user) return 'Admin';
    const role = user.role || 'admin';
    return role.toUpperCase();
  };

  // Get avatar color (based on name)
  const getAvatarColor = () => {
    const colors = ['#2a9d36', '#c70e2a', '#F15A29', '#2c3e8f', '#28a745', '#dc3545', '#ffc107', '#17a2b8'];
    if (!user) return '#c70e2a';
    const name = user.firstName || user.first_name || '';
    const index = name.length % colors.length;
    return colors[index];
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
                <div className="lock-user" style={{ textAlign: 'center' }}>
                  {/* Avatar with Initials */}
                  <div 
                    className="rounded-circle" 
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#c70e2a', // Hisa red
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      margin: '0 auto',
                      textTransform: 'uppercase'
                    }}
                  >
                    {getUserInitials()}
                  </div>
                  <h4 style={{ marginTop: '15px', marginBottom: '5px' }}>{getUserName()}</h4>
                  <p className="text-muted" style={{ marginBottom: '5px' }}>{getUserEmail()}</p>
                  <p className="text-muted" style={{ fontSize: '12px' }}>
                    <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff' }}>
                      {getUserRole()}
                    </span>
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <input
                      className="form-control"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group mb-0">
                    <button 
                      className="btn btn-primary w-100" 
                      type="submit"
                      disabled={isLoading}
                      style={{ backgroundColor: '#2a9d36', borderColor: '#2a9d36' }}
                    >
                      {isLoading ? 'Unlocking...' : 'Unlock'}
                    </button>
                  </div>
                </form>

                <div className="text-center dont-have" style={{ marginTop: '15px' }}>
                  Sign in as a different user? <Link to="/login">Login</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLockscreen;
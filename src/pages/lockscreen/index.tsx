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
        // Get redirect URL or default to dashboard
        const redirectUrl = localStorage.getItem('redirectAfterUnlock') || '/admin-dashboard';
        localStorage.removeItem('redirectAfterUnlock');
        
        // Reset idle timer (will be handled by useIdleTimer hook)
        // Navigate back
        navigate(redirectUrl);
      } else {
        setError(response.message || 'Invalid password');
      }
    } catch (err: any) {
      setError(err.error || 'Invalid password. Please try again.');
      // Clear password on error
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    if (user?.first_name) {
      return `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name || ''}&size=100&background=2c3e8f&color=fff`;
    }
    return '/assets/img/avatar/default.jpg';
  };

  // Get user display name
  const getUserName = () => {
    if (!user) return 'User';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
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
                  <img
                    className="rounded-circle"
                    src={getAvatarUrl()}
                    alt="User Image"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                  <h4 style={{ marginTop: '15px' }}>{getUserName()}</h4>
                  <p className="text-muted">{user?.email || ''}</p>
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

// import { avatar02, logoWhite } from "../../core/data/json/imagepath";
// import { Link, useNavigate } from "react-router-dom";
// import { useState } from "react";

// const AdminLockscreen = () => {
//   const navigate = useNavigate();
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
    
//     // Basic validation
//     if (!password) {
//       setError("Please enter your password");
//       return;
//     }

//     setIsLoading(true);
//     setError("");

//     // TODO: Add your actual unlock logic here
//     // Example: Verify password with API
    
//     // Simulate API call
//     setTimeout(() => {
//       // For demo purposes, any password works
//       // In real app, verify credentials first
//       setIsLoading(false);
//       navigate("/admin-dashboard");
//     }, 1000);
//   };

//   return (
//     <>
//       <div className="main-wrapper login-body">
//         <div className="login-wrapper">
//           <div className="container">
//             <div className="loginbox">
//               <div className="login-left">
//                 <img className="img-fluid" src={logoWhite} alt="Logo" />
//               </div>
//               <div className="login-right">
//                 <div className="login-right-wrap">
//                   <div className="lock-user">
//                     <img
//                       className="rounded-circle"
//                       src={avatar02}
//                       alt="User Image"
//                     />
//                     <h4>Amani Waziri</h4>
//                   </div>
                  
//                   {error && (
//                     <div className="alert alert-danger">{error}</div>
//                   )}
                  
//                   {/* Form */}
//                   <form onSubmit={handleSubmit}>
//                     <div className="form-group">
//                       <input
//                         className="form-control"
//                         type="password"
//                         placeholder="Password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         disabled={isLoading}
//                         required
//                       />
//                     </div>
//                     <div className="form-group mb-0">
//                       <button 
//                         className="btn btn-primary w-100" 
//                         type="submit"
//                         disabled={isLoading}
//                       >
//                         {isLoading ? "Unlocking..." : "Enter"}
//                       </button>
//                     </div>
//                   </form>
//                   {/* /Form */}
                  
//                   <div className="text-center dont-have">
//                     Sign in as a different user?{" "}
//                     <Link to="/login">Login</Link>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default AdminLockscreen;
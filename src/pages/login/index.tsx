import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoWhite } from "../../core/data/json/imagepath";
import { authService } from '../../services/auth';

const AdminLogin = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authService.sendOTP(email);
      
      if (response.success) {
        setMessage('✅ OTP sent! Redirecting to verification...');
        
        // Pass both email and password to OTP page
        setTimeout(() => {
          navigate('/otp', { state: { email, password } });
        }, 1000);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.error || 'Invalid email or password. Please try again.');
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
                <h1>Login</h1>
                <p className="account-subtitle">Access to Hisa dashboard</p>

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

                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <input
                      className="form-control"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="form-control"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      {loading ? 'Sending OTP...' : 'Login'}
                    </button>
                  </div>
                </form>

                <div className="text-center forgotpass">
                  <Link to="/forgotpassword">Forgot Password?</Link>
                </div>

                <div className="login-or">
                  <span className="or-line" />
                  <span className="span-or">or</span>
                </div>

                <div className="text-center dont-have">
                  Don't have an account? <Link to="/register">Register</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;



// import { logoWhite } from "../../core/data/json/imagepath";
// import { Link, useNavigate } from "react-router-dom"; // Import useNavigate

// const AdminLogin = () => {
//   const navigate = useNavigate(); // Hook for navigation
//   const config = "/admin-dashboard";

//   // Handle form submission
//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault(); // Prevents page refresh
//     // Add your login logic here (authentication, validation, etc.)
//     navigate(config); // Navigate to dashboard
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
//                   <h1>Login</h1>
//                   <p className="account-subtitle">Access to Hisa dashboard</p>
//                   {/* Form */}
//                   <form onSubmit={handleSubmit}> {/* Changed from action to onSubmit */}
//                     <div className="form-group">
//                       <input
//                         className="form-control"
//                         type="text"
//                         placeholder="Email"
//                       />
//                     </div>
//                     <div className="form-group">
//                       <input
//                         className="form-control"
//                         type="password" // Changed from "text" to "password"
//                         placeholder="Password"
//                       />
//                     </div>
//                     <div className="form-group">
//                       <button className="btn btn-primary w-100" type="submit">
//                         Login
//                       </button>
//                     </div>
//                   </form>
//                   {/* /Form */}
//                   <div className="text-center forgotpass">
//                     <Link to="/forgotpassword">Forgot Password?</Link>
//                   </div>
//                   <div className="login-or">
//                     <span className="or-line" />
//                     <span className="span-or">or</span>
//                   </div>
//                   {/* Social Login */}
//                   <div className="social-login">
//                   </div>
//                   {/* /Social Login */}
//                   <div className="text-center dont-have">
//                     Don’t have an account?{" "}
//                     <Link to="/register">Register</Link>
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

// export default AdminLogin;
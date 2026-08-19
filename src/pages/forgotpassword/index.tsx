import { logoWhite } from "../../core/data/json/imagepath";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const AdminForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // TODO: Add your actual password reset logic here
    // Example: Call API to send reset email
    
    // Show success message and redirect to login
    setIsSubmitted(true);
    setError("");
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  return (
    <>
      <div className="main-wrapper login-body">
        <div className="login-wrapper">
          <div className="container">
            <div className="loginbox">
              <div className="login-left">
                <img className="img-fluid" src={logoWhite} alt="Logo" />
              </div>
              <div className="login-right">
                <div className="login-right-wrap">
                  <h1>Forgot Password?</h1>
                  <p className="account-subtitle">
                    Enter your email to get a password reset link
                  </p>
                  
                  {error && (
                    <div className="alert alert-danger">{error}</div>
                  )}
                  
                  {isSubmitted && (
                    <div className="alert alert-success">
                      Password reset link sent! Redirecting to login...
                    </div>
                  )}
                  
                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <input
                        className="form-control"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitted}
                        required
                      />
                    </div>
                    <div className="form-group mb-0">
                      <button 
                        className="btn btn-primary w-100" 
                        type="submit"
                        disabled={isSubmitted}
                      >
                        {isSubmitted ? "Sending..." : "Reset Password"}
                      </button>
                    </div>
                  </form>
                  {/* /Form */}
                  
                  <div className="text-center dont-have">
                    Remember your password? <Link to="/login">Login</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminForgotPassword;
import { logoWhite } from "../../core/data/json/imagepath";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { authService } from "../../services/auth";

const AdminForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setIsSubmitted(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.message || "Failed to send reset link");
      }
    } catch (err: any) {
      setError(err.error || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
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
                  
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <input
                        className="form-control"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitted || loading}
                        required
                      />
                    </div>
                    <div className="form-group mb-0">
                      <button 
                        className="btn btn-primary w-100" 
                        type="submit"
                        disabled={isSubmitted || loading}
                      >
                        {loading ? "Sending..." : isSubmitted ? "Sent!" : "Reset Password"}
                      </button>
                    </div>
                  </form>
                  
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

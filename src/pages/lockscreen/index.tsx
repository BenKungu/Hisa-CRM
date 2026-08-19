import { avatar02, logoWhite } from "../../core/data/json/imagepath";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const AdminLockscreen = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    setError("");

    // TODO: Add your actual unlock logic here
    // Example: Verify password with API
    
    // Simulate API call
    setTimeout(() => {
      // For demo purposes, any password works
      // In real app, verify credentials first
      setIsLoading(false);
      navigate("/admin-dashboard");
    }, 1000);
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
                  <div className="lock-user">
                    <img
                      className="rounded-circle"
                      src={avatar02}
                      alt="User Image"
                    />
                    <h4>Amani Waziri</h4>
                  </div>
                  
                  {error && (
                    <div className="alert alert-danger">{error}</div>
                  )}
                  
                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <input
                        className="form-control"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="form-group mb-0">
                      <button 
                        className="btn btn-primary w-100" 
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? "Unlocking..." : "Enter"}
                      </button>
                    </div>
                  </form>
                  {/* /Form */}
                  
                  <div className="text-center dont-have">
                    Sign in as a different user?{" "}
                    <Link to="/login">Login</Link>
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

export default AdminLockscreen;
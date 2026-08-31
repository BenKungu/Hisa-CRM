/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlignLeft, Bell, Search, Menu } from "react-feather";
import {
  logo,
  logoSmall,
} from "../../core/data/json/imagepath";
import { authService } from "../../services/auth";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Get user from localStorage
    const userData = authService.getCurrentUser();
    console.log('Header - User data from localStorage:', userData); // Debug
    
    if (userData) {
      setUser(userData);
    } else {
      // Try to fetch from API
      authService.getProfile()
        .then(response => {
          if (response.success) {
            const apiUser = response.data;
            console.log('Header - User data from API:', apiUser); // Debug
            setUser(apiUser);
            // Store in localStorage
            localStorage.setItem('user', JSON.stringify(apiUser));
          }
        })
        .catch(() => {
          // If not authenticated, redirect to login
          navigate('/login');
        });
    }
  }, [navigate]);

  const handleSidebar = () => {
    document.body.classList.toggle("mini-sidebar");
  };
  
  const handleSidebarMobileMenu = () => {
    document.body.classList.toggle("slide-nav");
  };

  const handleLogout = () => {
    authService.logout();
  };

  // Helper function to get first name (handles both formats)
  const getFirstName = () => {
    if (!user) return '';
    return user.first_name || user.firstName || '';
  };

  // Helper function to get last name (handles both formats)
  const getLastName = () => {
    if (!user) return '';
    return user.last_name || user.lastName || '';
  };

  // Helper function to get user display name
  const getUserName = () => {
    if (!user) return 'User';
    const firstName = getFirstName();
    const lastName = getLastName();
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email || 'User';
  };

  // Helper function to get user role
  const getUserRole = () => {
    if (!user) return 'Administrator';
    const role = user.role || 'admin';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Helper function to get user initials
  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = getFirstName();
    const lastName = getLastName();
    const first = firstName.charAt(0)?.toUpperCase() || '';
    const last = lastName.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  // Helper function to get avatar color
  const getAvatarColor = () => {
    const colors = ['#2a9d36', '#F15A29', '#2c3e8f', '#17a2b8', '#6f42c1'];
    if (!user) return '#2a9d36';
    const name = getFirstName() || user.email || '';
    const index = name.length % colors.length;
    return colors[index];
  };

  // Helper function to get user email
  const getUserEmail = () => {
    if (!user) return '';
    return user.email || '';
  };

  return (
    <>
      <div className="header">
        <div className="header-left">
          <Link to="/admin-dashboard" className="logo">
            <img src={logo} alt="Logo" />
          </Link>
          <Link to="/admin-dashboard" className="logo logo-small">
            <img src={logoSmall} alt="Logo" width="30" height="30" />
          </Link>
        </div>
        <Link to="#" id="toggle_btn" onClick={handleSidebar}>
          <AlignLeft size={20} />
        </Link>

        <div className="top-nav-search">
          <form>
            <input
              type="text"
              className="form-control"
              placeholder="Search here"
            />
            <button className="btn" type="submit">
              <Search size={16} />
            </button>
          </form>
        </div>

        <Link
          to="#"
          className="mobile_btn"
          id="mobile_btn"
          onClick={handleSidebarMobileMenu}
        >
          <Menu size={20} />
        </Link>

        <ul className="nav user-menu">
          <li className="nav-item dropdown noti-dropdown">
            <Link
              to="#"
              className="dropdown-toggle nav-link"
              data-bs-toggle="dropdown"
            >
              <Bell size={20} />
              <span className="badge rounded-pill">3</span>
            </Link>
            <div className="dropdown-menu notifications">
              <div className="topnav-dropdown-header">
                <span className="notification-title">Notifications</span>
                <Link to="#" className="clear-noti">
                  Clear All
                </Link>
              </div>
              <div className="noti-content">
                <ul className="notification-list">
                  <li className="notification-message">
                    <Link to="#">No notifications</Link>
                  </li>
                </ul>
              </div>
              <div className="topnav-dropdown-footer">
                <Link to="#">View all Notifications</Link>
              </div>
            </div>
          </li>

          <li className="nav-item dropdown has-arrow">
            <Link
              to="#"
              className="dropdown-toggle nav-link"
              data-bs-toggle="dropdown"
            >
              <span className="user-img">
                <span 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '31px',
                    height: '31px',
                    backgroundColor: getAvatarColor(),
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  {getUserInitials()}
                </span>
              </span>
            </Link>
            <div className="dropdown-menu">
              <div className="user-header">
                <div className="avatar avatar-sm">
                  <span 
                    className="avatar-img rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: getAvatarColor(),
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}
                  >
                    {getUserInitials()}
                  </span>
                </div>
                <div className="user-text">
                  <h6>{getUserName()}</h6>
                  <p className="text-muted mb-0">{getUserEmail()}</p>
                  <p className="text-muted mb-0" style={{ fontSize: '12px' }}>
                    <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff' }}>
                      {getUserRole()}
                    </span>
                  </p>
                </div>
              </div>
              <Link className="dropdown-item" to="/profile">
                My Profile
              </Link>
              <Link className="dropdown-item" to="/settings">
                Settings
              </Link>
              <button 
                className="dropdown-item logout-btn" 
                onClick={handleLogout} 
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  width: '100%', 
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c70e2a';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'inherit';
                }}
              >
                Logout
              </button>
            </div>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Header;

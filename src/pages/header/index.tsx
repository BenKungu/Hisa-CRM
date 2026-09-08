/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlignLeft, Bell, Search, Menu } from "react-feather";
import {
  logo,
  logoSmall,
} from "../../core/data/json/imagepath";
import { authService } from "../../services/auth";
import { searchService } from "../../services/search";

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

  const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<any>(null);
const [showSearchDropdown, setShowSearchDropdown] = useState(false);
const [searchLoading, setSearchLoading] = useState(false);

// Debounce search
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchQuery.trim().length >= 2) {
      performSearch(searchQuery.trim());
    } else {
      setSearchResults(null);
      setShowSearchDropdown(false);
    }
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);

const performSearch = async (query: string) => {
  setSearchLoading(true);
  try {
    const response = await searchService.search(query);
    if (response.success) {
      setSearchResults(response.data);
      setShowSearchDropdown(true);
    }
  } catch (error) {
    console.error('Search error:', error);
  } finally {
    setSearchLoading(false);
  }
};

const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchQuery(e.target.value);
  if (e.target.value.trim().length === 0) {
    setShowSearchDropdown(false);
    setSearchResults(null);
  }
};

const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setShowSearchDropdown(false);
  }
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

<div className="top-nav-search" style={{ position: 'relative' }}>
  <form onSubmit={(e) => { e.preventDefault(); /* handled by keydown */ }}>
    <input
      type="text"
  className="form-control"
  placeholder="Search clients, policies, agents..."
  style={{
    borderColor: '#e0e0e0',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }}
  onFocus={(e) => {
    e.currentTarget.style.borderColor = '#2a9d36';
    e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(42, 157, 54, 0.25)';
    if (searchQuery.trim().length >= 2 && searchResults) {
      setShowSearchDropdown(true);
    }
  }}
  onBlur={(e) => {
    e.currentTarget.style.borderColor = '#e0e0e0';
    e.currentTarget.style.boxShadow = 'none';
    setTimeout(() => setShowSearchDropdown(false), 200);
  }}
      value={searchQuery}
      onChange={handleSearchInputChange}
      onKeyDown={handleSearchKeyDown}
    />
    <button className="btn" type="submit">
      <Search size={16} />
    </button>
  </form>

  {/* Dropdown – right-aligned, fixed width */}
  {showSearchDropdown && searchResults && (
    <div 
      className="search-dropdown"
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        right: 'auto',          
        left: 0,     
        width: '480px',
        maxWidth: '90vw',
        backgroundColor: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
      maxHeight: '460px',
      overflowY: 'auto',
      zIndex: 1050,
      padding: '8px 0',
      }}
    >
      {searchLoading && <div className="text-center p-2">Loading...</div>}
    {!searchLoading && (
      <>
      {/* Clients */}
        {searchResults.clients?.length > 0 && (
  <div style={{ backgroundColor: '#fdf0f2', borderRadius: '4px', margin: '0 4px 4px 4px' }}>
    <div style={{ padding: '4px 12px', fontWeight: '600', color: '#c70e2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      👤 Clients
    </div>
    {searchResults.clients.map((item: any) => (
      <Link
        key={item.id}
        to={item.url}
        className="dropdown-item"
        style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', whiteSpace: 'normal', color: '#333' }}
        onClick={() => setShowSearchDropdown(false)}
      >
        <span style={{ fontWeight: '500' }}>{item.label}</span>
        <span style={{ fontSize: '11px', color: '#999' }}>{item.subtitle}</span>
      </Link>
    ))}
  </div>
)}
        {/* Policies */}
        {searchResults.policies?.length > 0 && (
  <div style={{ backgroundColor: '#eaf7ed', borderRadius: '4px', margin: '0 4px 4px 4px' }}>
    <div style={{ padding: '4px 12px', fontWeight: '600', color: '#2a9d36', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      📄 Policies
    </div>
    {searchResults.policies.map((item: any) => (
      <Link
        key={item.id}
        to={item.url}
        className="dropdown-item"
        style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', whiteSpace: 'normal', color: '#333' }}
        onClick={() => setShowSearchDropdown(false)}
      >
        <span style={{ fontWeight: '500' }}>{item.label}</span>
        <span style={{ fontSize: '11px', color: '#999' }}>{item.subtitle}</span>
      </Link>
    ))}
  </div>
)}
        {/* Agents */}
        {searchResults.agents?.length > 0 && (
  <div style={{ backgroundColor: '#fef3e8', borderRadius: '4px', margin: '0 4px 4px 4px' }}>
    <div style={{ padding: '4px 12px', fontWeight: '600', color: '#F15A29', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      🤝 Agents
    </div>
    {searchResults.agents.map((item: any) => (
      <Link
        key={item.id}
        to={item.url}
        className="dropdown-item"
        style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', whiteSpace: 'normal', color: '#333' }}
        onClick={() => setShowSearchDropdown(false)}
      >
        <span style={{ fontWeight: '500' }}>{item.label}</span>
        <span style={{ fontSize: '11px', color: '#999' }}>{item.subtitle}</span>
      </Link>
    ))}
  </div>
)}
        {(!searchResults.clients?.length && !searchResults.policies?.length && !searchResults.agents?.length) && (
          <div className="text-center p-2 text-muted">No results found</div>
        )}

        {/* See all results – primary red */}
        {searchQuery.trim().length >= 2 && (
          <div style={{ margin: '4px 0', borderTop: '1px solid #eee' }}></div>
        )}
        <Link
          to={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
          className="dropdown-item text-center"
          style={{
            fontWeight: '500',
            color: '#c70e2a',
            padding: '8px 16px',
            display: 'block',
          }}
          onClick={() => setShowSearchDropdown(false)}
        >
          See all results
        </Link>
      </>
    )}
  </div>
)}
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
              <Link className="dropdown-item" to="/profile">
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

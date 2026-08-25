/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlignLeft, Bell, Search, Menu } from "react-feather";
import {
  avatar01,
  logo,
  logoSmall,
} from "../../core/data/json/imagepath";
import { authService } from "../../services/auth";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Get user from localStorage
    const userData = authService.getCurrentUser();
    if (userData) {
      setUser(userData);
    } else {
      // Try to fetch from API
      authService.getProfile()
        .then(response => {
          if (response.success) {
            setUser(response.data);
            // Store in localStorage
            localStorage.setItem('user', JSON.stringify(response.data));
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

  // Helper function to get user display name
  const getUserName = () => {
    if (!user) return 'User';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  };

  // Helper function to get user role
  const getUserRole = () => {
    if (!user) return 'Administrator';
    const role = user.role || 'admin';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Helper function to get avatar URL
  const getAvatarUrl = (size: number) => {
    if (user?.first_name) {
      return `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name || ''}&size=${size}&background=2c3e8f&color=fff`;
    }
    return avatar01;
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
                <img
                  className="rounded-circle"
                  src={getAvatarUrl(31)}
                  width={31}
                  alt="User"
                />
              </span>
            </Link>
            <div className="dropdown-menu">
              <div className="user-header">
                <div className="avatar avatar-sm">
                  <img
                    src={getAvatarUrl(50)}
                    alt="User Image"
                    className="avatar-img rounded-circle"
                  />
                </div>
                <div className="user-text">
                  <h6>{getUserName()}</h6>
                  <p className="text-muted mb-0">{getUserRole()}</p>
                </div>
              </div>
              <Link className="dropdown-item" to="/profile">
                My Profile
              </Link>
              <Link className="dropdown-item" to="/settings">
                Settings
              </Link>
              <button 
                className="dropdown-item" 
                onClick={handleLogout} 
                style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
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


// /* eslint-disable react/prop-types */
// import React from "react";
// import { Link } from "react-router-dom";
// import { AlignLeft, Bell, Search, Menu } from "react-feather";
// import {
//   avatar01,
//   logo,
//   logoSmall,
// } from "../../core/data/json/imagepath";

// const Header: React.FC = () => {
  
//   const handleSidebar = () => {
//     document.body.classList.toggle("mini-sidebar");
//   };
  
//   const handleSidebarMobileMenu = () => {
//     document.body.classList.toggle("slide-nav");
//   };

//   return (
//     <>
//       {/* Header */}
//       <div className="header">
//         {/* Logo */}
//         <div className="header-left">
//           <Link to="/admin-dashboard" className="logo">
//             <img src={logo} alt="Logo" />
//           </Link>
//           <Link to="/admin-dashboard" className="logo logo-small">
//             <img src={logoSmall} alt="Logo" width="30" height="30" />
//           </Link>
//         </div>
//         <Link to="#" id="toggle_btn" onClick={handleSidebar}>
//           <AlignLeft size={20} />
//         </Link>
//         {/* /Logo */}
//         <div className="top-nav-search">
//           <form>
//             <input
//               type="text"
//               className="form-control"
//               placeholder="Search here"
//             />
//             <button className="btn" type="submit">
//               <Search size={16} />
//             </button>
//           </form>
//         </div>

//         {/* Mobile Menu Toggle */}
//         <Link
//           to="#"
//           className="mobile_btn"
//           id="mobile_btn"
//           onClick={handleSidebarMobileMenu}
//         >
//           <Menu size={20} />
//         </Link>
//         {/* /Mobile Menu Toggle */}
//         {/* Header Right Menu */}
//         <ul className="nav user-menu">
//           {/* Notifications */}
//           <li className="nav-item dropdown noti-dropdown">
//             <Link
//               to="#"
//               className="dropdown-toggle nav-link"
//               data-bs-toggle="dropdown"
//             >
//               <Bell size={20} />
//               <span className="badge rounded-pill">3</span>
//             </Link>
//             <div className="dropdown-menu notifications">
//               <div className="topnav-dropdown-header">
//                 <span className="notification-title">Notifications</span>
//                 <Link to="#" className="clear-noti">
//                   {" "}
//                   Clear All{" "}
//                 </Link>
//               </div>
//               <div className="noti-content">
//                 <ul className="notification-list">
//                   <li className="notification-message">
//                     <Link to="#">
//                     </Link>
//                   </li>
//                   <li className="notification-message">
//                     <Link to="#">
//                     </Link>
//                   </li>
//                   <li className="notification-message">
//                     <Link to="#">
//                     </Link>
//                   </li>
//                   <li className="notification-message">
//                     <Link to="#">
//                     </Link>
//                   </li>
//                 </ul>
//               </div>
//               <div className="topnav-dropdown-footer">
//                 <Link to="#">View all Notifications</Link>
//               </div>
//             </div>
//           </li>
//           {/* /Notifications */}
//           {/* User Menu */}
//           <li className="nav-item dropdown has-arrow">
//             <Link
//               to="#"
//               className="dropdown-toggle nav-link"
//               data-bs-toggle="dropdown"
//             >
//               <span className="user-img">
//                 <img
//                   className="rounded-circle"
//                   src={avatar01}
//                   width={31}
//                   alt="Ryan Taylor"
//                 />
//               </span>
//             </Link>
//             <div className="dropdown-menu">
//               <div className="user-header">
//                 <div className="avatar avatar-sm">
//                   <img
//                     src={avatar01}
//                     alt="User Image"
//                     className="avatar-img rounded-circle"
//                   />
//                 </div>
//                 <div className="user-text">
//                   <h6>Amani Waziri</h6>
//                   <p className="text-muted mb-0">Administrator</p>
//                 </div>
//               </div>
//               <Link className="dropdown-item" to="/profile">
//                 My Profile
//               </Link>
//               <Link className="dropdown-item" to="/settings">
//                 Settings
//               </Link>
//               <Link className="dropdown-item" to="/login">
//                 Logout
//               </Link>
//             </div>
//           </li>
//           {/* /User Menu */}
//         </ul>
//         {/* /Header Right Menu */}
//       </div>

//       {/* /Header */}
//     </>
//   );
// };

// export default Header;

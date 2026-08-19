/* eslint-disable react/prop-types */
import React from "react";
import { Link } from "react-router-dom";
import { AlignLeft, Bell, Search, Menu } from "react-feather";
import {
  avatar01,
  logo,
  logoSmall,
} from "../../core/data/json/imagepath";

const Header: React.FC = () => {
  
  const handleSidebar = () => {
    document.body.classList.toggle("mini-sidebar");
  };
  
  const handleSidebarMobileMenu = () => {
    document.body.classList.toggle("slide-nav");
  };

  return (
    <>
      {/* Header */}
      <div className="header">
        {/* Logo */}
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
        {/* /Logo */}
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

        {/* Mobile Menu Toggle */}
        <Link
          to="#"
          className="mobile_btn"
          id="mobile_btn"
          onClick={handleSidebarMobileMenu}
        >
          <Menu size={20} />
        </Link>
        {/* /Mobile Menu Toggle */}
        {/* Header Right Menu */}
        <ul className="nav user-menu">
          {/* Notifications */}
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
                  {" "}
                  Clear All{" "}
                </Link>
              </div>
              <div className="noti-content">
                <ul className="notification-list">
                  <li className="notification-message">
                    <Link to="#">
                    </Link>
                  </li>
                  <li className="notification-message">
                    <Link to="#">
                    </Link>
                  </li>
                  <li className="notification-message">
                    <Link to="#">
                    </Link>
                  </li>
                  <li className="notification-message">
                    <Link to="#">
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="topnav-dropdown-footer">
                <Link to="#">View all Notifications</Link>
              </div>
            </div>
          </li>
          {/* /Notifications */}
          {/* User Menu */}
          <li className="nav-item dropdown has-arrow">
            <Link
              to="#"
              className="dropdown-toggle nav-link"
              data-bs-toggle="dropdown"
            >
              <span className="user-img">
                <img
                  className="rounded-circle"
                  src={avatar01}
                  width={31}
                  alt="Ryan Taylor"
                />
              </span>
            </Link>
            <div className="dropdown-menu">
              <div className="user-header">
                <div className="avatar avatar-sm">
                  <img
                    src={avatar01}
                    alt="User Image"
                    className="avatar-img rounded-circle"
                  />
                </div>
                <div className="user-text">
                  <h6>Amani Waziri</h6>
                  <p className="text-muted mb-0">Administrator</p>
                </div>
              </div>
              <Link className="dropdown-item" to="/profile">
                My Profile
              </Link>
              <Link className="dropdown-item" to="/settings">
                Settings
              </Link>
              <Link className="dropdown-item" to="/login">
                Logout
              </Link>
            </div>
          </li>
          {/* /User Menu */}
        </ul>
        {/* /Header Right Menu */}
      </div>

      {/* /Header */}
    </>
  );
};

export default Header;

import React, { useState, useEffect } from "react";
import SidebarNav from "../sidebar";
import DatePicker from "react-datepicker";
import { Link } from "react-router-dom";
import Header from "../header";
import { authService } from "../../services/auth";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  last_login: string;
  created_at: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  date_of_birth?: string;
}

const AdminProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Edit form state
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    date_of_birth: null as Date | null,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Load profile
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getProfile();
      if (response.success) {
        setProfile(response.data);
        // Populate edit form
        setEditData({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          zip_code: response.data.zip_code || '',
          country: response.data.country || '',
          date_of_birth: response.data.date_of_birth ? new Date(response.data.date_of_birth) : null,
        });
        setSelectedDate(response.data.date_of_birth ? new Date(response.data.date_of_birth) : null);
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authService.updateProfile(editData);
      if (response.success) {
        await loadProfile(); // Reload profile
        alert('Profile updated successfully!');
        // Close modal
        const modal = document.getElementById('edit_personal_details');
        if (modal) {
          // Bootstrap modal close
          const closeBtn = modal.querySelector('.btn-close') as HTMLButtonElement;
          if (closeBtn) closeBtn.click();
        }
      }
    } catch (err: any) {
      alert(err.error || 'Failed to update profile');
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await authService.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword
      );
      if (response.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err: any) {
      setPasswordError(err.error || 'Failed to change password');
    }
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setEditData({ ...editData, date_of_birth: date });
  };

  if (loading) {
    return (
      <>
        <Header />
        <SidebarNav />
        <div className="page-wrapper">
          <div className="content container-fluid">
            <div className="text-center" style={{ padding: '50px 0' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <SidebarNav />
        <div className="page-wrapper">
          <div className="content container-fluid">
            <div className="alert alert-danger">{error}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col">
                <h3 className="page-title">Profile</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Profile</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="profile-header">
                <div className="row align-items-center">
                  <div className="col-auto profile-image">
                    <Link to="#">
                      <img
                        className="rounded-circle"
                        alt="User Image"
                        src={`https://ui-avatars.com/api/?name=${profile?.first_name || 'U'}+${profile?.last_name || ''}&size=100&background=2c3e8f&color=fff`}
                        style={{ width: '100px', height: '100px' }}
                      />
                    </Link>
                  </div>
                  <div className="col ml-md-n2 profile-user-info">
                    <h4 className="user-name mb-0">
                      {profile?.first_name} {profile?.last_name}
                    </h4>
                    <h6 className="text-muted">{profile?.email}</h6>
                    <div className="user-Location">
                      <i className="fa fa-map-marker" /> 
                      {profile?.city || 'N/A'}, {profile?.country || 'N/A'}
                    </div>
                    <div className="about-text">
                      Role: <span className="badge bg-primary">{profile?.role || 'admin'}</span>
                      <span className="ms-2">
                        Status: <span className={`badge ${profile?.is_active ? 'bg-success' : 'bg-danger'}`}>
                          {profile?.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="col-auto profile-btn">
                    <Link
                      to="#"
                      className="btn btn-primary"
                      data-bs-toggle="modal"
                      data-bs-target="#edit_personal_details"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>

              <div className="profile-menu">
                <ul className="nav nav-tabs nav-tabs-solid">
                  <li className="nav-item">
                    <Link
                      className="nav-link active"
                      data-bs-toggle="tab"
                      to="#per_details_tab"
                    >
                      About
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      data-bs-toggle="tab"
                      to="#password_tab"
                    >
                      Password
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="tab-content profile-tab-cont">
                {/* Personal Details Tab */}
                <div className="tab-pane fade show active" id="per_details_tab">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="card">
                        <div className="card-body">
                          <h5 className="card-title d-flex justify-content-between">
                            <span>Personal Details</span>
                            <Link
                              className="edit-link"
                              data-bs-toggle="modal"
                              to="#edit_personal_details"
                            >
                              <i className="fa fa-edit me-1" />
                              Edit
                            </Link>
                          </h5>
                          <div className="row">
                            <p className="col-sm-2 text-muted text-sm-end mb-0 mb-sm-3">
                              Name
                            </p>
                            <p className="col-sm-10">{profile?.first_name} {profile?.last_name}</p>
                          </div>
                          <div className="row">
                            <p className="col-sm-2 text-muted text-sm-end mb-0 mb-sm-3">
                              Email ID
                            </p>
                            <p className="col-sm-10">{profile?.email}</p>
                          </div>
                          <div className="row">
                            <p className="col-sm-2 text-muted text-sm-end mb-0 mb-sm-3">
                              Role
                            </p>
                            <p className="col-sm-10">
                              <span className="badge bg-primary">
                                {profile?.role?.toUpperCase() || 'Admin'}
                              </span>
                            </p>
                          </div>
                          <div className="row">
                            <p className="col-sm-2 text-muted text-sm-end mb-0 mb-sm-3">
                              Status
                            </p>
                            <p className="col-sm-10">
                              <span className={`badge ${profile?.is_active ? 'bg-success' : 'bg-danger'}`}>
                                {profile?.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                          </div>
                          <div className="row">
                            <p className="col-sm-2 text-muted text-sm-end mb-0">
                              Last Login
                            </p>
                            <p className="col-sm-10 mb-0">
                              {profile?.last_login ? new Date(profile.last_login).toLocaleString() : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Password Tab */}
                <div id="password_tab" className="tab-pane fade">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Change Password</h5>
                      {passwordError && (
                        <div className="alert alert-danger">{passwordError}</div>
                      )}
                      {passwordSuccess && (
                        <div className="alert alert-success">{passwordSuccess}</div>
                      )}
                      <div className="row">
                        <div className="col-md-10 col-lg-6">
                          <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                              <label>Old Password</label>
                              <input
                                type="password"
                                className="form-control"
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({
                                  ...passwordData,
                                  oldPassword: e.target.value
                                })}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>New Password</label>
                              <input
                                type="password"
                                className="form-control"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({
                                  ...passwordData,
                                  newPassword: e.target.value
                                })}
                                required
                                minLength={6}
                              />
                            </div>
                            <div className="form-group">
                              <label>Confirm Password</label>
                              <input
                                type="password"
                                className="form-control"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({
                                  ...passwordData,
                                  confirmPassword: e.target.value
                                })}
                                required
                              />
                            </div>
                            <button className="btn btn-primary" type="submit">
                              Save Changes
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Details Modal */}
      <div
        className="modal fade"
        id="edit_personal_details"
        aria-hidden="true"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Personal Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <form onSubmit={handleProfileUpdate}>
                <div className="row form-row">
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.first_name}
                        onChange={(e) => setEditData({
                          ...editData,
                          first_name: e.target.value
                        })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.last_name}
                        onChange={(e) => setEditData({
                          ...editData,
                          last_name: e.target.value
                        })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <div className="cal-icon">
                        <DatePicker
                          className="form-control"
                          selected={selectedDate}
                          onChange={handleDateChange}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>Email ID</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editData.email}
                        onChange={(e) => setEditData({
                          ...editData,
                          email: e.target.value
                        })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.phone}
                        onChange={(e) => setEditData({
                          ...editData,
                          phone: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.address}
                        onChange={(e) => setEditData({
                          ...editData,
                          address: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.city}
                        onChange={(e) => setEditData({
                          ...editData,
                          city: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>State/County</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.state}
                        onChange={(e) => setEditData({
                          ...editData,
                          state: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>Zip Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.zip_code}
                        onChange={(e) => setEditData({
                          ...editData,
                          zip_code: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.country}
                        onChange={(e) => setEditData({
                          ...editData,
                          country: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProfile;

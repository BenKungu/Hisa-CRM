import React, { useState, useEffect } from 'react';
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import SidebarNav from "../sidebar";
import { Link } from "react-router-dom";
import Header from "../header";
import { Eye, Edit, Trash2, FileText, Search, Plus } from 'react-feather';
import { policyService } from '../../services/policy';
import { clientService } from '../../services/client';

interface Policy {
  id: string;
  policy_number: string;
  client_name: string;
  full_name: string;
  client_id: string;
  product_type: string;
  policy_status: string;
  premium_frequency: string;
  annualised_premium: number;
  inception_date: string;
  agent_name: string;
  agent_code: string;
  sales_branch: string;
}

const AdminBusinesses = () => {
  const [data, setData] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'view' | 'edit' | 'delete' | 'add' | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // Add/Edit form state
  const [formData, setFormData] = useState({
    // Client fields
    client_title: '',
    client_fullname: '',
    client_surname: '',
    client_id_no: '',
    client_phone: '',
    client_email: '',
    client_dob: '',
    // Policy fields
    policy_number: '',
    inception_date: '',
    strike_date: '',
    policy_status: 'Active',
    product_type: '',
    premium_frequency: '',
    total_sum_insured: '',
    annualised_premium: '',
    initial_gross_premium: '',
    new_gross_premium: '',
    sales_branch: '',
    agent_name: '',
    agent_code: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load policies
  const loadPolicies = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await policyService.getPolicies();
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to load policies');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load policies');
      console.error('Error loading policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  // Open modal
  const openModal = (action: 'view' | 'edit' | 'delete' | 'add', policy?: Policy) => {
    setModalAction(action);
    if (policy) setSelectedPolicy(policy);
    if (action === 'add') {
      setFormData({
        client_title: '',
        client_fullname: '',
        client_surname: '',
        client_id_no: '',
        client_phone: '',
        client_email: '',
        client_dob: '',
        policy_number: '',
        inception_date: '',
        strike_date: '',
        policy_status: 'Active',
        product_type: '',
        premium_frequency: '',
        total_sum_insured: '',
        annualised_premium: '',
        initial_gross_premium: '',
        new_gross_premium: '',
        sales_branch: '',
        agent_name: '',
        agent_code: '',
      });
      setFormError('');
      setFormSuccess('');
    }
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setModalAction(null);
    setSelectedPolicy(null);
    setFormError('');
    setFormSuccess('');
    setSubmitting(false);
  };

  // Handle form input change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle add policy submit (creates client + policy)
  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      // First create the client
      const clientResponse = await clientService.createClient({
        title: formData.client_title,
        client_name: `${formData.client_fullname} ${formData.client_surname}`.trim(),
        full_name: `${formData.client_fullname} ${formData.client_surname}`.trim(),
        first_name: formData.client_fullname,
        last_name: formData.client_surname,
        id_no: formData.client_id_no,
        phone_no: formData.client_phone,
        email: formData.client_email,
        date_of_registration: formData.inception_date || null,
      });

      if (!clientResponse.success) {
        setFormError(clientResponse.error || 'Failed to create client');
        setSubmitting(false);
        return;
      }

      // Then create the policy linked to the client
      const policyResponse = await policyService.createPolicy({
        client_id: clientResponse.data.id,
        policy_number: formData.policy_number,
        inception_date: formData.inception_date,
        strike_date: formData.strike_date,
        policy_status: formData.policy_status,
        product_type: formData.product_type,
        premium_frequency: formData.premium_frequency,
        total_sum_insured: parseFloat(formData.total_sum_insured) || 0,
        annualised_premium: parseFloat(formData.annualised_premium) || 0,
        initial_gross_premium: parseFloat(formData.initial_gross_premium) || 0,
        new_gross_premium: parseFloat(formData.new_gross_premium) || 0,
        sales_branch: formData.sales_branch,
        agent_name: formData.agent_name,
        agent_code: formData.agent_code,
      });

      if (policyResponse.success) {
        setFormSuccess('Client and Policy created successfully!');
        await loadPolicies();
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setFormError(policyResponse.error || 'Failed to create policy');
      }
    } catch (err: any) {
      setFormError(err.error || 'Failed to create client and policy');
      console.error('Create error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedPolicy) return;
    
    try {
      const response = await policyService.deletePolicy(selectedPolicy.id);
      if (response.success) {
        await loadPolicies();
        closeModal();
      } else {
        alert('Failed to delete policy');
      }
    } catch (err: any) {
      alert(err.error || 'Failed to delete policy');
      console.error('Delete error:', err);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Get avatar color
  const getAvatarColor = (name: string) => {
    const colors = ['#c70e2a', '#2a9d36', '#F15A29', '#2c3e8f', '#17a2b8', '#6f42c1'];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (!value) return '0';
    return value.toLocaleString();
  };

  // Filter data based on search
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.policy_number?.toLowerCase().includes(search) ||
      item.full_name?.toLowerCase().includes(search) ||
      item.client_name?.toLowerCase().includes(search) ||
      item.product_type?.toLowerCase().includes(search) ||
      item.policy_status?.toLowerCase().includes(search) ||
      item.agent_name?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "Policy Number",
      dataIndex: "policy_number",
      render: (text: string) => (
        <span style={{ color: '#c70e2a', fontWeight: 'bold' }}>
          <FileText size={16} className="me-1" />
          {text || 'N/A'}
        </span>
      ),
      sorter: (a: any, b: any) => (a.policy_number || '').localeCompare(b.policy_number || ''),
    },
    {
      title: "Client Name",
      dataIndex: "client_name",
      render: (text: string) => {
        const displayName = text || 'N/A';
        return (
          <>
            <span 
              className="avatar mx-2 rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{
                width: '35px',
                height: '35px',
                backgroundColor: getAvatarColor(displayName),
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
            >
              {getInitials(displayName)}
            </span>
            <span className="text-dark">{displayName}</span>
          </>
        );
      },
      sorter: (a: any, b: any) => (a.client_name || '').localeCompare(b.client_name || ''),
    },
    {
      title: "Product Type",
      dataIndex: "product_type",
      render: (text: string) => <span>{text || 'N/A'}</span>,
      sorter: (a: any, b: any) => (a.product_type || '').localeCompare(b.product_type || ''),
    },
    {
      title: "Status",
      dataIndex: "policy_status",
      render: (status: string) => {
        let badgeClass = 'bg-secondary';
        let displayText = status || 'N/A';
        
        if (status?.toLowerCase().includes('finalised')) {
          badgeClass = 'bg-success';
        } else if (status?.toLowerCase().includes('unfinalised')) {
          badgeClass = 'bg-warning text-dark';
        } else if (status?.toLowerCase().includes('cancelled')) {
          badgeClass = 'bg-danger';
        } else if (status?.toLowerCase().includes('active')) {
          badgeClass = 'bg-success';
        }
        
        return (
          <span className={`badge ${badgeClass} p-2`} style={{ minWidth: '80px' }}>
            {displayText}
          </span>
        );
      },
      sorter: (a: any, b: any) => (a.policy_status || '').localeCompare(b.policy_status || ''),
    },
    {
      title: "Premium (KES)",
      dataIndex: "annualised_premium",
      render: (value: number) => (
        <span className="fw-bold" style={{ color: '#2a9d36' }}>
          KES {formatCurrency(value)}
        </span>
      ),
      sorter: (a: any, b: any) => (a.annualised_premium || 0) - (b.annualised_premium || 0),
    },
    {
      title: "Frequency",
      dataIndex: "premium_frequency",
      render: (text: string) => <span>{text || 'N/A'}</span>,
    },
    {
      title: "Inception Date",
      dataIndex: "inception_date",
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
      sorter: (a: any, b: any) => 
        new Date(a.inception_date).getTime() - new Date(b.inception_date).getTime(),
    },
    {
      title: "Agent",
      dataIndex: "agent_name",
      render: (text: string) => (
        <span className="text-muted">{text || 'N/A'}</span>
      ),
    },
    {
      title: "Action",
      dataIndex: "",
      className: "text-end",
      render: (_: any, record: Policy) => (
        <div className="text-end">
          <button
            className="btn btn-sm me-2"
            onClick={() => openModal('view', record)}
            title="View"
            style={{ backgroundColor: '#17a2b8', color: '#fff', border: 'none' }}
          >
            <Eye size={16} />
          </button>
          <button
            className="btn btn-sm me-2"
            onClick={() => openModal('edit', record)}
            title="Edit"
            style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none' }}
          >
            <Edit size={16} />
          </button>
          <button
            className="btn btn-sm"
            onClick={() => openModal('delete', record)}
            title="Delete"
            style={{ backgroundColor: '#c70e2a', color: '#fff', border: 'none' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  // Get modal content
  const getModalContent = () => {
    if (modalAction === 'add') {
      return {
        title: 'Add New Business',
        body: (
          <form onSubmit={handleAddPolicy}>
            {formError && <div className="alert alert-danger">{formError}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

            <h6 className="mb-3" style={{ color: '#c70e2a' }}>Client Details</h6>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Title</label>
                  <select
                    className="form-control"
                    name="client_title"
                    value={formData.client_title}
                    onChange={handleFormChange}
                  >
                    <option value="">Select</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="client_fullname"
                    placeholder="e.g., Debrah Nyatichi"
                    value={formData.client_fullname}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Surname</label>
                  <input
                    type="text"
                    className="form-control"
                    name="client_surname"
                    placeholder="e.g., Kemunto"
                    value={formData.client_surname}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>ID Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="client_id_no"
                    placeholder="e.g., 11135490"
                    value={formData.client_id_no}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="client_phone"
                    placeholder="e.g., 254722758906"
                    value={formData.client_phone}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="client_email"
                    placeholder="client@email.com"
                    value={formData.client_email}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>

            <h6 className="mb-3 mt-3" style={{ color: '#c70e2a' }}>Policy Details</h6>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Policy Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="policy_number"
                    placeholder="e.g., EDUKN632303"
                    value={formData.policy_number}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Product Type</label>
                  <input
                    type="text"
                    className="form-control"
                    name="product_type"
                    placeholder="e.g., Education Policy"
                    value={formData.product_type}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Inception Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="inception_date"
                    value={formData.inception_date}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Strike Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="strike_date"
                    value={formData.strike_date}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Policy Status</label>
                  <select
                    className="form-control"
                    name="policy_status"
                    value={formData.policy_status}
                    onChange={handleFormChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Finalised Policy">Finalised</option>
                    <option value="Unfinalised Policy">Unfinalised</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Premium Frequency</label>
                  <select
                    className="form-control"
                    name="premium_frequency"
                    value={formData.premium_frequency}
                    onChange={handleFormChange}
                  >
                    <option value="">Select</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Total Sum Insured (KES)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="total_sum_insured"
                    placeholder="0.00"
                    value={formData.total_sum_insured}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Annualised Premium (KES)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="annualised_premium"
                    placeholder="0.00"
                    value={formData.annualised_premium}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Initial Gross Premium (KES)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="initial_gross_premium"
                    placeholder="0.00"
                    value={formData.initial_gross_premium}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>New Gross Premium (KES)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="new_gross_premium"
                    placeholder="0.00"
                    value={formData.new_gross_premium}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Sales Branch</label>
                  <input
                    type="text"
                    className="form-control"
                    name="sales_branch"
                    placeholder="Branch name"
                    value={formData.sales_branch}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Agent Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="agent_name"
                    placeholder="Agent full name"
                    value={formData.agent_name}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Agent Code</label>
                  <input
                    type="text"
                    className="form-control"
                    name="agent_code"
                    placeholder="e.g., HISA0001"
                    value={formData.agent_code}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#c70e2a', borderColor: '#c70e2a' }}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Client & Policy'}
              </button>
            </div>
          </form>
        ),
      };
    }

    if (!selectedPolicy) return { title: '', body: null, confirmText: '', confirmClass: '' };

    if (modalAction === 'view') {
      return {
        title: 'Policy Details',
        body: (
          <div>
            <div className="row mb-2">
              <div className="col-4 fw-bold">Policy Number:</div>
              <div className="col-8">{selectedPolicy.policy_number}</div>
            </div>
            <div className="row mb-2">
              <div className="col-4 fw-bold">Client:</div>
              <div className="col-8">{selectedPolicy.client_name}</div>
            </div>
            <div className="row mb-2">
              <div className="col-4 fw-bold">Product Type:</div>
              <div className="col-8">{selectedPolicy.product_type}</div>
            </div>
            <div className="row mb-2">
              <div className="col-4 fw-bold">Status:</div>
              <div className="col-8">{selectedPolicy.policy_status}</div>
            </div>
            <div className="row mb-2">
              <div className="col-4 fw-bold">Premium:</div>
              <div className="col-8">KES {formatCurrency(selectedPolicy.annualised_premium)}</div>
            </div>
            <div className="row mb-2">
              <div className="col-4 fw-bold">Frequency:</div>
              <div className="col-8">{selectedPolicy.premium_frequency}</div>
            </div>
            <div className="row mb-2">
              <div className="col-4 fw-bold">Inception Date:</div>
              <div className="col-8">{selectedPolicy.inception_date ? new Date(selectedPolicy.inception_date).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div className="row mb-2">
              <div className="col-4 fw-bold">Agent:</div>
              <div className="col-8">{selectedPolicy.agent_name || 'N/A'}</div>
            </div>
          </div>
        ),
        confirmText: 'Close',
        confirmClass: 'btn-secondary',
      };
    }

    if (modalAction === 'edit') {
      return {
        title: 'Edit Policy',
        body: (
          <div>
            <p>Edit functionality coming soon...</p>
            <p className="text-muted">Policy: {selectedPolicy.policy_number}</p>
          </div>
        ),
        confirmText: 'Close',
        confirmClass: 'btn-secondary',
      };
    }

    if (modalAction === 'delete') {
      return {
        title: 'Delete Policy',
        body: (
          <p>Are you sure you want to delete policy <strong>{selectedPolicy.policy_number}</strong> for client <strong>{selectedPolicy.client_name}</strong>?</p>
        ),
        confirmText: 'Yes, Delete',
        confirmClass: 'btn-danger',
      };
    }

    return { title: '', body: null, confirmText: '', confirmClass: '' };
  };

  const modalContent = getModalContent();

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-8">
                <h3 className="page-title">Businesses</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Businesses</li>
                </ul>
              </div>
              <div className="col-sm-4 text-end">
                <button
                  className="btn btn-primary"
                  onClick={() => openModal('add')}
                  style={{ backgroundColor: '#c70e2a', borderColor: '#c70e2a' }}
                >
                  <Plus size={16} className="me-1" /> Add Business
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <div className="row align-items-center">
                    <div className="col">
                      <h5 className="card-title mb-0">All Businesses</h5>
                      <p className="text-muted mb-0">
                        Total: <strong className="text-dark">{filteredData.length}</strong> policies
                      </p>
                    </div>
                    <div className="col-auto">
                      <div className="form-group mb-0">
                        <div className="input-group">
                          <span className="input-group-text bg-white">
                            <Search size={16} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search policies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ minWidth: '250px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <Table
                      loading={loading}
                      pagination={{
                        total: filteredData.length,
                        showTotal: (total, range) =>
                          `Showing ${range[0]} to ${range[1]} of ${total} entries`,
                        showSizeChanger: true,
                        onShowSizeChange: onShowSizeChange,
                        itemRender: itemRender,
                        defaultPageSize: 25,
                      }}
                      style={{ overflowX: "auto" }}
                      columns={columns}
                      dataSource={filteredData}
                      rowKey={(record) => record.id}
                      locale={{
                        emptyText: 'No policies found'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '800px' }}>
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#c70e2a', color: '#fff' }}>
                <h5 className="modal-title" style={{ color: '#fff' }}>{modalContent.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  aria-label="Close"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div className="modal-body">
                {modalContent.body}
              </div>
              {modalAction !== 'add' && (
                <div className="modal-footer">
                  <button
                    type="button"
                    className={`btn ${modalContent.confirmClass}`}
                    onClick={modalAction === 'delete' ? confirmDelete : closeModal}
                  >
                    {modalContent.confirmText}
                  </button>
                  {modalAction !== 'delete' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBusinesses;

// import { useState, useEffect } from 'react';
// import { Table } from "antd";
// import "bootstrap/dist/css/bootstrap.css";
// import "bootstrap-daterangepicker/daterangepicker.css";
// import { itemRender, onShowSizeChange } from "../paginationfunction";
// import SidebarNav from "../sidebar";
// import { Link } from "react-router-dom";
// import Header from "../header";
// import { Eye, Edit, Trash2, FileText, Search } from 'react-feather';
// import { policyService } from '../../services/policy';

// interface Policy {
//   id: string;
//   policy_number: string;
//   client_name: string;
//   client_id: string;
//   product_type: string;
//   policy_status: string;
//   premium_frequency: string;
//   annualised_premium: number;
//   inception_date: string;
//   agent_name: string;
//   agent_code: string;
//   sales_branch: string;
// }

// const AdminBusinesses = () => {
//   const [data, setData] = useState<Policy[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');

//   // Load policies
//   const loadPolicies = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const response = await policyService.getPolicies();
//       if (response.success) {
//         setData(response.data);
//       } else {
//         setError('Failed to load policies');
//       }
//     } catch (err: any) {
//       setError(err.error || 'Failed to load policies');
//       console.error('Error loading policies:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadPolicies();
//   }, []);

//   // Handle delete
//   const handleDelete = async (id: string, policyNumber: string) => {
//     if (!window.confirm(`Are you sure you want to delete policy ${policyNumber}?`)) return;
    
//     try {
//       const response = await policyService.deletePolicy(id);
//       if (response.success) {
//         loadPolicies();
//       } else {
//         alert('Failed to delete policy');
//       }
//     } catch (err: any) {
//       alert(err.error || 'Failed to delete policy');
//       console.error('Delete error:', err);
//     }
//   };

//   // Get initials for avatar
//   const getInitials = (name: string) => {
//     if (!name) return 'U';
//     const parts = name.trim().split(' ');
//     if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
//     return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
//   };

//   // Get avatar color
//   const getAvatarColor = (name: string) => {
//     const colors = ['#c70e2a', '#2a9d36', '#F15A29', '#2c3e8f', '#17a2b8', '#6f42c1'];
//     const index = (name?.length || 0) % colors.length;
//     return colors[index];
//   };

//   // Format currency
//   const formatCurrency = (value: number) => {
//     if (!value) return '0';
//     return value.toLocaleString();
//   };

//   // Filter data based on search
//   const filteredData = data.filter(item => {
//     if (!searchTerm) return true;
//     const search = searchTerm.toLowerCase();
//     return (
//       item.policy_number?.toLowerCase().includes(search) ||
//       item.client_name?.toLowerCase().includes(search) ||
//       item.product_type?.toLowerCase().includes(search) ||
//       item.policy_status?.toLowerCase().includes(search) ||
//       item.agent_name?.toLowerCase().includes(search) ||
//       item.policy_number?.toLowerCase().includes(search)
//     );
//   });

//   const columns = [
//     {
//       title: "Policy Number",
//       dataIndex: "policy_number",
//       render: (text: string) => (
//         <Link to={`/businesses/${text}`} className="text-decoration-none" style={{ color: '#c70e2a' }}>
//           <FileText size={16} className="me-1" />
//           <span className="fw-bold">{text || 'N/A'}</span>
//         </Link>
//       ),
//       sorter: (a: any, b: any) => (a.policy_number || '').localeCompare(b.policy_number || ''),
//     },
//     {
//   title: "Client Name",
//   dataIndex: "client_name",
//   render: (text: string, record: any) => {
//     // text is now the combined full name
//     const fullName = text || 'N/A';
    
//     return (
//       <>
//         <span 
//           className="avatar mx-2 rounded-circle d-inline-flex align-items-center justify-content-center"
//           style={{
//             width: '35px',
//             height: '35px',
//             backgroundColor: getAvatarColor(fullName),
//             color: '#fff',
//             fontSize: '14px',
//             fontWeight: 'bold',
//             textTransform: 'uppercase'
//           }}
//         >
//           {getInitials(fullName)}
//         </span>
//         <Link to={`/clients/${record.client_id}`} className="text-decoration-none text-dark">
//           {fullName}
//         </Link>
//       </>
//     );
//   },
//   sorter: (a: any, b: any) => {
//     const nameA = a.client_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || '';
//     const nameB = b.client_name || `${b.first_name || ''} ${b.last_name || ''}`.trim() || '';
//     return nameA.localeCompare(nameB);
//   },
// },
//     {
//       title: "Product Type",
//       dataIndex: "product_type",
//       render: (text: string) => <span>{text || 'N/A'}</span>,
//       sorter: (a: any, b: any) => (a.product_type || '').localeCompare(b.product_type || ''),
//     },
//     {
//       title: "Status",
//       dataIndex: "policy_status",
//       render: (status: string) => {
//         let badgeClass = 'bg-secondary';
//         let displayText = status || 'N/A';
        
//         if (status?.toLowerCase().includes('finalised')) {
//           badgeClass = 'bg-success';
//         } else if (status?.toLowerCase().includes('unfinalised')) {
//           badgeClass = 'bg-warning text-dark';
//         } else if (status?.toLowerCase().includes('cancelled')) {
//           badgeClass = 'bg-danger';
//         } else if (status?.toLowerCase().includes('active')) {
//           badgeClass = 'bg-success';
//         }
        
//         return (
//           <span className={`badge ${badgeClass} p-2`} style={{ minWidth: '80px' }}>
//             {displayText}
//           </span>
//         );
//       },
//       sorter: (a: any, b: any) => (a.policy_status || '').localeCompare(b.policy_status || ''),
//     },
//     {
//       title: "Premium (KES)",
//       dataIndex: "annualised_premium",
//       render: (value: number) => (
//         <span className="fw-bold" style={{ color: '#2a9d36' }}>
//           KES {formatCurrency(value)}
//         </span>
//       ),
//       sorter: (a: any, b: any) => (a.annualised_premium || 0) - (b.annualised_premium || 0),
//     },
//     {
//       title: "Frequency",
//       dataIndex: "premium_frequency",
//       render: (text: string) => <span>{text || 'N/A'}</span>,
//     },
//     {
//       title: "Inception Date",
//       dataIndex: "inception_date",
//       render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
//       sorter: (a: any, b: any) => 
//         new Date(a.inception_date).getTime() - new Date(b.inception_date).getTime(),
//     },
//     {
//       title: "Agent",
//       dataIndex: "agent_name",
//       render: (text: string) => (
//         <span className="text-muted">{text || 'N/A'}</span>
//       ),
//     },
//     {
//       title: "Action",
//       dataIndex: "",
//       className: "text-end",
//       render: (_: any, record: any) => (
//         <div className="text-end">
//           <Link
//             className="btn btn-sm me-2"
//             to={`/businesses/${record.id}`}
//             title="View"
//             style={{ backgroundColor: '#17a2b8', color: '#fff', border: 'none' }}
//           >
//             <Eye size={16} />
//           </Link>
//           <Link
//             className="btn btn-sm me-2"
//             to={`/businesses/edit/${record.id}`}
//             title="Edit"
//             style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none' }}
//           >
//             <Edit size={16} />
//           </Link>
//           <button
//             className="btn btn-sm"
//             onClick={() => handleDelete(record.id, record.policy_number)}
//             title="Delete"
//             style={{ backgroundColor: '#c70e2a', color: '#fff', border: 'none' }}
//           >
//             <Trash2 size={16} />
//           </button>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <>
//       <Header />
//       <SidebarNav />
//       <div className="page-wrapper">
//         <div className="content container-fluid">
//           {/* Page Header */}
//           <div className="page-header">
//             <div className="row">
//               <div className="col-sm-8">
//                 <h3 className="page-title">Businesses</h3>
//                 <ul className="breadcrumb">
//                   <li className="breadcrumb-item">
//                     <Link to="/admin-dashboard">Dashboard</Link>
//                   </li>
//                   <li className="breadcrumb-item active">Businesses</li>
//                 </ul>
//               </div>
//               <div className="col-sm-4 text-end">
//                 <Link 
//                   to="/businesses/add" 
//                   className="btn btn-primary"
//                   style={{ backgroundColor: '#c70e2a', borderColor: '#c70e2a' }}
//                 >
//                   <i className="fas fa-plus me-1" /> Add Business
//                 </Link>
//               </div>
//             </div>
//           </div>
//           {/* /Page Header */}

//           {error && (
//             <div className="alert alert-danger" role="alert">
//               {error}
//             </div>
//           )}

//           <div className="row">
//             <div className="col-sm-12">
//               <div className="card">
//                 <div className="card-header">
//                   <div className="row align-items-center">
//                     <div className="col">
//                       <h5 className="card-title mb-0">All Businesses</h5>
//                       <p className="text-muted mb-0">
//                         Total: <strong className="text-dark">{filteredData.length}</strong> policies
//                       </p>
//                     </div>
//                     <div className="col-auto">
//                       <div className="form-group mb-0">
//                         <div className="input-group">
//                           <span className="input-group-text bg-white">
//                             <Search size={16} className="text-muted" />
//                           </span>
//                           <input
//                             type="text"
//                             className="form-control"
//                             placeholder="Search policies..."
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                             style={{ minWidth: '250px' }}
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="card-body">
//                   <div className="table-responsive">
//                     <Table
//                       loading={loading}
//                       pagination={{
//                         total: filteredData.length,
//                         showTotal: (total, range) =>
//                           `Showing ${range[0]} to ${range[1]} of ${total} entries`,
//                         showSizeChanger: true,
//                         onShowSizeChange: onShowSizeChange,
//                         itemRender: itemRender,
//                         defaultPageSize: 25,
//                       }}
//                       style={{ overflowX: "auto" }}
//                       columns={columns}
//                       dataSource={filteredData}
//                       rowKey={(record) => record.id}
//                       locale={{
//                         emptyText: 'No policies found'
//                       }}
//                     />
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

// export default AdminBusinesses;

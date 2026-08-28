import { useState, useEffect } from 'react';
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import SidebarNav from "../sidebar";
import { Link } from "react-router-dom";
import Header from "../header";
import { Eye, Edit, Trash2, FileText, Search, Upload, CheckCircle, XCircle, AlertCircle } from 'react-feather';
import { policyService } from '../../services/policy';

interface Policy {
  id: string;
  policy_number: string;
  client_name: string;
  full_name: string;
  client_id: string;
  title: string;
  product_type: string;
  policy_status: string;
  premium_frequency: string;
  total_sum_insured: number;
  annualised_premium: number;
  initial_gross_premium: number;
  new_gross_premium: number;
  inception_date: string;
  strike_date: number;
  agent_name: string;
  agent_code: string;
  sales_branch: string;
  updated_at: string;
}

const AdminBusinesses = () => {
  const [data, setData] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'view' | 'delete' | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<{
    newClients: number;
    updatedClients: number;
    newPolicies: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Policy history state
const [policyHistory, setPolicyHistory] = useState<any[]>([]);
const [loadingHistory, setLoadingHistory] = useState(false);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setUploadFile(file);
    setUploadStatus('idle');
    setUploadResult(null);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadFile) return;

    setUploadStatus('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await policyService.importExcel(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setUploadStatus('success');
        setUploadResult(response.data);
        await loadPolicies();
      } else {
        setUploadStatus('error');
        setUploadResult({
          newClients: 0,
          updatedClients: 0,
          newPolicies: 0,
          skipped: 0,
          errors: [response.error || 'Import failed']
        });
      }
    } catch (err: any) {
      setUploadStatus('error');
      setUploadResult({
        newClients: 0,
        updatedClients: 0,
        newPolicies: 0,
        skipped: 0,
        errors: [err.error || 'Import failed']
      });
    }
  };

  // Reset upload modal
  const resetUploadModal = () => {
    setUploadModalOpen(false);
    setUploadFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setUploadResult(null);
  };

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
const openModal = async (action: 'view' | 'delete', policy: Policy) => {
  setModalAction(action);
  setSelectedPolicy(policy);
  setModalOpen(true);
  
  // Load policy history when viewing
  if (action === 'view') {
    setLoadingHistory(true);
    try {
      const response = await policyService.getPolicyHistory(policy.id);
      if (response.success) {
        setPolicyHistory(response.data);
      }
    } catch (err) {
      console.error('Error loading policy history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }
};

  // Close modal
  const closeModal = () => {
  setModalOpen(false);
  setModalAction(null);
  setSelectedPolicy(null);
  setPolicyHistory([]); // Clear history
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
    const colors = [ '#2c3e8f', '#17a2b8', '#6f42c1'];
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
      item.agent_name?.toLowerCase().includes(search) ||
      item.sales_branch?.toLowerCase().includes(search)
    );
  });

  const columns = [
  {
    title: "Policy Number",
    dataIndex: "policy_number",
    width: 150,
    render: (text: string) => (
      <span style={{ color: '#2a9d36', fontWeight: 'bold' }}>
        <FileText size={14} className="me-1" />
        {text || 'N/A'}
      </span>
    ),
    sorter: (a: any, b: any) => (a.policy_number || '').localeCompare(b.policy_number || ''),
  },
  {
    title: "Client",
    dataIndex: "client_name",
    width: 180,
    render: (text: string) => {
      const displayName = text || 'N/A';
      return (
        <div className="d-flex align-items-center">
          <span 
            className="avatar me-2 rounded-circle d-inline-flex align-items-center justify-content-center"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: getAvatarColor(displayName),
              color: '#fff',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}
          >
            {getInitials(displayName)}
          </span>
          <span className="text-dark">{displayName}</span>
        </div>
      );
    },
    sorter: (a: any, b: any) => (a.client_name || '').localeCompare(b.client_name || ''),
  },
  {
    title: "Status",
    dataIndex: "policy_status",
    width: 130,
    render: (status: string) => {
      let badgeClass = 'bg-secondary';
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
        <span className={`badge ${badgeClass} px-2 py-1`} style={{ fontSize: '11px', minWidth: '80px' }}>
          {status || 'not given'}
        </span>
      );
    },
    sorter: (a: any, b: any) => (a.policy_status || '').localeCompare(b.policy_status || ''),
  },
  {
    title: "Frequency",
    dataIndex: "premium_frequency",
    width: 100,
    render: (text: string) => <span>{text || 'N/A'}</span>,
  },
  {
    title: "Initial Premium (KES)",
    dataIndex: "initial_gross_premium",
    width: 140,
    render: (value: number) => (
      <span style={{ fontWeight: '500' }}>KES {formatCurrency(value)}</span>
    ),
    sorter: (a: any, b: any) => (a.initial_gross_premium || 0) - (b.initial_gross_premium || 0),
  },
  {
    title: "New Premium (KES)",
    dataIndex: "new_gross_premium",
    width: 140,
    render: (value: number) => (
      <span style={{ fontWeight: '500', color: '#2a9d36' }}>KES {formatCurrency(value)}</span>
    ),
    sorter: (a: any, b: any) => (a.new_gross_premium || 0) - (b.new_gross_premium || 0),
  },
  {
    title: "Strike Day",
    dataIndex: "strike_date",
    width: 100,
    render: (value: number) => {
      if (!value && value !== 0) return 'not given';
      const num = Number(value);
      if (isNaN(num)) return 'N/A';
      const mod100 = num % 100;
      const mod10 = num % 10;
      let ordinal = 'th';
      if (mod100 >= 11 && mod100 <= 13) {
        ordinal = 'th';
      } else if (mod10 === 1) {
        ordinal = 'st';
      } else if (mod10 === 2) {
        ordinal = 'nd';
      } else if (mod10 === 3) {
        ordinal = 'rd';
      }
      return <span>{num}{ordinal}</span>;
    },
    sorter: (a: any, b: any) => (a.strike_date || 0) - (b.strike_date || 0),
  },
  {
    title: "Sum Insured (KES)",
    dataIndex: "total_sum_insured",
    width: 140,
    render: (value: number) => (
      <span style={{ fontWeight: '500' }}>KES {formatCurrency(value)}</span>
    ),
    sorter: (a: any, b: any) => (a.total_sum_insured || 0) - (b.total_sum_insured || 0),
  },
  {
    title: "Agent",
    dataIndex: "agent_name",
    width: 140,
    render: (text: string) => <span className="text-muted">{text || 'N/A'}</span>,
    sorter: (a: any, b: any) => (a.agent_name || '').localeCompare(b.agent_name || ''),
  },
  {
    title: "Last Updated",
    dataIndex: "updated_at",
    width: 150,
    render: (date: string) => {
      if (!date) return 'N/A';
      const updated = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - updated.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      let timeAgo = '';
      if (diffMins < 1) {
        timeAgo = 'Just now';
      } else if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else {
        timeAgo = `${diffDays}d ago`;
      }
      
      return (
        <span style={{ fontSize: '12px' }}>
          {updated.toLocaleDateString()} {updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <br />
          <span style={{ color: '#999', fontSize: '11px' }}>{timeAgo}</span>
        </span>
      );
    },
    sorter: (a: any, b: any) => 
      new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
  },
  {
    title: "Action",
    dataIndex: "",
    width: 120,
    className: "text-end",
    render: (_: any, record: Policy) => (
      <div className="text-end">
        <button
          className="btn btn-sm me-1"
          onClick={() => openModal('view', record)}
          title="View"
          style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none', padding: '4px 8px' }}
        >
          <Eye size={14} />
        </button>
        <button
          className="btn btn-sm me-1"
          disabled
          title="Edit (Coming soon)"
          style={{ 
            backgroundColor: '#6c757d', 
            color: '#fff', 
            border: 'none', 
            padding: '4px 8px',
            opacity: 0.5,
            cursor: 'not-allowed'
          }}
        >
          <Edit size={14} />
        </button>
        <button
          className="btn btn-sm"
          onClick={() => openModal('delete', record)}
          title="Delete"
          style={{ backgroundColor: '#c70e2a', color: '#fff', border: 'none', padding: '4px 8px' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    ),
  },
];

  // Get modal content
  const getModalContent = () => {
    if (modalAction === 'delete' && selectedPolicy) {
      return {
        title: 'Delete Policy',
        body: (
          <div>
            <p>Are you sure you want to delete policy <strong>{selectedPolicy.policy_number}</strong>?</p>
            <p className="text-muted">Client: {selectedPolicy.client_name}</p>
            <p className="text-danger">This action cannot be undone.</p>
          </div>
        ),
        footer: (
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button 
              type="button" 
              className="btn" 
              onClick={confirmDelete}
              style={{ backgroundColor: '#c70e2a', color: '#fff', borderColor: '#c70e2a' }}
            >
              Yes, Delete
            </button>
          </div>
        ),
      };
    }

    if (modalAction === 'view' && selectedPolicy) {
  return {
    title: 'Policy Details',
    body: (
      <div>
        {/* Policy Header */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          borderLeft: '4px solid #c70e2a'
        }}>
          <div className="row">
            <div className="col-6">
              <span style={{ color: '#999', fontSize: '12px' }}>Policy Number</span>
              <h5 style={{ color: '#c70e2a', fontWeight: 'bold', marginBottom: '0' }}>
                {selectedPolicy.policy_number}
              </h5>
            </div>
            <div className="col-6 text-end">
              <span style={{ color: '#999', fontSize: '12px' }}>Status</span>
              <div>
                <span className={`badge ${selectedPolicy.policy_status?.toLowerCase().includes('finalised') ? 'bg-success' : 
                  selectedPolicy.policy_status?.toLowerCase().includes('unfinalised') ? 'bg-warning text-dark' :
                  selectedPolicy.policy_status?.toLowerCase().includes('cancelled') ? 'bg-danger' : 'bg-secondary'}`} 
                  style={{ fontSize: '14px', padding: '5px 15px' }}>
                  {selectedPolicy.policy_status || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="row">
          {/* Left Column */}
          <div className="col-6">
            <div style={{ marginBottom: '15px' }}>
  <span style={{ color: '#999', fontSize: '12px' }}>Client</span>
  <div style={{ fontWeight: '500' }}>
    {selectedPolicy.title && selectedPolicy.title.trim() !== '' ? `${selectedPolicy.title} ` : ''}{selectedPolicy.client_name || 'N/A'}
  </div>
</div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Client ID</span>
              <div style={{ fontWeight: '500' }}>{selectedPolicy.client_id || 'N/A'}</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Product Type</span>
              <div style={{ fontWeight: '500' }}>{selectedPolicy.product_type || 'N/A'}</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Premium Frequency</span>
              <div style={{ fontWeight: '500' }}>{selectedPolicy.premium_frequency || 'N/A'}</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Inception Date</span>
              <div style={{ fontWeight: '500' }}>{selectedPolicy.inception_date ? new Date(selectedPolicy.inception_date).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-6">
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Strike Day</span>
              <div style={{ fontWeight: '500' }}>{selectedPolicy.strike_date || 'N/A'}</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Total Sum Insured</span>
              <div style={{ fontWeight: '500', color: '#2a9d36' }}>KES {formatCurrency(selectedPolicy.total_sum_insured)}</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Annualised Premium</span>
              <div style={{ fontWeight: '500', color: '#2a9d36' }}>KES {formatCurrency(selectedPolicy.annualised_premium)}</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Initial Gross Premium</span>
              <div style={{ fontWeight: '500' }}>KES {formatCurrency(selectedPolicy.initial_gross_premium)}</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>New Gross Premium</span>
              <div style={{ fontWeight: '500', color: '#c70e2a' }}>KES {formatCurrency(selectedPolicy.new_gross_premium)}</div>
            </div>
          </div>
        </div>

        {/* Agent & Branch Section */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '12px 15px', 
          borderRadius: '8px',
          marginTop: '10px',
          marginBottom: '15px'
        }}>
          <div className="row">
            <div className="col-6">
              <span style={{ color: '#999', fontSize: '12px' }}>Agent</span>
              <div style={{ fontWeight: '500' }}>{selectedPolicy.agent_name || 'N/A'}</div>
              <span style={{ color: '#999', fontSize: '12px' }}>Agent Code</span>
              <div style={{ fontWeight: '500' }}>{selectedPolicy.agent_code || 'N/A'}</div>
            </div>
            <div className="col-6">
              <span style={{ color: '#999', fontSize: '12px' }}>Sales Branch</span>
              <div style={{ fontWeight: '500' }}>{selectedPolicy.sales_branch || 'N/A'}</div>
              <span style={{ color: '#999', fontSize: '12px' }}>Last Updated</span>
              <div style={{ fontWeight: '500' }}>{selectedPolicy.updated_at ? new Date(selectedPolicy.updated_at).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Change History Section */}
        <hr />
        <h6 className="mt-3" style={{ color: '#c70e2a' }}>📋 Change History</h6>
        {loadingHistory ? (
          <p className="text-muted" style={{ fontSize: '13px' }}>Loading history...</p>
        ) : policyHistory.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '13px' }}>No changes recorded</p>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {policyHistory.map((change: any, idx: number) => (
              <div key={idx} style={{ 
                padding: '8px 12px', 
                marginBottom: '5px', 
                backgroundColor: change.field === 'Status' ? '#fdf0f2' : '#f8f9fa', 
                borderRadius: '4px',
                fontSize: '13px',
                borderLeft: change.field === 'Status' ? '3px solid #c70e2a' : '3px solid #2a9d36'
              }}>
                <span style={{ fontWeight: '500' }}>{change.field}:</span>
                <span style={{ color: '#c70e2a' }}>{change.old_value}</span>
                <span style={{ margin: '0 5px', color: '#999' }}>→</span>
                <span style={{ color: '#2a9d36' }}>{change.new_value}</span>
                <span style={{ color: '#999', fontSize: '11px', marginLeft: '10px' }}>
                  {new Date(change.changed_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    footer: (
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
      </div>
    ),
  };
}

    return { title: '', body: null, footer: null };
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
              <div className="col-sm-7">
                <h3 className="page-title">Businesses / Policies</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Businesses</li>
                </ul>
              </div>
              <div className="col-sm-5 text-end">
                <button
                  className="btn btn-primary"
                  onClick={() => setUploadModalOpen(true)}
                  style={{ backgroundColor: '#2a9d36', borderColor: '#2a9d36' }}
                >
                  <Upload size={16} className="me-1" /> Update Policies
                </button>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <div className="row align-items-center">
                    <div className="col">
                      <h5 className="card-title mb-0">All Policies</h5>
                      <p className="text-muted mb-0">
                        Total: <strong>{filteredData.length}</strong> policies
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
                          `Showing ${range[0]} to ${range[1]} of ${total} policies`,
                        showSizeChanger: true,
                        onShowSizeChange: onShowSizeChange,
                        itemRender: itemRender,
                        defaultPageSize: 25,
                      }}
                      style={{ overflowX: "auto" }}
                      columns={columns}
                      dataSource={filteredData}
                      rowKey={(record) => record.id}
                      locale={{ emptyText: 'No policies found' }}
                      scroll={{ x: 1800 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete/View Modal */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '800px' }}>
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#c70e2a', color: '#fff' }}>
                <h5 className="modal-title" style={{ color: '#fff' }}>{modalContent.title}</h5>
                <button type="button" className="btn-close" onClick={closeModal} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div className="modal-body">
                {modalContent.body}
              </div>
              {modalContent.footer}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '600px' }}>
            <div className="modal-content">
              {/* Modal Header */}
              <div className="modal-header" style={{ backgroundColor: '#c70e2a', color: '#fff' }}>
                <h5 className="modal-title" style={{ color: '#fff' }}>
                  <Upload size={18} className="me-2" /> Update Policies
                </h5>
                <button type="button" className="btn-close" onClick={resetUploadModal} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>

              {/* Modal Body */}
              <div className="modal-body" style={{ padding: '25px' }}>
                {/* Drag & Drop Area */}
                {uploadStatus === 'idle' && (
                  <div
                    className="drop-zone"
                    style={{
                      border: '2px dashed #c70e2a',
                      borderRadius: '10px',
                      padding: '40px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#fdf0f2',
                      transition: 'all 0.3s ease'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.backgroundColor = '#fce4e8';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fdf0f2';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                        handleFileSelect(file);
                      }
                    }}
                    onClick={() => document.getElementById('fileInput')?.click()}
                  >
                    <FileText size={48} style={{ color: '#c70e2a', marginBottom: '15px' }} />
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                      Drag & drop your Excel file here
                    </p>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      or <span style={{ color: '#c70e2a', fontWeight: '500' }}>browse</span> to select a file
                    </p>
                    <p style={{ fontSize: '12px', color: '#999' }}>
                      Supports .xlsx and .xls files
                    </p>
                    <input
                      id="fileInput"
                      type="file"
                      accept=".xlsx,.xls"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                  </div>
                )}

                {/* File Selected */}
                {uploadFile && uploadStatus === 'idle' && (
                  <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <FileText size={24} style={{ color: '#2a9d36' }} />
                        <span style={{ marginLeft: '10px', fontWeight: '500' }}>{uploadFile.name}</span>
                        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>
                          ({(uploadFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        className="btn btn-sm"
                        onClick={() => setUploadFile(null)}
                        style={{ color: '#c70e2a', background: 'none', border: 'none' }}
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                    <div style={{ marginTop: '15px' }}>
                      <button
                        className="btn w-100"
                        onClick={handleUpload}
                        style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none', padding: '10px' }}
                      >
                        Upload & Import
                      </button>
                    </div>
                  </div>
                )}

                {/* Uploading Progress */}
                {uploadStatus === 'uploading' && (
                  <div style={{ padding: '20px 0' }}>
                    <p style={{ textAlign: 'center', fontWeight: '500' }}>Importing data...</p>
                    <div style={{ width: '100%', backgroundColor: '#e9ecef', borderRadius: '5px', overflow: 'hidden', height: '20px' }}>
                      <div
                        style={{
                          width: `${uploadProgress}%`,
                          backgroundColor: '#c70e2a',
                          height: '100%',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '10px' }}>
                      {uploadProgress < 100 ? `Processing... ${uploadProgress}%` : 'Processing...'}
                    </p>
                  </div>
                )}

                {/* Success Result */}
                {uploadStatus === 'success' && uploadResult && (
                  <div style={{ padding: '10px 0' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <CheckCircle size={48} style={{ color: '#2a9d36' }} />
                      <h5 style={{ marginTop: '10px', color: '#2a9d36' }}>Import Complete!</h5>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2a9d36' }}>{uploadResult.newClients}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>New Clients</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F15A29' }}>{uploadResult.updatedClients}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Updated Clients</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2a9d36' }}>{uploadResult.newPolicies}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>New Policies</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#c70e2a' }}>{uploadResult.skipped}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Skipped</div>
                      </div>
                    </div>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fdf0f2', borderRadius: '8px' }}>
                        <p style={{ fontSize: '13px', color: '#c70e2a', marginBottom: '5px' }}>
                          <AlertCircle size={14} /> {uploadResult.errors.length} error(s) found
                        </p>
                        {uploadResult.errors.slice(0, 3).map((err, idx) => (
                          <p key={idx} style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>• {err}</p>
                        ))}
                        {uploadResult.errors.length > 3 && (
                          <p style={{ fontSize: '12px', color: '#666' }}>... and {uploadResult.errors.length - 3} more</p>
                        )}
                      </div>
                    )}
                    <button
                      className="btn w-100 mt-3"
                      onClick={resetUploadModal}
                      style={{ backgroundColor: '#c70e2a', color: '#fff', border: 'none', padding: '10px' }}
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* Error Result */}
                {uploadStatus === 'error' && uploadResult && (
                  <div style={{ padding: '10px 0' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <XCircle size={48} style={{ color: '#c70e2a' }} />
                      <h5 style={{ marginTop: '10px', color: '#c70e2a' }}>Import Failed</h5>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#fdf0f2', borderRadius: '8px' }}>
                      {uploadResult.errors.map((err, idx) => (
                        <p key={idx} style={{ color: '#c70e2a', marginBottom: '5px' }}>• {err}</p>
                      ))}
                    </div>
                    <button
                      className="btn w-100 mt-3"
                      onClick={() => {
                        setUploadStatus('idle');
                        setUploadResult(null);
                        setUploadFile(null);
                      }}
                      style={{ backgroundColor: '#c70e2a', color: '#fff', border: 'none', padding: '10px' }}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBusinesses;


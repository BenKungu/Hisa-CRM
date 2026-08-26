import { useState, useEffect } from 'react';
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import SidebarNav from "../sidebar";
import { Link } from "react-router-dom";
import Header from "../header";
import { Eye, Edit, Trash2, FileText, Search } from 'react-feather';
import { policyService } from '../../services/policy';

interface Policy {
  id: string;
  policy_number: string;
  client_name: string;
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

  // Handle delete
  const handleDelete = async (id: string, policyNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete policy ${policyNumber}?`)) return;
    
    try {
      const response = await policyService.deletePolicy(id);
      if (response.success) {
        loadPolicies();
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
      item.client_name?.toLowerCase().includes(search) ||
      item.product_type?.toLowerCase().includes(search) ||
      item.policy_status?.toLowerCase().includes(search) ||
      item.agent_name?.toLowerCase().includes(search) ||
      item.policy_number?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "Policy Number",
      dataIndex: "policy_number",
      render: (text: string) => (
        <Link to={`/businesses/${text}`} className="text-decoration-none" style={{ color: '#c70e2a' }}>
          <FileText size={16} className="me-1" />
          <span className="fw-bold">{text || 'N/A'}</span>
        </Link>
      ),
      sorter: (a: any, b: any) => (a.policy_number || '').localeCompare(b.policy_number || ''),
    },
    {
      title: "Client Name",
      dataIndex: "client_name",
      render: (text: string, record: any) => (
        <>
          <span 
            className="avatar mx-2 rounded-circle d-inline-flex align-items-center justify-content-center"
            style={{
              width: '35px',
              height: '35px',
              backgroundColor: getAvatarColor(text || record.client_id),
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}
          >
            {getInitials(text || record.client_id)}
          </span>
          <Link to={`/clients/${record.client_id}`} className="text-decoration-none text-dark">
            {text || 'N/A'}
          </Link>
        </>
      ),
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
      render: (_: any, record: any) => (
        <div className="text-end">
          <Link
            className="btn btn-sm me-2"
            to={`/businesses/${record.id}`}
            title="View"
            style={{ backgroundColor: '#17a2b8', color: '#fff', border: 'none' }}
          >
            <Eye size={16} />
          </Link>
          <Link
            className="btn btn-sm me-2"
            to={`/businesses/edit/${record.id}`}
            title="Edit"
            style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none' }}
          >
            <Edit size={16} />
          </Link>
          <button
            className="btn btn-sm"
            onClick={() => handleDelete(record.id, record.policy_number)}
            title="Delete"
            style={{ backgroundColor: '#c70e2a', color: '#fff', border: 'none' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Page Header */}
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
                <Link 
                  to="/businesses/add" 
                  className="btn btn-primary"
                  style={{ backgroundColor: '#c70e2a', borderColor: '#c70e2a' }}
                >
                  <i className="fas fa-plus me-1" /> Add Business
                </Link>
              </div>
            </div>
          </div>
          {/* /Page Header */}

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
    </>
  );
};

export default AdminBusinesses;

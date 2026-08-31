import { useState, useEffect } from 'react';
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import SidebarNav from "../sidebar";
import { Link } from "react-router-dom";
import Header from "../header";
import { Eye, Edit, Trash2, Search, FileText, Filter, X, User, Mail, Phone, Users, CheckCircle } from 'react-feather';
import { clientService } from '../../services/client';
import { policyService } from '../../services/policy';

interface Client {
  id: string;
  client_name: string;
  full_name: string;
  first_name: string;
  last_name: string;
  title: string;
  id_no: string;
  phone_no: string;
  email: string;
  date_of_registration: string;
  policy_count: number;
  finalised_count: number;
  agent_name: string;
  agent_code: string;
  created_at: string;
  updated_at: string;
}

interface Policy {
  id: string;
  policy_number: string;
  policy_status: string;
  product_type: string;
  annualised_premium: number;
  inception_date: string;
  agent_name: string;
  agent_code: string;
  client_id: string;
}

const AdminClients = () => {
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'view' | 'delete' | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientPolicies, setClientPolicies] = useState<Policy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    policyCount: [] as string[],
    status: [] as string[],
    agent: [] as string[],
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const policyCountOptions = ['0', '1-5', '6-10', '10+'];
  const statusOptions = ['Active', 'Inactive'];
  
  // Get unique agents from data
  const agentOptions = Array.from(new Set(data.map(c => c.agent_name).filter(a => a && a !== 'N/A')));

  // ============ HELPERS ============

  const formatCurrency = (value: any) => {
    if (!value && value !== 0) return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDateCompact = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const suffix = ['th', 'st', 'nd', 'rd'];
    const ordinal = (day % 100 >= 11 && day % 100 <= 13) ? 'th' : suffix[Math.min(day % 10, 3)] || 'th';
    return `${day}${ordinal} ${month} ${year}`;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#2c3e8f', '#6f42c1'];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  };

  const hasActiveFilters = () => {
    return filters.policyCount.length > 0 || filters.status.length > 0 || filters.agent.length > 0;
  };

  // ============ HANDLERS ============

  const loadClients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await clientService.getClients();
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to load clients');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load clients');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const loadClientPolicies = async (clientId: string) => {
    setLoadingPolicies(true);
    try {
      const response = await policyService.getPolicies();
      if (response.success) {
        // Filter policies by client_id
        const clientPoliciesData = response.data.filter((p: any) => p.client_id === clientId);
        setClientPolicies(clientPoliciesData);
      }
    } catch (err) {
      console.error('Error loading client policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const openModal = async (action: 'view' | 'delete', client: Client) => {
    setModalAction(action);
    setSelectedClient(client);
    setModalOpen(true);
    if (action === 'view') {
      await loadClientPolicies(client.id);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalAction(null);
    setSelectedClient(null);
    setClientPolicies([]);
  };

  const confirmDelete = async () => {
    if (!selectedClient) return;
    
    try {
      const response = await clientService.deleteClient(selectedClient.id);
      if (response.success) {
        await loadClients();
        closeModal();
      } else {
        alert(response.error || 'Failed to delete client');
      }
    } catch (err: any) {
      alert(err.error || 'Failed to delete client');
    }
  };

  // ===== FILTERED DATA =====
  const getFilteredData = () => {
    let filtered = data;

    if (filters.policyCount.length > 0) {
      filtered = filtered.filter(item => {
        const count = item.policy_count || 0;
        return filters.policyCount.some(range => {
          if (range === '0') return count === 0;
          if (range === '1-5') return count >= 1 && count <= 5;
          if (range === '6-10') return count >= 6 && count <= 10;
          if (range === '10+') return count > 10;
          return false;
        });
      });
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(item => {
        const isActive = item.policy_count > 0;
        return filters.status.some(status => {
          if (status === 'Active') return isActive;
          if (status === 'Inactive') return !isActive;
          return false;
        });
      });
    }

    if (filters.agent.length > 0) {
      filtered = filtered.filter(item => 
        filters.agent.includes(item.agent_name)
      );
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.client_name?.toLowerCase().includes(search) ||
        item.full_name?.toLowerCase().includes(search) ||
        item.id_no?.toLowerCase().includes(search) ||
        item.phone_no?.toLowerCase().includes(search) ||
        item.email?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  // ============ TABLE COLUMNS ============

  const columns = [
    {
      title: "Client",
      dataIndex: "client_name",
      width: 200,
      fixed: 'left' as const,
      render: (text: string, record: any) => {
        const displayName = text || 'N/A';
        return (
          <div className="d-flex align-items-center">
            <span 
              className="avatar me-2 rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                backgroundColor: getAvatarColor(displayName),
                color: '#fff',
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                borderRadius: '50%',
                flexShrink: 0
              }}
            >
              {getInitials(displayName)}
            </span>
            <div>
              <div style={{ fontWeight: '500', fontSize: '13px' }}>{displayName}</div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                ID: {record.id_no || 'No ID'}
              </div>
            </div>
          </div>
        );
      },
      sorter: (a: any, b: any) => (a.client_name || '').localeCompare(b.client_name || ''),
    },
    {
      title: "Phone",
      dataIndex: "phone_no",
      width: 130,
      render: (text: string) => (
        <span style={{ fontSize: '13px' }}>
          <Phone size={13} className="me-1" style={{ color: '#999' }} />
          {text || '—'}
        </span>
      ),
      sorter: (a: any, b: any) => (a.phone_no || '').localeCompare(b.phone_no || ''),
    },
    {
      title: "Email",
      dataIndex: "email",
      width: 170,
      render: (text: string) => (
        <span style={{ fontSize: '13px' }}>
          <Mail size={13} className="me-1" style={{ color: '#999' }} />
          {text || '—'}
        </span>
      ),
      sorter: (a: any, b: any) => (a.email || '').localeCompare(b.email || ''),
    },
    {
      title: "Total Policies",
      dataIndex: "policy_count",
      width: 110,
      align: 'center' as const,
      render: (count: number) => {
        const color = count > 0 ? '#2a9d36' : '#999';
        return (
          <span style={{ 
            fontWeight: '600', 
            fontSize: '15px',
            color: color,
            backgroundColor: count > 0 ? '#e8f5e9' : '#f5f5f5',
            padding: '2px 12px',
            borderRadius: '12px',
            display: 'inline-block'
          }}>
            {count || 0}
          </span>
        );
      },
      sorter: (a: any, b: any) => (a.policy_count || 0) - (b.policy_count || 0),
    },
    {
      title: "Finalised",
      dataIndex: "finalised_count",
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ 
          fontWeight: '600', 
          fontSize: '14px',
          color: '#2a9d36',
          backgroundColor: count > 0 ? '#e8f5e9' : '#f5f5f5',
          padding: '2px 10px',
          borderRadius: '12px',
          display: 'inline-block'
        }}>
          <CheckCircle size={12} className="me-1" />
          {count || 0}
        </span>
      ),
      sorter: (a: any, b: any) => (a.finalised_count || 0) - (b.finalised_count || 0),
    },
    {
      title: "Agent",
      dataIndex: "agent_name",
      width: 140,
      render: (text: string) => (
        <span style={{ fontSize: '13px', color: '#555' }}>
          <Users size={13} className="me-1" style={{ color: '#999' }} />
          {text || '—'}
        </span>
      ),
      sorter: (a: any, b: any) => (a.agent_name || '').localeCompare(b.agent_name || ''),
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      width: 130,
      render: (date: string) => {
        if (!date) return '—';
        const updated = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - updated.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        let timeAgo = '';
        if (diffMins < 1) timeAgo = 'Now';
        else if (diffMins < 60) timeAgo = `${diffMins}m`;
        else if (diffHours < 24) timeAgo = `${diffHours}h`;
        else timeAgo = `${diffDays}d`;
        return (
          <div style={{ fontSize: '11px' }}>
            <div>{formatDateCompact(date)}</div>
            <div style={{ color: '#999', fontSize: '10px' }}>{timeAgo}</div>
          </div>
        );
      },
      sorter: (a: any, b: any) => 
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    },
    {
      title: "",
      dataIndex: "",
      width: 100,
      className: "text-end",
      fixed: 'right' as const,
      render: (_: any, record: Client) => (
        <div className="text-end" style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-sm"
            onClick={() => openModal('view', record)}
            title="View"
            style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px' }}
          >
            <Eye size={13} />
          </button>
          <button
            className="btn btn-sm"
            disabled
            title="Edit (Coming soon)"
            style={{ 
              backgroundColor: '#6c757d', 
              color: '#fff', 
              border: 'none', 
              padding: '2px 6px',
              opacity: 0.4,
              cursor: 'not-allowed',
              borderRadius: '4px'
            }}
          >
            <Edit size={13} />
          </button>
          <button
            className="btn btn-sm"
            onClick={() => openModal('delete', record)}
            title="Delete"
            style={{ backgroundColor: '#c70e2a', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  // ============ MODAL CONTENT ============

  const getModalContent = () => {
    if (modalAction === 'delete' && selectedClient) {
      const hasPolicies = selectedClient.policy_count > 0;
      return {
        title: 'Delete Client',
        body: (
          <div>
            <p>Are you sure you want to delete client <strong>{selectedClient.client_name}</strong>?</p>
            <p className="text-muted">ID: {selectedClient.id_no || 'N/A'}</p>
            {hasPolicies ? (
              <p className="text-danger">
                ⚠️ This client has <strong>{selectedClient.policy_count}</strong> active policy(s). 
                You must delete all policies first before deleting this client.
              </p>
            ) : (
              <p className="text-danger">This action cannot be undone.</p>
            )}
          </div>
        ),
        footer: (
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            {!hasPolicies && (
              <button 
                type="button" 
                className="btn" 
                onClick={confirmDelete}
                style={{ backgroundColor: '#c70e2a', color: '#fff', borderColor: '#c70e2a' }}
              >
                Yes, Delete
              </button>
            )}
          </div>
        ),
      };
    }

    if (modalAction === 'view' && selectedClient) {
      const hasPolicies = clientPolicies.length > 0;
      
      // Get agent from client data
      const agentName = selectedClient.agent_name || 'N/A';
      const agentCode = selectedClient.agent_code || 'N/A';
      
      const displayName = selectedClient.client_name || 'N/A';
      // Show title in modal
      const fullNameWithTitle = selectedClient.title ? `${selectedClient.title} ${displayName}` : displayName;
      
      return {
        title: 'Client Details',
        body: (
          <div>
            {/* Client Header */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '20px',
              borderLeft: '4px solid #c70e2a',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <span 
                className="rounded-circle d-inline-flex align-items-center justify-content-center"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: getAvatarColor(displayName),
                  color: '#fff',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  flexShrink: 0
                }}
              >
                {getInitials(displayName)}
              </span>
              <div>
                <h5 style={{ marginBottom: '2px', fontWeight: '600' }}>
                  {fullNameWithTitle}
                </h5>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  ID: {selectedClient.id_no || 'N/A'} · {selectedClient.policy_count || 0} Total · {selectedClient.finalised_count || 0} Finalised
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  Agent: {agentName} {agentCode !== 'N/A' ? `(${agentCode})` : ''}
                </div>
              </div>
            </div>

            {/* Two Column Layout - All Client Data */}
            <div className="row">
              <div className="col-6">
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Full Name</span>
                  <div style={{ fontWeight: '500' }}>{fullNameWithTitle}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>First Name</span>
                  <div style={{ fontWeight: '500' }}>{selectedClient.first_name || 'N/A'}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Last Name</span>
                  <div style={{ fontWeight: '500' }}>{selectedClient.last_name || 'N/A'}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>ID Number</span>
                  <div style={{ fontWeight: '500' }}>{selectedClient.id_no || 'N/A'}</div>
                </div>
              </div>
              <div className="col-6">
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Phone</span>
                  <div style={{ fontWeight: '500' }}>{selectedClient.phone_no || 'N/A'}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Email</span>
                  <div style={{ fontWeight: '500' }}>{selectedClient.email || 'N/A'}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Total Policies</span>
                  <div style={{ fontWeight: '600', color: '#2a9d36' }}>{selectedClient.policy_count || 0}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Last Updated</span>
                  <div style={{ fontWeight: '500' }}>{selectedClient.updated_at ? formatDateCompact(selectedClient.updated_at) : 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Agent Section (if available) */}
            {agentName !== 'N/A' && (
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '10px 15px', 
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <div className="row">
                  <div className="col-6">
                    <span style={{ color: '#999', fontSize: '12px' }}>Agent Name</span>
                    <div style={{ fontWeight: '500' }}>{agentName}</div>
                  </div>
                  <div className="col-6">
                    <span style={{ color: '#999', fontSize: '12px' }}>Agent Code</span>
                    <div style={{ fontWeight: '500' }}>{agentCode}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Policies Section */}
            <hr />
            <h6 className="mt-3" style={{ color: '#c70e2a' }}>
              <FileText size={14} className="me-1" /> Policies ({clientPolicies.length})
              <span className="ms-2 text-success" style={{ fontSize: '12px' }}>
                <CheckCircle size={12} className="me-1" />
                {clientPolicies.filter(p => p.policy_status?.toLowerCase().includes('finalised')).length} Finalised
              </span>
            </h6>
            {loadingPolicies ? (
              <p className="text-muted" style={{ fontSize: '13px' }}>Loading policies...</p>
            ) : !hasPolicies ? (
              <p className="text-muted" style={{ fontSize: '13px' }}>No policies found for this client</p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {clientPolicies.map((policy, idx) => (
                  <div key={idx} style={{ 
                    padding: '8px 12px', 
                    marginBottom: '5px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    fontSize: '13px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <span style={{ fontWeight: '500' }}>{policy.policy_number}</span>
                      <span className="text-muted" style={{ fontSize: '11px', marginLeft: '10px' }}>
                        {policy.product_type || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className={`badge ${policy.policy_status?.toLowerCase().includes('finalised') ? 'bg-success' : 
                        policy.policy_status?.toLowerCase().includes('unfinalised') ? 'bg-warning text-dark' :
                        policy.policy_status?.toLowerCase().includes('cancelled') ? 'bg-danger' : 'bg-secondary'}`} 
                        style={{ fontSize: '10px' }}>
                        {policy.policy_status || 'N/A'}
                      </span>
                      <span style={{ marginLeft: '10px', fontSize: '12px', color: '#2a9d36' }}>
                        KES {formatCurrency(policy.annualised_premium)}
                      </span>
                    </div>
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

  const rowClassName = (_record: any, index: number) => {
    return index % 2 === 0 ? 'table-row-even' : 'table-row-odd';
  };

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-7">
                <h3 className="page-title">Clients</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Clients</li>
                </ul>
              </div>
              <div className="col-sm-5 text-end">
                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: '#2a9d36', borderColor: '#2a9d36' }}
                  disabled
                >
                  <User size={16} className="me-1" /> Add Client
                </button>
                <span className="text-muted ms-2" style={{ fontSize: '11px' }}>(Coming soon)</span>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                {/* ===== HEADER ===== */}
                <div className="card-header">
                  <div className="row align-items-center mb-2">
                    <div className="col">
                      <h5 className="card-title mb-0">All Clients</h5>
                      <div className="d-flex align-items-center gap-3 mt-1">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '20px', fontWeight: '700', color: '#2a9d36' }}>
                            {filteredData.length}
                          </span>
                          <span style={{ color: '#999', fontSize: '13px' }}>Total</span>
                        </div>
                        <div style={{ width: '1px', height: '20px', backgroundColor: '#dee2e6' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#2a9d36' }}>
                            {filteredData.filter(c => c.policy_count > 0).length}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>Active</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#999' }}>
                            {filteredData.filter(c => c.policy_count === 0).length}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>Inactive</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="d-flex align-items-center gap-2">
                        <div className="input-group input-group-sm" style={{ width: '200px' }}>
                          <span className="input-group-text bg-white">
                            <Search size={14} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <button
                          className="btn btn-sm"
                          onClick={() => setShowFilters(!showFilters)}
                          style={{ 
                            backgroundColor: showFilters || hasActiveFilters() ? '#c70e2a' : '#f1f3f5',
                            color: showFilters || hasActiveFilters() ? '#fff' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '12px'
                          }}
                        >
                          <Filter size={14} className="me-1" />
                          Filters
                          {hasActiveFilters() && <span className="badge bg-white text-dark ms-1" style={{ fontSize: '10px' }}>
                            {filters.policyCount.length + filters.status.length + filters.agent.length}
                          </span>}
                        </button>
                        {hasActiveFilters() && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setFilters({ policyCount: [], status: [], agent: [] });
                              setSearchTerm('');
                            }}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            <X size={12} className="me-1" /> Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ===== FILTERS ===== */}
                  {showFilters && (
                    <div className="row mt-2 pt-2" style={{ borderTop: '1px solid #eee' }}>
                      <div className="col-12">
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          {/* Policy Count Filter */}
                          <div className="dropdown">
                            <button className="btn btn-sm dropdown-toggle" 
                                    data-bs-toggle="dropdown" 
                                    style={{ 
                                      fontSize: '12px', 
                                      backgroundColor: '#f8f9fa',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '6px',
                                      padding: '4px 12px',
                                      color: '#333'
                                    }}>
                              Policies {filters.policyCount.length > 0 && <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff', marginLeft: '4px' }}>{filters.policyCount.length}</span>}
                            </button>
                            <div className="dropdown-menu p-2" style={{ minWidth: '150px' }}>
                              {policyCountOptions.map(option => (
                                <div className="form-check" key={option}>
                                  <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id={`policy-${option}`}
                                    checked={filters.policyCount.includes(option)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFilters({...filters, policyCount: [...filters.policyCount, option]});
                                      } else {
                                        setFilters({...filters, policyCount: filters.policyCount.filter(p => p !== option)});
                                      }
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor={`policy-${option}`}>
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status Filter */}
                          <div className="dropdown">
                            <button className="btn btn-sm dropdown-toggle" 
                                    data-bs-toggle="dropdown" 
                                    style={{ 
                                      fontSize: '12px', 
                                      backgroundColor: '#f8f9fa',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '6px',
                                      padding: '4px 12px',
                                      color: '#333'
                                    }}>
                              Status {filters.status.length > 0 && <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff', marginLeft: '4px' }}>{filters.status.length}</span>}
                            </button>
                            <div className="dropdown-menu p-2" style={{ minWidth: '150px' }}>
                              {statusOptions.map(option => (
                                <div className="form-check" key={option}>
                                  <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id={`status-${option}`}
                                    checked={filters.status.includes(option)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFilters({...filters, status: [...filters.status, option]});
                                      } else {
                                        setFilters({...filters, status: filters.status.filter(s => s !== option)});
                                      }
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor={`status-${option}`}>
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Agent Filter */}
                          <div className="dropdown">
                            <button className="btn btn-sm dropdown-toggle" 
                                    data-bs-toggle="dropdown" 
                                    style={{ 
                                      fontSize: '12px', 
                                      backgroundColor: '#f8f9fa',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '6px',
                                      padding: '4px 12px',
                                      color: '#333'
                                    }}>
                              Agent {filters.agent.length > 0 && <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff', marginLeft: '4px' }}>{filters.agent.length}</span>}
                            </button>
                            <div className="dropdown-menu p-2" style={{ minWidth: '180px' }}>
                              {agentOptions.map(option => (
                                <div className="form-check" key={option}>
                                  <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id={`agent-${option}`}
                                    checked={filters.agent.includes(option)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFilters({...filters, agent: [...filters.agent, option]});
                                      } else {
                                        setFilters({...filters, agent: filters.agent.filter(a => a !== option)});
                                      }
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor={`agent-${option}`}>
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-body">
                  <div className="table-responsive">
                    <Table
                      loading={loading}
                      rowClassName={rowClassName}
                      pagination={{
                        total: filteredData.length,
                        showTotal: (total, range) =>
                          `Showing ${range[0]} to ${range[1]} of ${total} clients`,
                        showSizeChanger: true,
                        onShowSizeChange: onShowSizeChange,
                        itemRender: itemRender,
                        defaultPageSize: 25,
                      }}
                      style={{ overflowX: "auto" }}
                      columns={columns}
                      dataSource={filteredData}
                      rowKey={(record) => record.id}
                      locale={{ emptyText: 'No clients found' }}
                      scroll={{ x: 1500 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .table-row-even { background-color: #ffffff; }
        .table-row-odd { background-color: #f8f9fa; }
        .table-row-even:hover, .table-row-odd:hover {
          background-color: #e8f0fe !important;
          transition: background-color 0.15s ease;
        }
        .ant-table-tbody > tr > td { padding: 10px 12px !important; }
        .ant-table-thead > tr > th {
          background-color: #f1f3f5 !important;
          font-weight: 600 !important;
          color: #333 !important;
          padding: 12px 12px !important;
          border-bottom: 2px solid #dee2e6 !important;
        }
        .ant-table-tbody > tr > td:first-child {
          border-left: 3px solid transparent;
        }
        .ant-table-tbody > tr.table-row-even:hover > td:first-child {
          border-left-color: #2a9d36;
        }
        .ant-table-tbody > tr.table-row-odd:hover > td:first-child {
          border-left-color: #2a9d36;
        }
        .avatar {
          border-radius: 50% !important;
          overflow: hidden !important;
          flex-shrink: 0 !important;
        }
      `}</style>

      {/* Modal */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '700px' }}>
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
    </>
  );
};

export default AdminClients;

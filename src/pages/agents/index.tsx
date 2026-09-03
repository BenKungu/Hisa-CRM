import { useState, useEffect } from 'react';
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import SidebarNav from "../sidebar";
import { Link } from "react-router-dom";
import Header from "../header";
import { Eye, Search, Filter, X, Users, FileText, CheckCircle, XCircle, Clock, User, Briefcase } from 'react-feather';
import { policyService } from '../../services/policy';

interface Agent {
  agent_name: string;
  agent_code: string;
  policy_count: number;
  client_count: number;
  total_premium: number;
  finalised_count: number;
  active_count: number;
  cancelled_count: number;
}

const AdminAgents = () => {
  const [data, setData] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    minPolicies: 0,
    status: [] as string[],
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const statusOptions = ['Active', 'Finalised', 'Cancelled'];
  const [downloading, setDownloading] = useState(false);

  // ============ HELPERS ============

  const formatCurrency = (value: any) => {
    if (!value && value !== 0) return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const getInitials = (name: string) => {
    if (!name || name === 'Agent not provided' || name === 'Unknown Agent') return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    if (!name || name === 'Agent not provided' || name === 'Unknown Agent') return '#999';
    const colors = ['#2c3e8f', '#6f42c1'];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  };

  const hasActiveFilters = () => {
  return filters.minPolicies > 0 || 
         filters.status.length > 0 ||
         searchTerm.trim().length > 0;   // ← Added
};

  // ============ HANDLERS ============

  const handleExport = async () => {
  if (!hasActiveFilters() && !searchTerm) return; // Only allow when filtering

  setDownloading(true);
  try {
    const params: any = {};
    if (searchTerm) params.search = searchTerm;
    if (filters.minPolicies > 0) params.minPolicies = filters.minPolicies;
    if (filters.status.length > 0) params.status = filters.status;

    const blob = await policyService.exportAgents(params);

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `agents_${new Date().toISOString().slice(0,10)}.xlsx`,
          types: [{
            description: 'Excel File',
            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (err: any) {
        if (err.name !== 'AbortError' && err.name !== 'SecurityError') {
          fallbackDownload(blob);
        }
      }
    } else {
      fallbackDownload(blob);
    }
  } catch (err) {
    alert('Failed to download agents.');
  } finally {
    setDownloading(false);
  }
};

const fallbackDownload = (blob: Blob) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `agents_${new Date().toISOString().slice(0,10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

  const loadAgents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await policyService.getAgents();
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to load agents');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load agents');
      console.error('Error loading agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const openModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAgent(null);
  };

  // ===== FILTERED DATA =====
  const getFilteredData = () => {
    let filtered = data;

    // Keep ALL agents - don't filter out the "Agent not provided" entry

    if (filters.minPolicies > 0) {
      filtered = filtered.filter(item => item.policy_count >= filters.minPolicies);
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(item => {
        return filters.status.some(status => {
          if (status === 'Active') return item.active_count > 0;
          if (status === 'Finalised') return item.finalised_count > 0;
          if (status === 'Cancelled') return item.cancelled_count > 0;
          return false;
        });
      });
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.agent_name?.toLowerCase().includes(search) ||
        item.agent_code?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  // ============ TABLE COLUMNS ============

  const columns = [
    {
  title: "Agent",
  dataIndex: "agent_name",
  width: 200,
  fixed: 'left' as const,
  render: (text: string, record: any) => {
    // Check if agent has valid name (not empty, null, undefined, or '--')
    const hasValidName = text && text !== '' && text !== '--' && text !== 'Unknown Agent' && text !== 'null' && text !== 'undefined';
    const hasValidCode = record.agent_code && record.agent_code !== '' && record.agent_code !== 'null' && record.agent_code !== 'undefined' && record.agent_code !== '--';
    
    let displayName = text;
    let isUnknown = false;
    
    if (!hasValidName && hasValidCode) {
      displayName = `Agent (${record.agent_code})`;
      isUnknown = false;
    } else if (!hasValidName && !hasValidCode) {
      displayName = 'Agent not provided';
      isUnknown = true;
    } else if (text === '--' || text === 'Unknown Agent') {
      displayName = 'Agent not provided';
      isUnknown = true;
    }
    
    return (
      <div className="d-flex align-items-center">
        <span 
          className="avatar me-2 rounded-circle d-inline-flex align-items-center justify-content-center"
          style={{
            width: '32px',
            height: '32px',
            minWidth: '32px',
            minHeight: '32px',
            backgroundColor: isUnknown ? '#999' : getAvatarColor(displayName),
            color: '#fff',
            fontSize: '13px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            borderRadius: '50%',
            flexShrink: 0
          }}
        >
          {isUnknown ? '?' : getInitials(displayName)}
        </span>
        <div>
          <div style={{ fontWeight: '500', fontSize: '13px', color: isUnknown ? '#999' : '#333' }}>
            {displayName}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            Code: {hasValidCode ? record.agent_code : 'N/A'}
          </div>
        </div>
      </div>
    );
  },
  sorter: (a: any, b: any) => (a.agent_name || '').localeCompare(b.agent_name || ''),
},
    {
      title: "Agent Code",
      dataIndex: "agent_code",
      width: 120,
      render: (text: string) => {
        const isValid = text && text !== '' && text !== 'null' && text !== 'undefined' && text !== '--';
        return (
          <span style={{ fontSize: '13px', fontWeight: '500', color: isValid ? '#555' : '#999' }}>
            <Briefcase size={13} className="me-1" style={{ color: '#999' }} />
            {isValid ? text : 'N/A'}
          </span>
        );
      },
      sorter: (a: any, b: any) => (a.agent_code || '').localeCompare(b.agent_code || ''),
    },
    {
      title: "Clients",
      dataIndex: "client_count",
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ 
          fontWeight: '600', 
          fontSize: '15px',
          color: '#2a9d36',
          backgroundColor: '#e8f5e9',
          padding: '2px 12px',
          borderRadius: '12px',
          display: 'inline-block'
        }}>
          <User size={12} className="me-1" />
          {count || 0}
        </span>
      ),
      sorter: (a: any, b: any) => (a.client_count || 0) - (b.client_count || 0),
    },
    {
      title: "Policies",
      dataIndex: "policy_count",
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ 
          fontWeight: '600', 
          fontSize: '15px',
          color: '#2c3e8f',
          backgroundColor: '#d8ddf3',
          padding: '2px 12px',
          borderRadius: '12px',
          display: 'inline-block'
        }}>
          <FileText size={12} className="me-1" />
          {count || 0}
        </span>
      ),
      sorter: (a: any, b: any) => (a.policy_count || 0) - (b.policy_count || 0),
    },
    {
      title: "Total Premium",
      dataIndex: "total_premium",
      width: 140,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ fontWeight: '600', color: '#F15A29', fontSize: '13px' }}>
          KES {formatCurrency(value)}
        </span>
      ),
      sorter: (a: any, b: any) => (a.total_premium || 0) - (b.total_premium || 0),
    },
    {
      title: "Finalised",
      dataIndex: "finalised_count",
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ 
          fontWeight: '500', 
          fontSize: '13px',
          color: count > 0 ? '#2a9d36' : '#999',
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
      title: "Cancelled",
      dataIndex: "cancelled_count",
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ 
          fontWeight: '500', 
          fontSize: '13px',
          color: count > 0 ? '#c70e2a' : '#999',
          backgroundColor: count > 0 ? '#fde8ea' : '#f5f5f5',
          padding: '2px 10px',
          borderRadius: '12px',
          display: 'inline-block'
        }}>
          <XCircle size={12} className="me-1" />
          {count || 0}
        </span>
      ),
      sorter: (a: any, b: any) => (a.cancelled_count || 0) - (b.cancelled_count || 0),
    },
    {
      title: "",
      dataIndex: "",
      width: 80,
      className: "text-end",
      fixed: 'right' as const,
      render: (_: any, record: Agent) => (
        <div className="text-end">
          <button
            className="btn btn-sm"
            onClick={() => openModal(record)}
            title="View"
            style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px' }}
          >
            <Eye size={13} />
          </button>
        </div>
      ),
    },
  ];

  // ============ MODAL CONTENT ============

  const getModalContent = () => {
    if (!selectedAgent) return { title: '', body: null, footer: null };

    const displayName = selectedAgent.agent_name || 'Agent not provided';
    const displayCode = selectedAgent.agent_code || 'N/A';

    return {
      title: 'Agent Details',
      body: (
        <div>
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
                {displayName}
              </h5>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Code: <strong>{displayCode}</strong>
              </div>
            </div>
          </div>

          <div className="row g-2">
            <div className="col-4">
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                backgroundColor: '#e8f5e9', 
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#2a9d36' }}>
                  {selectedAgent.client_count || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>Clients</div>
              </div>
            </div>
            <div className="col-4">
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                backgroundColor: '#e3f2fd', 
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#0d6efd' }}>
                  {selectedAgent.policy_count || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>Policies</div>
              </div>
            </div>
            <div className="col-4">
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#856404' }}>
                  KES {formatCurrency(selectedAgent.total_premium)}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>Total Premium</div>
              </div>
            </div>
          </div>

          <div className="row g-2 mt-2">
            <div className="col-4">
              <div style={{ 
                textAlign: 'center', 
                padding: '8px', 
                backgroundColor: '#e8f5e9', 
                borderRadius: '6px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#2a9d36' }}>
                  <CheckCircle size={14} className="me-1" />
                  {selectedAgent.finalised_count || 0}
                </span>
                <div style={{ fontSize: '10px', color: '#666' }}>Finalised</div>
              </div>
            </div>
            <div className="col-4">
              <div style={{ 
                textAlign: 'center', 
                padding: '8px', 
                backgroundColor: '#fde8ea', 
                borderRadius: '6px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#c70e2a' }}>
                  <XCircle size={14} className="me-1" />
                  {selectedAgent.cancelled_count || 0}
                </span>
                <div style={{ fontSize: '10px', color: '#666' }}>Cancelled</div>
              </div>
            </div>
            <div className="col-4">
              <div style={{ 
                textAlign: 'center', 
                padding: '8px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '6px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#fd7e14' }}>
                  <Clock size={14} className="me-1" />
                  {selectedAgent.active_count || 0}
                </span>
                <div style={{ fontSize: '10px', color: '#666' }}>Active</div>
              </div>
            </div>
          </div>
        </div>
      ),
      footer: (
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
        </div>
      ),
    };
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
                <h3 className="page-title">Agents</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Agents</li>
                </ul>
              </div>
              <div className="col-sm-5 text-end">
                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: '#2a9d36', borderColor: '#2a9d36' }}
                  disabled
                >
                  <Users size={16} className="me-1" /> Add Agent
                </button>
                <span className="text-muted ms-2" style={{ fontSize: '11px' }}>(Coming soon)</span>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <div className="row align-items-center mb-2">
                    <div className="col">
                      <h5 className="card-title mb-0">All Agents</h5>
                      <div className="d-flex align-items-center gap-3 mt-1">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '20px', fontWeight: '700', color: '#2a9d36' }}>
                            {filteredData.length}
                          </span>
                          <span style={{ color: '#999', fontSize: '13px' }}>Total Agents</span>
                        </div>
                        <div style={{ width: '1px', height: '20px', backgroundColor: '#dee2e6' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#2a9d36' }}>
                            {filteredData.reduce((sum, a) => sum + a.policy_count, 0)}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>Total Policies</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#2a9d36' }}>
                            KES {formatCurrency(filteredData.reduce((sum, a) => sum + a.total_premium, 0))}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>Total Premium</span>
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
                            placeholder="Search agents..."
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
                            {filters.status.length}
                          </span>}
                        </button>
                        {hasActiveFilters() && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setFilters({ minPolicies: 0, status: [] });
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

                  {showFilters && (
                    <div className="row mt-2 pt-2" style={{ borderTop: '1px solid #eee' }}>
                      <div className="col-12">
                        <div className="d-flex flex-wrap align-items-center gap-2">
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
                              Min Policies {filters.minPolicies > 0 && <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff', marginLeft: '4px' }}>{filters.minPolicies}</span>}
                            </button>
                            <div className="dropdown-menu p-2" style={{ minWidth: '150px' }}>
                              {[0, 1, 5, 10, 20, 50].map(num => (
                                <div className="form-check" key={num}>
                                  <input 
                                    className="form-check-input" 
                                    type="radio" 
                                    id={`min-${num}`}
                                    checked={filters.minPolicies === num}
                                    onChange={() => setFilters({...filters, minPolicies: num})}
                                  />
                                  <label className="form-check-label" htmlFor={`min-${num}`}>
                                    {num === 0 ? 'All' : `${num}+ policies`}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

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
                          <button
  className="btn"
  onClick={handleExport}
  disabled={!hasActiveFilters() || downloading}
  style={{
    backgroundColor: hasActiveFilters() ? '#2a9d36' : '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 12px',
    fontSize: '13px',
    fontWeight: '500',
    opacity: hasActiveFilters() ? 1 : 0.6,
    cursor: hasActiveFilters() ? 'pointer' : 'not-allowed'
  }}
>
  <FileText size={14} className="me-1" />
  {downloading ? 'Exporting...' : 'Download Excel'}
</button>
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
                          `Showing ${range[0]} to ${range[1]} of ${total} agents`,
                        showSizeChanger: true,
                        onShowSizeChange: onShowSizeChange,
                        itemRender: itemRender,
                        defaultPageSize: 25,
                      }}
                      style={{ overflowX: "auto" }}
                      columns={columns}
                      dataSource={filteredData}
                      rowKey={(record) => record.agent_code || record.agent_name}
                      locale={{ emptyText: 'No agents found' }}
                      scroll={{ x: 1100 }}
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

      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '500px' }}>
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

export default AdminAgents;
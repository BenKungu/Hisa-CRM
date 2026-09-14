import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Table } from 'antd';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-daterangepicker/daterangepicker.css';
import { itemRender, onShowSizeChange } from '../paginationfunction';
import SidebarNav from '../sidebar';
import Header from '../header';
import {
  Search, FileText, Users, Phone, Mail, Upload,
  Eye, X, CheckCircle, XCircle, AlertCircle
} from 'react-feather';
import { mmfService } from '../../services/mmf';
import { policyService } from '../../services/policy';

// ============================================================================
// TYPES
// ============================================================================

interface Holder {
  client_id: string;
  title: string;
  name: string;
  phone: string;
  email: string;
  policy_count: number;
}

interface MmfAccount {
  id: string;
  member_no: string;
  raw_full_name: string;
  primary_holder: Holder | null;
  other_holders: Holder[];
  holder_count: number;
  agent_name: string;
  agent_code: string;
  mobile_no: string;
  email: string;
  updated_at: string;
}

interface UploadResult {
  newClients: number;
  updatedClients: number;
  newPolicies: number;
  updatedPolicies: number;
  newMmfAccounts: number;
  updatedMmfAccounts: number;
  skipped: number;
  errors: string[];
}

// ============================================================================
// COMPONENT
// ============================================================================

const AdminMmf = () => {
  // --------------------------------------------------------------------------
  // State – data
  // --------------------------------------------------------------------------
  const [data, setData] = useState<MmfAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // --------------------------------------------------------------------------
  // State – view modal
  // --------------------------------------------------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<MmfAccount | null>(null);

  // --------------------------------------------------------------------------
  // State – upload modal
  // --------------------------------------------------------------------------
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const location = useLocation();

  // Read `?search=` query param from the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search');
    if (searchQuery) setSearchTerm(searchQuery);
  }, [location.search]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /** Two-letter uppercase initials from a full name. */
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  /** Short date with ordinal, e.g., "10th Jun 2027". */
  const formatDateCompact = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const lastTwo = day % 100;
    let suffix = 'th';
    if (lastTwo < 11 || lastTwo > 13) {
      const lastDigit = day % 10;
      if (lastDigit === 1) suffix = 'st';
      else if (lastDigit === 2) suffix = 'nd';
      else if (lastDigit === 3) suffix = 'rd';
    }
    return `${day}${suffix} ${month} ${year}`;
  };

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  const loadMmfAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await mmfService.getMmfAccounts();
      if (response.success) setData(response.data);
      else setError('Failed to load MMF accounts');
    } catch (err: any) {
      setError(err.error || 'Failed to load MMF accounts');
      console.error('Error loading MMF accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMmfAccounts();
  }, []);

  // ==========================================================================
  // HANDLERS – Upload / Import
  // ==========================================================================

  const handleFileSelect = (file: File) => {
    setUploadFile(file);
    setUploadStatus('idle');
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploadStatus('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + 10;
        });
      }, 300);

      const response = await policyService.importExcel(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setUploadStatus('success');
        setUploadResult({
          newClients: response.data.newClients || 0,
          updatedClients: response.data.updatedClients || 0,
          newPolicies: response.data.newPolicies || 0,
          updatedPolicies: response.data.updatedPolicies || 0,
          newMmfAccounts: response.data.newMmfAccounts || 0,
          updatedMmfAccounts: response.data.updatedMmfAccounts || 0,
          skipped: response.data.skipped || 0,
          errors: response.data.errors || [],
        });
        await loadMmfAccounts();
      } else {
        setUploadStatus('error');
        setUploadResult({
          newClients: 0, updatedClients: 0, newPolicies: 0, updatedPolicies: 0,
          newMmfAccounts: 0, updatedMmfAccounts: 0,
          skipped: 0, errors: [response.error || 'Import failed'],
        });
      }
    } catch (err: any) {
      setUploadStatus('error');
      setUploadResult({
        newClients: 0, updatedClients: 0, newPolicies: 0, updatedPolicies: 0,
        newMmfAccounts: 0, updatedMmfAccounts: 0,
        skipped: 0, errors: [err.error || 'Import failed'],
      });
    }
  };

  const resetUploadModal = () => {
    setUploadModalOpen(false);
    setUploadFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setUploadResult(null);
  };

  // ==========================================================================
  // HANDLERS – View modal
  // ==========================================================================

  const openModal = (account: MmfAccount) => {
    setSelectedAccount(account);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAccount(null);
  };

  // ==========================================================================
  // FILTERING LOGIC
  // ==========================================================================

  const getFilteredData = () => {
    if (!searchTerm) return data;
    const s = searchTerm.toLowerCase();
    return data.filter(a =>
      a.member_no?.toLowerCase().includes(s) ||
      a.raw_full_name?.toLowerCase().includes(s) ||
      a.primary_holder?.name?.toLowerCase().includes(s) ||
      a.primary_holder?.phone?.toLowerCase().includes(s) ||
      a.primary_holder?.email?.toLowerCase().includes(s) ||
      a.other_holders.some(h =>
        h.name?.toLowerCase().includes(s) ||
        h.phone?.toLowerCase().includes(s) ||
        h.email?.toLowerCase().includes(s)
      )
    );
  };

  const filteredData = getFilteredData();

  const hasActiveFilters = () => searchTerm.trim().length > 0;

  // ==========================================================================
  // TABLE COLUMNS
  // ==========================================================================

  const columns = [
    {
      title: "Member No",
      dataIndex: "member_no",
      width: 130,
      fixed: 'left' as const,
      render: (text: string) => (
        <span style={{ color: '#475569', fontWeight: '600', fontSize: '13px' }}>
          <FileText size={12} className="me-1" style={{ color: '#475569' }} />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => (a.member_no || '').localeCompare(b.member_no || ''),
    },
    {
      title: "Primary Holder",
      dataIndex: "primary_holder",
      width: 260,
      fixed: 'left' as const,
      render: (h: Holder | null) => {
        if (!h) return <span className="text-muted">—</span>;
        const display = `${h.title ? h.title + ' ' : ''}${h.name}`.trim();
        return (
          <div className="d-flex align-items-center">
            <span
              className="avatar me-2 rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{
                width: '28px', height: '28px', minWidth: '28px', minHeight: '28px',
                backgroundColor: '#475569', color: '#fff',
                fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                borderRadius: '50%', flexShrink: 0
              }}
            >
              {getInitials(display)}
            </span>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>{display}</span>
          </div>
        );
      },
      sorter: (a: any, b: any) =>
        (a.primary_holder?.name || '').localeCompare(b.primary_holder?.name || ''),
    },
    {
      title: "Phone",
      dataIndex: "primary_holder",
      width: 150,
      render: (h: Holder | null) => (
        <span style={{ fontSize: '12px' }}>
          <Phone size={12} className="me-1" style={{ color: '#999' }} />
          {h?.phone || '—'}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "primary_holder",
      width: 200,
      render: (h: Holder | null) => (
        <span style={{ fontSize: '12px' }}>
          <Mail size={12} className="me-1" style={{ color: '#999' }} />
          {h?.email || '—'}
        </span>
      ),
    },
    {
      title: "Other Holders",
      dataIndex: "other_holders",
      width: 240,
      render: (others: Holder[]) => {
        if (!others || others.length === 0)
          return <span style={{ color: '#999', fontSize: '12px' }}>—</span>;
        return (
          <div style={{ fontSize: '12px', color: '#555' }}>
            {others.map((h, i) => (
              <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {h.title ? `${h.title} ` : ''}{h.name}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: "Holders",
      dataIndex: "holder_count",
      width: 90,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{
          fontWeight: '600', fontSize: '14px',
          color: count > 1 ? '#0d6efd' : '#999',
          backgroundColor: count > 1 ? '#e0f2fe' : '#f5f5f5',
          padding: '2px 12px', borderRadius: '12px', display: 'inline-block'
        }}>
          <Users size={12} className="me-1" />{count}
        </span>
      ),
      sorter: (a: any, b: any) => a.holder_count - b.holder_count,
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      width: 140,
      render: (date: string) => (
        <span style={{ fontSize: '12px' }}>{formatDateCompact(date)}</span>
      ),
      sorter: (a: any, b: any) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    },
    {
      title: "",
      dataIndex: "",
      width: 70,
      className: "text-end",
      fixed: 'right' as const,
      render: (_: any, record: MmfAccount) => (
        <div className="text-end">
          <button
            className="btn btn-sm"
            onClick={() => openModal(record)}
            title="View"
            style={{ backgroundColor: '#475569', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px' }}
          >
            <Eye size={13} />
          </button>
        </div>
      ),
    },
  ];

  // ==========================================================================
  // MODAL CONTENT – View details
  // ==========================================================================

  const getModalContent = () => {
    if (!selectedAccount) return { title: '', body: null, footer: null };

    const primary = selectedAccount.primary_holder;
    const others = selectedAccount.other_holders || [];

    return {
      title: 'MMF Account Details',
      body: (
        <div>
          {/* Header */}
          <div style={{
            backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px',
            marginBottom: '20px', borderLeft: '4px solid #475569'
          }}>
            <div className="row">
              <div className="col-6">
                <span style={{ color: '#999', fontSize: '12px' }}>Member No</span>
                <h5 style={{ color: '#475569', fontWeight: 'bold', marginBottom: '0' }}>
                  {selectedAccount.member_no}
                </h5>
              </div>
              <div className="col-6 text-end">
                <span style={{ color: '#999', fontSize: '12px' }}>Holders</span>
                <div>
                  <span className="badge bg-secondary" style={{ fontSize: '14px', padding: '5px 15px' }}>
                    {selectedAccount.holder_count}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary holder */}
          {primary && (
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Primary Holder</span>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>
                {primary.title ? `${primary.title} ` : ''}{primary.name}
              </div>
            </div>
          )}

          {/* Other holders */}
          {others.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>
                Other Holder{others.length !== 1 ? 's' : ''}
              </span>
              {others.map((h, i) => (
                <div key={i} style={{ fontWeight: '500' }}>
                  {h.title ? `${h.title} ` : ''}{h.name}
                </div>
              ))}
            </div>
          )}

          {/* Contact */}
          <div className="row" style={{ marginTop: '15px' }}>
            <div className="col-6">
              <span style={{ color: '#999', fontSize: '12px' }}>Primary Phone</span>
              <div style={{ fontWeight: '500', color: '#0d6efd' }}>
                {primary?.phone || 'N/A'}
              </div>
            </div>
            <div className="col-6">
              <span style={{ color: '#999', fontSize: '12px' }}>Primary Email</span>
              <div style={{ fontWeight: '500' }}>
                {primary?.email || 'N/A'}
              </div>
            </div>
          </div>

          {/* Raw values from insurer */}
          <div style={{
            backgroundColor: '#f8f9fa', padding: '12px 15px',
            borderRadius: '8px', marginTop: '15px', marginBottom: '15px'
          }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>
              As received from insurer
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <div><strong>Raw Name:</strong> {selectedAccount.raw_full_name}</div>
              {selectedAccount.mobile_no && (
                <div><strong>Raw Mobile:</strong> {selectedAccount.mobile_no}</div>
              )}
              {selectedAccount.email && (
                <div><strong>Raw Email:</strong> {selectedAccount.email}</div>
              )}
            </div>
          </div>

          {/* Agent */}
          <div style={{
            backgroundColor: '#f8f9fa', padding: '12px 15px', borderRadius: '8px'
          }}>
            <div className="row">
              <div className="col-6">
                <span style={{ color: '#999', fontSize: '12px' }}>Agent</span>
                <div style={{ fontWeight: '500' }}>{selectedAccount.agent_name || 'N/A'}</div>
              </div>
              <div className="col-6">
                <span style={{ color: '#999', fontSize: '12px' }}>Agent Code</span>
                <div style={{ fontWeight: '500' }}>{selectedAccount.agent_code || 'N/A'}</div>
              </div>
            </div>
          </div>
          {/* Insurance policies link — shown when the primary holder has policies */}
{primary && primary.policy_count > 0 && (
  <div style={{
    backgroundColor: '#eaf7ed',
    padding: '12px 15px',
    borderRadius: '8px',
    marginTop: '15px',
    borderLeft: '4px solid #2a9d36'
  }}>
    <div style={{ fontSize: '12px', color: '#2a9d36', fontWeight: '600', marginBottom: '8px' }}>
      📄 Insurance Policies
    </div>
    <div style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>
      This client also holds <strong>{primary.policy_count}</strong> insurance
      {primary.policy_count !== 1 ? ' policies' : ' policy'}.
    </div>
    <Link
      to={`/clients?search=${encodeURIComponent(primary.phone || primary.email || primary.name)}`}
      className="btn btn-sm"
      style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none' }}
    >
      View Client on Clients Page
    </Link>
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
  };

  const modalContent = getModalContent();

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const rowClassName = (_record: any, index: number) =>
    index % 2 === 0 ? 'table-row-even' : 'table-row-odd';

  return (
    <>
      <Header />
      <SidebarNav />

      <div className="page-wrapper">
        <div className="content container-fluid">

          {/* Page header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-7">
                <h3 className="page-title">MMF Accounts</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">MMF Accounts</li>
                </ul>
              </div>
              <div className="col-sm-5 text-end">
                <button
                  className="btn btn-primary"
                  onClick={() => setUploadModalOpen(true)}
                  style={{ backgroundColor: '#2a9d36', borderColor: '#2a9d36' }}
                >
                  <Upload size={16} className="me-1" /> Update MMF Accounts
                </button>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row">
            <div className="col-sm-12">
              <div className="card">

                {/* ---------- Card header ---------- */}
                <div className="card-header">
                  <div className="row align-items-center">
                    <div className="col">
                      <h5 className="card-title mb-0">All MMF Accounts</h5>
                      <div className="d-flex align-items-center gap-3 mt-1">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '20px', fontWeight: '700', color: '#475569' }}>
                            {filteredData.length}
                          </span>
                          <span style={{ color: '#999', fontSize: '13px' }}>Total</span>
                        </div>
                        <div style={{ width: '1px', height: '20px', backgroundColor: '#dee2e6' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0d6efd' }}>
                            {filteredData.filter(a => a.holder_count > 1).length}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>Joint</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#2a9d36' }}>
                            {filteredData.filter(a => a.holder_count === 1).length}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>Single</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="d-flex align-items-center gap-2">
                        {/* Search */}
                        <div className="input-group input-group-sm" style={{ width: '240px' }}>
                          <span className="input-group-text bg-white">
                            <Search size={14} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search member, name, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        {hasActiveFilters() && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setSearchTerm('')}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            <X size={12} className="me-1" /> Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---------- Table ---------- */}
                <div className="card-body">
                  <div className="table-responsive">
                    <Table
                      loading={loading}
                      rowClassName={rowClassName}
                      pagination={{
                        total: filteredData.length,
                        showTotal: (total, range) =>
                          `Showing ${range[0]} to ${range[1]} of ${total} accounts`,
                        showSizeChanger: true,
                        onShowSizeChange: onShowSizeChange,
                        itemRender: itemRender,
                        defaultPageSize: 25,
                      }}
                      style={{ overflowX: 'auto' }}
                      columns={columns}
                      dataSource={filteredData}
                      rowKey={(record) => record.id}
                      locale={{ emptyText: 'No MMF accounts found' }}
                      scroll={{ x: 1400 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table styles */}
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
          border-left-color: #475569;
        }
        .ant-table-tbody > tr.table-row-odd:hover > td:first-child {
          border-left-color: #475569;
        }
        .avatar {
          border-radius: 50% !important;
          overflow: hidden !important;
          flex-shrink: 0 !important;
        }
        .avatar span { border-radius: 50% !important; }
      `}</style>

      {/* =====================================================================
          MODAL – View MMF Account
          ===================================================================== */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '700px' }}>
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#475569', color: '#fff' }}>
                <h5 className="modal-title" style={{ color: '#fff' }}>{modalContent.title}</h5>
                <button type="button" className="btn-close" onClick={closeModal} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div className="modal-body">{modalContent.body}</div>
              {modalContent.footer}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL – Upload / Import Excel
          ===================================================================== */}
      {uploadModalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '600px' }}>
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#c70e2a', color: '#fff' }}>
                <h5 className="modal-title" style={{ color: '#fff' }}>
                  <Upload size={18} className="me-2" /> Upload MMF File
                </h5>
                <button type="button" className="btn-close" onClick={resetUploadModal} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div className="modal-body" style={{ padding: '25px' }}>

                {/* Idle – drop zone */}
                {uploadStatus === 'idle' && (
                  <div
                    style={{
                      border: '2px dashed #c70e2a', borderRadius: '10px', padding: '40px 20px',
                      textAlign: 'center', cursor: 'pointer', backgroundColor: '#fdf0f2',
                      transition: 'all 0.3s ease'
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = '#fce4e8'; }}
                    onDragLeave={(e) => { e.currentTarget.style.backgroundColor = '#fdf0f2'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) handleFileSelect(file);
                    }}
                    onClick={() => document.getElementById('mmfFileInput')?.click()}
                  >
                    <FileText size={48} style={{ color: '#c70e2a', marginBottom: '15px' }} />
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                      Drag & drop your Excel file here
                    </p>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      or <span style={{ color: '#c70e2a', fontWeight: '500' }}>browse</span> to select a file
                    </p>
                    <p style={{ fontSize: '12px', color: '#999' }}>Supports .xlsx and .xls files</p>
                    <input
                      id="mmfFileInput"
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

                {/* Idle – file selected */}
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

                {/* Uploading */}
                {uploadStatus === 'uploading' && (
                  <div style={{ padding: '20px 0' }}>
                    <p style={{ textAlign: 'center', fontWeight: '500' }}>Importing data...</p>
                    <div style={{ width: '100%', backgroundColor: '#e9ecef', borderRadius: '5px', overflow: 'hidden', height: '20px' }}>
                      <div style={{ width: `${uploadProgress}%`, backgroundColor: '#c70e2a', height: '100%', transition: 'width 0.3s ease' }} />
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '10px' }}>
                      {uploadProgress < 100 ? `Processing... ${uploadProgress}%` : 'Processing...'}
                    </p>
                  </div>
                )}

                {/* Success */}
                {uploadStatus === 'success' && uploadResult && (
                  <div style={{ padding: '10px 0' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <CheckCircle size={48} style={{ color: '#2a9d36' }} />
                      <h5 style={{ marginTop: '10px', color: '#2a9d36' }}>Import Complete!</h5>
                    </div>

                    {/* MMF-specific results */}
                    {(uploadResult.newMmfAccounts > 0 || uploadResult.updatedMmfAccounts > 0) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#475569' }}>{uploadResult.newMmfAccounts}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>New MMF Accounts</div>
                        </div>
                        <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#475569' }}>{uploadResult.updatedMmfAccounts}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Updated MMF Accounts</div>
                        </div>
                      </div>
                    )}

                    {/* Policy-specific results */}
                    {(uploadResult.newClients > 0 || uploadResult.newPolicies > 0 ||
                      uploadResult.updatedPolicies > 0 || uploadResult.updatedClients > 0) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0d6efd' }}>{uploadResult.updatedPolicies}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Updated Policies</div>
                        </div>
                      </div>
                    )}

                    {uploadResult.skipped > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '10px' }}>
                        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#c70e2a' }}>{uploadResult.skipped}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Skipped</div>
                        </div>
                      </div>
                    )}

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

                {/* Error */}
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
                      className="w-100 mt-3 btn"
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

export default AdminMmf;
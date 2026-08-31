import { useState, useEffect } from 'react';
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import SidebarNav from "../sidebar";
import { Link } from "react-router-dom";
import Header from "../header";
import { Eye, Edit, Trash2, FileText, Search, Upload, CheckCircle, XCircle, AlertCircle, Filter, X } from 'react-feather';
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
  updatedPolicies: number;
  skipped: number;
  errors: string[];
} | null>(null);

  // Policy history state
  const [policyHistory, setPolicyHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ===== FILTER STATE =====
  const [filters, setFilters] = useState({
    status: [] as string[],
    frequency: [] as string[],
    productType: [] as string[],
    agent: [] as string[],
    strikeDayRange: [] as number[],
    premiumMin: 0,
    premiumMax: 0,
    dateRange: [] as string[],
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const statusOptions = ['Active', 'Finalised', 'Unfinalised', 'Cancelled'];
  const frequencyOptions = ['Monthly', 'Annual', 'Quarterly', 'Semi-Annual'];
  const productOptions = ['Education Policy', 'Endowment Policy'];

  // ============ HELPERS ============

  const cleanPolicyStatus = (status: string) => {
    if (!status) return 'not given';
    let cleaned = status.replace(/\bPolicy\b/g, '').trim();
    cleaned = cleaned.replace(/[–-]/g, ' ').trim();
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    const words = cleaned.split(' ');
    if (words.length === 1) return words[0];
    if (words[0].toLowerCase() === 'unfinalised') {
      const rest = words.slice(1);
      let extra = '';
      if (rest.length > 0) {
        const takeWords = rest.slice(0, Math.min(2, rest.length));
        extra = takeWords.join(' ');
      }
      if (extra) return `Unfinalised (${extra})`;
      return 'Unfinalised';
    }
    if (words.length > 3) return words.slice(0, 3).join(' ') + '...';
    return cleaned;
  };

  const formatCurrency = (value: any) => {
    if (!value && value !== 0) return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDateToOrdinal = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const suffix = ['th', 'st', 'nd', 'rd'];
    const ordinal = (day % 100 >= 11 && day % 100 <= 13) ? 'th' : suffix[Math.min(day % 10, 3)] || 'th';
    return `${day}${ordinal} ${month} ${year}`;
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

  const getStrikeDayWithOrdinal = (value: number) => {
    if (!value && value !== 0) return null;
    const num = Number(value);
    if (isNaN(num)) return null;
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
    return `${num}${ordinal}`;
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

  const getFrequencyColor = (freq: string) => {
    if (!freq) return '#6c757d';
    const f = freq.toLowerCase();
    if (f.includes('month')) return '#0d6efd';
    if (f.includes('annual')) return '#2a9d36';
    if (f.includes('quarter')) return '#fd7e14';
    if (f.includes('semi')) return '#6f42c1';
    return '#6c757d';
  };

  // ============ HANDLERS ============

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
        setUploadResult({
          newClients: response.data.newClients || 0,
          updatedClients: response.data.updatedClients || 0,
          newPolicies: response.data.newPolicies || 0,
          updatedPolicies: response.data.updatedPolicies || 0,
          skipped: response.data.skipped || 0,
          errors: response.data.errors || []
        });
        await loadPolicies();
      } else {
        setUploadStatus('error');
        setUploadResult({
          newClients: 0,
          updatedClients: 0,
          newPolicies: 0,
          updatedPolicies: 0,
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
        updatedPolicies: 0,
        skipped: 0,
        errors: [err.error || 'Import failed']
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

  const openModal = async (action: 'view' | 'delete', policy: Policy) => {
    setModalAction(action);
    setSelectedPolicy(policy);
    setModalOpen(true);
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

  const closeModal = () => {
    setModalOpen(false);
    setModalAction(null);
    setSelectedPolicy(null);
    setPolicyHistory([]);
  };

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

  const hasActiveFilters = () => {
    return filters.status.length > 0 || filters.frequency.length > 0 || filters.productType.length > 0 || 
           filters.strikeDayRange.length > 0 || filters.premiumMin > 0 || filters.premiumMax > 0;
  };

  // ===== FILTERED DATA =====
  const getFilteredData = () => {
    let filtered = data;
    if (filters.status.length > 0) {
      filtered = filtered.filter(item => 
        filters.status.some(status => 
          item.policy_status?.toLowerCase().includes(status.toLowerCase())
        )
      );
    }
    if (filters.frequency.length > 0) {
      filtered = filtered.filter(item => 
        filters.frequency.includes(item.premium_frequency || '')
      );
    }
    if (filters.productType.length > 0) {
      filtered = filtered.filter(item => 
        filters.productType.some(type => 
          item.product_type?.toLowerCase().includes(type.toLowerCase())
        )
      );
    }
    if (filters.agent.length > 0) {
      filtered = filtered.filter(item => 
        filters.agent.includes(item.agent_name || '')
      );
    }
    if (filters.strikeDayRange.length === 2) {
      const [min, max] = filters.strikeDayRange;
      filtered = filtered.filter(item => 
        item.strike_date >= min && item.strike_date <= max
      );
    }
    if (filters.premiumMin > 0) {
      filtered = filtered.filter(item => 
        item.annualised_premium >= filters.premiumMin
      );
    }
    if (filters.premiumMax > 0) {
      filtered = filtered.filter(item => 
        item.annualised_premium <= filters.premiumMax
      );
    }
    if (filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(item => 
        item.inception_date >= start && item.inception_date <= end
      );
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.policy_number?.toLowerCase().includes(search) ||
        item.full_name?.toLowerCase().includes(search) ||
        item.client_name?.toLowerCase().includes(search) ||
        item.product_type?.toLowerCase().includes(search) ||
        item.policy_status?.toLowerCase().includes(search) ||
        item.agent_name?.toLowerCase().includes(search)
      );
    }
    return filtered;
  };

  const filteredData = getFilteredData();

  // ============ TABLE COLUMNS ============

  const columns = [
  {
    title: "Policy Number",
    dataIndex: "policy_number",
    width: 140,
    fixed: 'left' as const,
    render: (text: string) => (
      <span style={{ color: '#2a9d36', fontWeight: '600', fontSize: '13px' }}>
        <FileText size={12} className="me-1" style={{ color: '#2a9d36' }} />
        {text || 'N/A'}
      </span>
    ),
    sorter: (a: any, b: any) => (a.policy_number || '').localeCompare(b.policy_number || ''),
  },
  {
    title: "Client",
    dataIndex: "client_name",
    width: 180,
    fixed: 'left' as const,
    render: (text: string) => {
      const displayName = text || 'N/A';
      return (
        <div className="d-flex align-items-center">
          <span 
            className="avatar me-2 rounded-circle d-inline-flex align-items-center justify-content-center"
            style={{
              width: '28px',
              height: '28px',
              minWidth: '28px',
              minHeight: '28px',
              backgroundColor: getAvatarColor(displayName),
              color: '#fff',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderRadius: '50%',
              flexShrink: 0
            }}
          >
            {getInitials(displayName)}
          </span>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>{displayName}</span>
        </div>
      );
    },
    sorter: (a: any, b: any) => (a.client_name || '').localeCompare(b.client_name || ''),
  },
  {
  title: "Status",
  dataIndex: "policy_status",
  width: 150,
  render: (status: string) => {
    const cleanStatus = cleanPolicyStatus(status);
    let badgeClass = 'bg-secondary';
    let icon = '';
    if (status?.toLowerCase().includes('finalised')) {
      badgeClass = 'bg-success';
      icon = '✓';
    } else if (status?.toLowerCase().includes('unfinalised')) {
      badgeClass = 'bg-warning text-dark';
      icon = '⏳';
    } else if (status?.toLowerCase().includes('cancelled')) {
      badgeClass = 'bg-danger';
      icon = '✕';
    } else if (status?.toLowerCase().includes('active')) {
      badgeClass = 'bg-success';
      icon = '●';
    }
    return (
      <span className={`badge ${badgeClass} px-2 py-1 d-inline-block text-truncate`} 
            style={{ 
              fontSize: '11px', 
              maxWidth: '130px', 
              fontWeight: '500',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={status || 'N/A'}>
        {icon} {cleanStatus}
      </span>
    );
  },
  sorter: (a: any, b: any) => (a.policy_status || '').localeCompare(b.policy_status || ''),
},
  {
    title: "Frequency",
    dataIndex: "premium_frequency",
    width: 90,
    render: (text: string) => {
      const color = getFrequencyColor(text);
      return (
        <span style={{ 
          color: color, 
          fontWeight: '500', 
          fontSize: '11px',
          backgroundColor: color + '15',
          padding: '2px 8px',
          borderRadius: '4px',
          display: 'inline-block'
        }}>
          {text || 'N/A'}
        </span>
      );
    },
  },
  {
    title: "Initial Premium",
    dataIndex: "initial_gross_premium",
    width: 130,
    align: 'right' as const,
    onCell: () => ({
      style: { backgroundColor: '#f8fffa' }
    }),
    render: (value: number) => (
      <span style={{ fontSize: '13px', color: '#2d6a4f' }}>
        KES {formatCurrency(value)}
      </span>
    ),
    sorter: (a: any, b: any) => (a.initial_gross_premium || 0) - (b.initial_gross_premium || 0),
  },
  {
    title: "New Premium",
    dataIndex: "new_gross_premium",
    width: 130,
    align: 'right' as const,
    onCell: () => ({
      style: { backgroundColor: '#f0fdf4', fontWeight: 'bold' }
    }),
    render: (value: number) => (
      <span style={{ fontWeight: '700', color: '#2a9d36', fontSize: '13px' }}>
        KES {formatCurrency(value)}
      </span>
    ),
    sorter: (a: any, b: any) => (a.new_gross_premium || 0) - (b.new_gross_premium || 0),
  },
  {
    title: "Sum Insured",
    dataIndex: "total_sum_insured",
    width: 130,
    align: 'right' as const,
    onCell: () => ({
      style: { backgroundColor: '#f8fffa' }
    }),
    render: (value: number) => (
      <span style={{ fontSize: '13px', color: '#2d6a4f' }}>
        KES {formatCurrency(value)}
      </span>
    ),
    sorter: (a: any, b: any) => (a.total_sum_insured || 0) - (b.total_sum_insured || 0),
  },
  {
    title: "Strike Day",
    dataIndex: "strike_date",
    width: 95,
    onCell: () => ({
      style: { backgroundColor: '#f0f7ff' }
    }),
    render: (value: number) => {
      if (!value && value !== 0) return <span style={{ color: '#999', fontSize: '12px' }}>—</span>;
      const display = getStrikeDayWithOrdinal(value);
      if (!display) return '—';
      return (
        <span style={{ 
          color: '#0d6efd', 
          fontWeight: '700', 
          fontSize: '13px',
          backgroundColor: '#dbeafe',
          padding: '2px 10px',
          borderRadius: '4px',
          display: 'inline-block'
        }}>
          {display}
        </span>
      );
    },
    sorter: (a: any, b: any) => (a.strike_date || 0) - (b.strike_date || 0),
  },
  {
    title: "Agent",
    dataIndex: "agent_name",
    width: 130,
    render: (text: string) => <span className="text-muted" style={{ fontSize: '12px' }}>{text || '—'}</span>,
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
    width: 110,
    className: "text-end",
    fixed: 'right' as const,
    render: (_: any, record: Policy) => (
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
                  <h5 style={{ color: '#2a9d36', fontWeight: 'bold', marginBottom: '0' }}>
                    {selectedPolicy.policy_number}
                  </h5>
                </div>
                <div className="col-6 text-end">
                  <span style={{ color: '#999', fontSize: '12px' }}>Status</span>
                  <div>
                    {(() => {
                      let badgeClass = 'bg-secondary';
                      if (selectedPolicy.policy_status?.toLowerCase().includes('finalised')) badgeClass = 'bg-success';
                      else if (selectedPolicy.policy_status?.toLowerCase().includes('unfinalised')) badgeClass = 'bg-warning text-dark';
                      else if (selectedPolicy.policy_status?.toLowerCase().includes('cancelled')) badgeClass = 'bg-danger';
                      else if (selectedPolicy.policy_status?.toLowerCase().includes('active')) badgeClass = 'bg-success';
                      return (
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '14px', padding: '5px 15px' }}>
                          {selectedPolicy.policy_status || 'N/A'}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
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
                  <div style={{ fontWeight: '500' , color: '#0d6efd'}}>{selectedPolicy.premium_frequency || 'N/A'}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Inception Date</span>
                  <div style={{ fontWeight: '500', color: '#F15A29' }}>{formatDateToOrdinal(selectedPolicy.inception_date)}</div>
                </div>
              </div>
              <div className="col-6">
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Strike Day</span>
                  <div style={{ fontWeight: '500', color: '#0d6efd' }}>
                    {selectedPolicy.strike_date ? getStrikeDayWithOrdinal(selectedPolicy.strike_date) : 'N/A'}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Total Sum Insured</span>
                  <div style={{ fontWeight: '600', color: '#2a9d36' }}>KES {formatCurrency(selectedPolicy.total_sum_insured)}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Annualised Premium</span>
                  <div style={{ fontWeight: '600', color: '#2a9d36' }}>KES {formatCurrency(selectedPolicy.annualised_premium)}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Initial Gross Premium</span>
                  <div style={{ fontWeight: '500' }}>KES {formatCurrency(selectedPolicy.initial_gross_premium)}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>New Gross Premium</span>
                  <div style={{ fontWeight: '600', color: '#c70e2a' }}>KES {formatCurrency(selectedPolicy.new_gross_premium)}</div>
                </div>
              </div>
            </div>
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
                  <div style={{ fontWeight: '500' }}>{selectedPolicy.updated_at ? formatDateToOrdinal(selectedPolicy.updated_at) : 'N/A'}</div>
                </div>
              </div>
            </div>
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
                {/* ===== IMPROVED HEADER ===== */}
                <div className="card-header">
                  {/* Top Row: Title + Stats */}
                  <div className="row align-items-center mb-2">
                    <div className="col">
                      <h5 className="card-title mb-0">All Policies</h5>
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
                            {filteredData.filter(p => p.policy_status?.toLowerCase().includes('active') || p.policy_status?.toLowerCase().includes('finalised')).length}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>Active</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#fd7e14' }}>
                            {filteredData.filter(p => p.policy_status?.toLowerCase().includes('unfinalised')).length}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>Pending</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#c70e2a' }}>
                            {filteredData.filter(p => p.policy_status?.toLowerCase().includes('cancelled')).length}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>Cancelled</span>
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
                            placeholder="Search..."
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
                            {filters.status.length + filters.frequency.length + filters.productType.length}
                          </span>}
                        </button>
                        {hasActiveFilters() && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setFilters({
                                status: [],
                                frequency: [],
                                productType: [],
                                agent: [],
                                strikeDayRange: [],
                                premiumMin: 0,
                                premiumMax: 0,
                                dateRange: [],
                              });
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
                  {/* ===== FILTERS ===== */}
{showFilters && (
  <div className="row mt-2 pt-2" style={{ borderTop: '1px solid #eee' }}>
    <div className="col-12">
      <div className="d-flex flex-wrap align-items-center gap-2">
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
          <div className="dropdown-menu p-2" style={{ minWidth: '180px' }}>
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

        {/* Frequency Filter */}
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
            Frequency {filters.frequency.length > 0 && <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff', marginLeft: '4px' }}>{filters.frequency.length}</span>}
          </button>
          <div className="dropdown-menu p-2" style={{ minWidth: '150px' }}>
            {frequencyOptions.map(option => (
              <div className="form-check" key={option}>
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id={`freq-${option}`}
                  checked={filters.frequency.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({...filters, frequency: [...filters.frequency, option]});
                    } else {
                      setFilters({...filters, frequency: filters.frequency.filter(f => f !== option)});
                    }
                  }}
                />
                <label className="form-check-label" htmlFor={`freq-${option}`}>
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Product Filter */}
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
            Product
          </button>
          <div className="dropdown-menu p-2" style={{ minWidth: '180px' }}>
            {productOptions.map(option => (
              <div className="form-check" key={option}>
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id={`product-${option}`}
                  checked={filters.productType.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({...filters, productType: [...filters.productType, option]});
                    } else {
                      setFilters({...filters, productType: filters.productType.filter(p => p !== option)});
                    }
                  }}
                />
                <label className="form-check-label" htmlFor={`product-${option}`}>
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Strike Day */}
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
            Strike Day
          </button>
          <div className="dropdown-menu p-2" style={{ minWidth: '240px' }}>
            <div className="d-flex gap-2 align-items-center">
              <input 
                type="number" 
                className="form-control form-control-sm" 
                placeholder="Min" 
                value={filters.strikeDayRange[0] || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFilters({
                    ...filters, 
                    strikeDayRange: [val || 0, filters.strikeDayRange[1] || 0]
                  });
                }}
                style={{ width: '80px' }}
              />
              <span>to</span>
              <input 
                type="number" 
                className="form-control form-control-sm" 
                placeholder="Max" 
                value={filters.strikeDayRange[1] || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFilters({
                    ...filters, 
                    strikeDayRange: [filters.strikeDayRange[0] || 0, val || 0]
                  });
                }}
                style={{ width: '80px' }}
              />
            </div>
          </div>
        </div>

        {/* Premium Range */}
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
            Premium
          </button>
          <div className="dropdown-menu p-2" style={{ minWidth: '240px' }}>
            <div className="d-flex gap-2 align-items-center">
              <input 
                type="number" 
                className="form-control form-control-sm" 
                placeholder="Min" 
                value={filters.premiumMin || ''}
                onChange={(e) => {
                  setFilters({...filters, premiumMin: parseInt(e.target.value) || 0});
                }}
                style={{ width: '100px' }}
              />
              <span>to</span>
              <input 
                type="number" 
                className="form-control form-control-sm" 
                placeholder="Max" 
                value={filters.premiumMax || ''}
                onChange={(e) => {
                  setFilters({...filters, premiumMax: parseInt(e.target.value) || 0});
                }}
                style={{ width: '100px' }}
              />
            </div>
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
        .avatar span {
          border-radius: 50% !important;
        }
      `}</style>

      {/* Modal */}
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
              <div className="modal-header" style={{ backgroundColor: '#c70e2a', color: '#fff' }}>
                <h5 className="modal-title" style={{ color: '#fff' }}>
                  <Upload size={18} className="me-2" /> Update Policies
                </h5>
                <button type="button" className="btn-close" onClick={resetUploadModal} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div className="modal-body" style={{ padding: '25px' }}>
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
                {uploadStatus === 'success' && uploadResult && (
                  <div style={{ padding: '10px 0' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <CheckCircle size={48} style={{ color: '#2a9d36' }} />
                      <h5 style={{ marginTop: '10px', color: '#2a9d36' }}>Import Complete!</h5>
                    </div>
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

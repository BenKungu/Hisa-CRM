import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import SidebarNav from "../sidebar";
import Header from "../header";
import {
  Eye, Edit, Trash2, Search, FileText, Filter, X,
  User, Mail, Phone, Users, CheckCircle
} from 'react-feather';
import { clientService } from '../../services/client';
import { policyService } from '../../services/policy';

// ============================================================================
// TYPES
// ============================================================================

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
  dob: string | null;
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
  new_gross_premium: number;
  annualised_premium: number;
  inception_date: string;
  agent_name: string;
  agent_code: string;
  client_id: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const AdminClients = () => {
  // --------------------------------------------------------------------------
  // State – data
  // --------------------------------------------------------------------------
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // --------------------------------------------------------------------------
  // State – filters
  // --------------------------------------------------------------------------
  const [filters, setFilters] = useState({
    policyCount: [] as string[],
    status: [] as string[],
    agent: [] as string[],
    dobFilter: { type: 'none' } as { type: string; month?: number; day?: number },
  });
  const [showFilters, setShowFilters] = useState(false);

  // --------------------------------------------------------------------------
  // State – view/delete modal
  // --------------------------------------------------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'view' | 'delete' | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientPolicies, setClientPolicies] = useState<Policy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // --------------------------------------------------------------------------
  // State – export
  // --------------------------------------------------------------------------
  const [downloading, setDownloading] = useState(false);

  // --------------------------------------------------------------------------
  // Router
  // --------------------------------------------------------------------------
  const navigate = useNavigate();
  const location = useLocation();

  // --------------------------------------------------------------------------
  // Static filter options
  // --------------------------------------------------------------------------
  const policyCountOptions = ['0', '1-5', '6-10', '10+'];
  const statusOptions = ['Active', 'Inactive'];

  // Unique agent names derived from the loaded client list
  const agentOptions = Array.from(
    new Set(data.map(c => c.agent_name).filter(a => a && a !== 'N/A'))
  );

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /** Add correct ordinal suffix (1 → st, 2 → nd, 3 → rd, everything else → th). */
  const getOrdinal = (n: number): string => {
    const lastTwo = n % 100;
    if (lastTwo >= 11 && lastTwo <= 13) return 'th';
    const lastDigit = n % 10;
    if (lastDigit === 1) return 'st';
    if (lastDigit === 2) return 'nd';
    if (lastDigit === 3) return 'rd';
    return 'th';
  };

  /** Format a number as a thousands-separated currency string. */
  const formatCurrency = (value: any) => {
    if (!value && value !== 0) return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  /** Short date with ordinal, e.g., "10th Jun 2027". */
  const formatDateCompact = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}${getOrdinal(day)} ${month} ${year}`;
  };

  /** Long birthday format without year, e.g., "10th June". */
  const formatBirthday = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    return `${day}${getOrdinal(day)} ${month}`;
  };

  /** Two-letter uppercase initials from a full name. */
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  /** Deterministic avatar colour based on name length. */
  const getAvatarColor = (name: string) => {
    const colors = ['#2c3e8f', '#6f42c1'];
    return colors[(name?.length || 0) % colors.length];
  };

  /**
   * Check whether a phone number matches a search term, regardless of format.
   * Handles: leading 0, country code 254, partial & suffix matches.
   */
  const phoneMatches = (phone: string | undefined | null, search: string): boolean => {
    if (!phone || !search) return false;
    const phoneDigits = phone.replace(/\D/g, '');
    const searchDigits = search.replace(/\D/g, '');
    if (!searchDigits) return false;

    if (phoneDigits.includes(searchDigits) || searchDigits.includes(phoneDigits)) return true;

    const searchNoLeadingZero = searchDigits.replace(/^0+/, '');
    if (searchNoLeadingZero && phoneDigits.includes(searchNoLeadingZero)) return true;

    const phoneNoCountry = phoneDigits.replace(/^254/, '');
    if (phoneNoCountry && searchDigits.includes(phoneNoCountry)) return true;

    const minLen = Math.min(phoneDigits.length, searchDigits.length);
    if (minLen >= 4) {
      const phoneSuffix = phoneDigits.slice(-minLen);
      const searchSuffix = searchDigits.slice(-minLen);
      if (phoneSuffix === searchSuffix) return true;
    }
    return false;
  };

  /** Are any filters active? */
  const hasActiveFilters = () => {
    return filters.policyCount.length > 0 ||
           filters.status.length > 0 ||
           filters.agent.length > 0 ||
           filters.dobFilter.type !== 'none' ||
           searchTerm.trim().length > 0;
  };

  /** Reset all filters + search to defaults. */
  const resetFilters = () => {
    setFilters({ policyCount: [], status: [], agent: [], dobFilter: { type: 'none' } });
    setSearchTerm('');
  };

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  const loadClients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await clientService.getClients();
      if (response.success) setData(response.data);
      else setError('Failed to load clients');
    } catch (err: any) {
      setError(err.error || 'Failed to load clients');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClientPolicies = async (clientId: string) => {
    setLoadingPolicies(true);
    try {
      const response = await policyService.getPolicies();
      if (response.success) {
        const clientPoliciesData = response.data.filter((p: any) => p.client_id === clientId);
        setClientPolicies(clientPoliciesData);
      }
    } catch (err) {
      console.error('Error loading client policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Read `?search=` query param from the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search');
    if (searchQuery) setSearchTerm(searchQuery);
  }, [location.search]);

  // Initial load
  useEffect(() => {
    loadClients();
  }, []);

  // ==========================================================================
  // HANDLERS – Export
  // ==========================================================================

  const fallbackDownload = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clients_${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!hasActiveFilters()) return;
    setDownloading(true);

    try {
      // Build filter params from current filter state
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filters.policyCount.length > 0) params.policyCount = filters.policyCount;
      if (filters.status.length > 0) params.status = filters.status;
      if (filters.agent.length > 0) params.agent = filters.agent;
      if (filters.dobFilter.type !== 'none') {
        params.dobType = filters.dobFilter.type;
        if (filters.dobFilter.type === 'custom') {
          params.dobMonth = filters.dobFilter.month;
          params.dobDay = filters.dobFilter.day;
        }
      }

      const blob = await clientService.exportClients(params);

      // Prefer the File System Access API when available (lets user pick save location)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: `clients_${new Date().toISOString().slice(0,10)}.xlsx`,
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
      alert('Failed to download clients.');
    } finally {
      setDownloading(false);
    }
  };

  // ==========================================================================
  // HANDLERS – View / Delete modal
  // ==========================================================================

  const openModal = async (action: 'view' | 'delete', client: Client) => {
    setModalAction(action);
    setSelectedClient(client);
    setModalOpen(true);
    if (action === 'view') await loadClientPolicies(client.id);
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

  // ==========================================================================
  // FILTERING LOGIC
  // ==========================================================================

  const getFilteredData = () => {
    let filtered = data;

    // Policy count buckets
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

    // Active / Inactive
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

    // Agent
    if (filters.agent.length > 0) {
      filtered = filtered.filter(item => filters.agent.includes(item.agent_name));
    }

    // Birthday filter – compares only month/day, ignores year
    if (filters.dobFilter.type !== 'none') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (filters.dobFilter.type) {
        case 'today':
          startDate = new Date(today);
          endDate = new Date(today);
          break;
        case 'thisWeek': {
          startDate = new Date(today);
          endDate = new Date(today);
          endDate.setDate(endDate.getDate() + 6);
          break;
        }
        case 'thisMonth': {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        }
        case 'custom': {
          if (filters.dobFilter.month && filters.dobFilter.day) {
            const month = filters.dobFilter.month;
            const day = filters.dobFilter.day;
            let bday = new Date(now.getFullYear(), month - 1, day);
            if (bday < today) {
              bday = new Date(now.getFullYear() + 1, month - 1, day);
            }
            startDate = new Date(bday);
            endDate = new Date(bday);
          }
          break;
        }
        default: break;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(item => {
          if (!item.dob) return false;
          const dob = new Date(item.dob);
          const dobMonth = dob.getMonth() + 1;
          const dobDay = dob.getDate();

          // Next occurrence of this birthday on/after startDate
          const getNextBirthday = (month: number, day: number, fromDate: Date) => {
            let bday = new Date(fromDate.getFullYear(), month - 1, day);
            if (bday < fromDate) {
              bday = new Date(fromDate.getFullYear() + 1, month - 1, day);
            }
            return bday;
          };

          const nextBday = getNextBirthday(dobMonth, dobDay, startDate);
          return nextBday >= startDate && nextBday <= endDate;
        });
      }
    }

    // Free-text search (name / ID / email / phone)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const matchesText =
          item.client_name?.toLowerCase().includes(search) ||
          item.full_name?.toLowerCase().includes(search) ||
          item.id_no?.toLowerCase().includes(search) ||
          item.email?.toLowerCase().includes(search);
        if (matchesText) return true;
        if (item.phone_no && phoneMatches(item.phone_no, searchTerm)) return true;
        return false;
      });
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  // ==========================================================================
  // TABLE COLUMNS
  // ==========================================================================

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
                width: '32px', height: '32px', minWidth: '32px', minHeight: '32px',
                backgroundColor: getAvatarColor(displayName), color: '#fff',
                fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase',
                borderRadius: '50%', flexShrink: 0
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
            fontWeight: '600', fontSize: '15px', color: color,
            backgroundColor: count > 0 ? '#e8f5e9' : '#f5f5f5',
            padding: '2px 12px', borderRadius: '12px', display: 'inline-block'
          }}>
            {count || 0}
          </span>
        );
      },
      sorter: (a: any, b: any) => (a.policy_count || 0) - (b.policy_count || 0),
    },
    {
      title: "DOB",
      dataIndex: "dob",
      width: 120,
      render: (text: string) => {
        if (!text) return '—';
        const date = new Date(text);
        if (isNaN(date.getTime())) return '—';
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${day}${getOrdinal(day)} ${month} ${year}`;
      },
      sorter: (a: any, b: any) => (a.dob || '').localeCompare(b.dob || ''),
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
              backgroundColor: '#6c757d', color: '#fff', border: 'none',
              padding: '2px 6px', opacity: 0.4, cursor: 'not-allowed', borderRadius: '4px'
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

  // ==========================================================================
  // MODAL CONTENT – View / Delete
  // ==========================================================================

  const getModalContent = () => {
    // ---- Delete confirmation ----
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

    // ---- View details ----
    if (modalAction === 'view' && selectedClient) {
      const hasPolicies = clientPolicies.length > 0;
      const agentName = selectedClient.agent_name || 'N/A';
      const agentCode = selectedClient.agent_code || 'N/A';
      const displayName = selectedClient.client_name || 'N/A';
      const fullNameWithTitle = selectedClient.title
        ? `${selectedClient.title} ${displayName}`
        : displayName;

      return {
        title: 'Client Details',
        body: (
          <div>
            {/* Client header with avatar */}
            <div style={{
              backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px',
              marginBottom: '20px', borderLeft: '4px solid #c70e2a',
              display: 'flex', alignItems: 'center', gap: '15px'
            }}>
              <span
                className="rounded-circle d-inline-flex align-items-center justify-content-center"
                style={{
                  width: '56px', height: '56px',
                  backgroundColor: getAvatarColor(displayName), color: '#fff',
                  fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', flexShrink: 0
                }}
              >
                {getInitials(displayName)}
              </span>
              <div>
                <h5 style={{ marginBottom: '2px', fontWeight: '600' }}>{fullNameWithTitle}</h5>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  ID: {selectedClient.id_no || 'N/A'} · {selectedClient.policy_count || 0} Total · {selectedClient.finalised_count || 0} Finalised
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  Agent: {agentName} {agentCode !== 'N/A' ? `(${agentCode})` : ''}
                </div>
              </div>
            </div>

            {/* Two-column client data */}
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
                  <span style={{ color: '#999', fontSize: '12px' }}>Birthday</span>
                  <div style={{ fontWeight: '500', color: '#F15A29' }}>
                    {selectedClient.dob ? formatBirthday(selectedClient.dob) : 'N/A'}
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>ID Number</span>
                  <div style={{ fontWeight: '500' }}>{selectedClient.id_no || 'N/A'}</div>
                </div>
              </div>
              <div className="col-6">
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>Phone</span>
                  <div style={{ fontWeight: '500', color: '#0d6efd' }}>{selectedClient.phone_no || 'N/A'}</div>
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
                  <div style={{ fontWeight: '500' }}>
                    {selectedClient.updated_at ? formatDateCompact(selectedClient.updated_at) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent section */}
            {agentName !== 'N/A' && (
              <div style={{ backgroundColor: '#f8f9fa', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px' }}>
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

            {/* Policies section */}
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
                    padding: '8px 12px', marginBottom: '5px',
                    backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '13px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap',
                    cursor: 'pointer', transition: 'background-color 0.15s',
                  }}>
                    <div>
                      <span
                        style={{
                          fontWeight: '500', color: '#0d6efd',
                          textDecoration: 'underline', cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/businesses?search=${policy.policy_number}`)}
                      >
                        {policy.policy_number}
                      </span>
                      <span className="text-muted" style={{ fontSize: '11px', marginLeft: '10px' }}>
                        {policy.product_type || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className={`badge ${
                        policy.policy_status?.toLowerCase().includes('finalised') ? 'bg-success' :
                        policy.policy_status?.toLowerCase().includes('unfinalised') ? 'bg-warning text-dark' :
                        policy.policy_status?.toLowerCase().includes('cancelled') ? 'bg-danger' : 'bg-secondary'
                      }`} style={{ fontSize: '10px' }}>
                        {policy.policy_status || 'N/A'}
                      </span>
                      <span style={{ marginLeft: '10px', fontSize: '12px', color: '#2a9d36' }}>
                        KES {formatCurrency(policy.new_gross_premium)}
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

                {/* ---------- Card header: stats + search + filter toggle ---------- */}
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
                        {/* Search */}
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
                        {/* Filter toggle */}
                        <button
                          className="btn btn-sm"
                          onClick={() => setShowFilters(!showFilters)}
                          style={{
                            backgroundColor: showFilters || hasActiveFilters() ? '#c70e2a' : '#f1f3f5',
                            color: showFilters || hasActiveFilters() ? '#fff' : '#333',
                            border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '12px'
                          }}
                        >
                          <Filter size={14} className="me-1" />
                          Filters
                          {hasActiveFilters() && (
                            <span className="badge bg-white text-dark ms-1" style={{ fontSize: '10px' }}>
                              {filters.policyCount.length + filters.status.length + filters.agent.length}
                            </span>
                          )}
                        </button>
                        {/* Clear */}
                        {hasActiveFilters() && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={resetFilters}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            <X size={12} className="me-1" /> Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ---------- Filter bar ---------- */}
                  {showFilters && (
                    <div className="row mt-2 pt-2" style={{ borderTop: '1px solid #eee' }}>
                      <div className="col-12">
                        <div className="d-flex flex-wrap align-items-center gap-2">

                          {/* Policy count */}
                          <div className="dropdown">
                            <button
                              className="btn btn-sm dropdown-toggle"
                              data-bs-toggle="dropdown"
                              style={{ fontSize: '12px', backgroundColor: '#f8f9fa', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 12px', color: '#333' }}
                            >
                              Policies {filters.policyCount.length > 0 && (
                                <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff', marginLeft: '4px' }}>
                                  {filters.policyCount.length}
                                </span>
                              )}
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
                                      if (e.target.checked) setFilters({...filters, policyCount: [...filters.policyCount, option]});
                                      else setFilters({...filters, policyCount: filters.policyCount.filter(p => p !== option)});
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor={`policy-${option}`}>{option}</label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status */}
                          <div className="dropdown">
                            <button
                              className="btn btn-sm dropdown-toggle"
                              data-bs-toggle="dropdown"
                              style={{ fontSize: '12px', backgroundColor: '#f8f9fa', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 12px', color: '#333' }}
                            >
                              Status {filters.status.length > 0 && (
                                <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff', marginLeft: '4px' }}>
                                  {filters.status.length}
                                </span>
                              )}
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
                                      if (e.target.checked) setFilters({...filters, status: [...filters.status, option]});
                                      else setFilters({...filters, status: filters.status.filter(s => s !== option)});
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor={`status-${option}`}>{option}</label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Agent */}
                          <div className="dropdown">
                            <button
                              className="btn btn-sm dropdown-toggle"
                              data-bs-toggle="dropdown"
                              style={{ fontSize: '12px', backgroundColor: '#f8f9fa', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 12px', color: '#333' }}
                            >
                              Agent {filters.agent.length > 0 && (
                                <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff', marginLeft: '4px' }}>
                                  {filters.agent.length}
                                </span>
                              )}
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
                                      if (e.target.checked) setFilters({...filters, agent: [...filters.agent, option]});
                                      else setFilters({...filters, agent: filters.agent.filter(a => a !== option)});
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor={`agent-${option}`}>{option}</label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Birthday */}
                          <div className="dropdown">
                            <button
                              className="btn btn-sm dropdown-toggle"
                              data-bs-toggle="dropdown"
                              style={{ fontSize: '12px', backgroundColor: '#f8f9fa', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 12px', color: '#333' }}
                            >
                              🎂 Birthday{' '}
                              {filters.dobFilter.type !== 'none' && (
                                <span className="badge" style={{ backgroundColor: '#c70e2a', color: '#fff', marginLeft: '4px' }}>1</span>
                              )}
                            </button>
                            <div className="dropdown-menu p-3" style={{ minWidth: '260px' }}>
                              {/* Custom month/day */}
                              <div className="mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="dobType"
                                    id="dobCustom"
                                    checked={filters.dobFilter.type === 'custom'}
                                    onChange={() => setFilters({
                                      ...filters,
                                      dobFilter: { type: 'custom', month: 1, day: 1 },
                                    })}
                                  />
                                  <label className="form-check-label fw-semibold" htmlFor="dobCustom">
                                    Custom Date
                                  </label>
                                </div>
                                {filters.dobFilter.type === 'custom' && (
                                  <div className="d-flex gap-2 mt-1 ps-4">
                                    <select
                                      className="form-select form-select-sm"
                                      style={{ width: '80px' }}
                                      value={filters.dobFilter.month || 1}
                                      onChange={(e) => setFilters({
                                        ...filters,
                                        dobFilter: { ...filters.dobFilter, month: parseInt(e.target.value) },
                                      })}
                                    >
                                      <option value="">MM</option>
                                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                      ))}
                                    </select>
                                    <span style={{ color: '#999' }}>/</span>
                                    <select
                                      className="form-select form-select-sm"
                                      style={{ width: '80px' }}
                                      value={filters.dobFilter.day || 1}
                                      onChange={(e) => setFilters({
                                        ...filters,
                                        dobFilter: { ...filters.dobFilter, day: parseInt(e.target.value) },
                                      })}
                                    >
                                      <option value="">DD</option>
                                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                        <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>

                              <hr className="my-2" />

                              {/* Presets */}
                              <div className="d-flex flex-column gap-1">
                                <div className="form-check">
                                  <input
                                    className="form-check-input" type="radio" name="dobType" id="dobToday"
                                    checked={filters.dobFilter.type === 'today'}
                                    onChange={() => setFilters({ ...filters, dobFilter: { type: 'today' } })}
                                  />
                                  <label className="form-check-label" htmlFor="dobToday">📅 Today</label>
                                </div>
                                <div className="form-check">
                                  <input
                                    className="form-check-input" type="radio" name="dobType" id="dobThisWeek"
                                    checked={filters.dobFilter.type === 'thisWeek'}
                                    onChange={() => setFilters({ ...filters, dobFilter: { type: 'thisWeek' } })}
                                  />
                                  <label className="form-check-label" htmlFor="dobThisWeek">📆 This Week</label>
                                </div>
                                <div className="form-check">
                                  <input
                                    className="form-check-input" type="radio" name="dobType" id="dobThisMonth"
                                    checked={filters.dobFilter.type === 'thisMonth'}
                                    onChange={() => setFilters({ ...filters, dobFilter: { type: 'thisMonth' } })}
                                  />
                                  <label className="form-check-label" htmlFor="dobThisMonth">📆 This Month</label>
                                </div>
                              </div>

                              <hr className="my-2" />

                              <div className="form-check">
                                <input
                                  className="form-check-input" type="radio" name="dobType" id="dobNone"
                                  checked={filters.dobFilter.type === 'none'}
                                  onChange={() => setFilters({ ...filters, dobFilter: { type: 'none' } })}
                                />
                                <label className="form-check-label text-muted" htmlFor="dobNone">✕ No filter</label>
                              </div>
                            </div>
                          </div>

                          {/* Export */}
                          <button
                            className="btn"
                            onClick={handleExport}
                            disabled={!hasActiveFilters() || downloading}
                            style={{
                              backgroundColor: hasActiveFilters() ? '#2a9d36' : '#6c757d',
                              color: '#fff', border: 'none', borderRadius: '4px',
                              padding: '4px 12px', fontSize: '13px', fontWeight: '500',
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

                {/* ---------- Table ---------- */}
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

      {/* =====================================================================
          MODAL – View / Delete
          ===================================================================== */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '700px' }}>
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#c70e2a', color: '#fff' }}>
                <h5 className="modal-title" style={{ color: '#fff' }}>{modalContent.title}</h5>
                <button type="button" className="btn-close" onClick={closeModal} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div className="modal-body">{modalContent.body}</div>
              {modalContent.footer}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminClients;
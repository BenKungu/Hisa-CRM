import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import SidebarNav from "../sidebar";
import Header from "../header";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import { CheckCircle, XCircle, Clock, Trash2 } from 'react-feather';
import { adminService } from '../../services/admin';

interface WhitelistEntry {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const AdminWhitelist = () => {
  const [data, setData] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'remove' | null>(null);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [, setSelectedId] = useState('');

  // Get current user role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role === 'super_admin';

  // Load whitelist data
  const loadWhitelist = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getWhitelist();
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to load whitelist data');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load whitelist');
      console.error('Error loading whitelist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadWhitelist();
    }
  }, [isSuperAdmin]);

  // Open modal
  const openModal = (action: 'approve' | 'reject' | 'remove', email: string, firstName: string, lastName: string, id: string) => {
    setModalAction(action);
    setSelectedEmail(email);
    setSelectedName(`${firstName} ${lastName}`);
    setSelectedId(id);
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setModalAction(null);
    setSelectedEmail('');
    setSelectedName('');
    setSelectedId('');
  };

  // Confirm action
  const confirmAction = async () => {
    if (!modalAction || !selectedEmail) return;

    try {
      if (modalAction === 'approve') {
        await adminService.approveWhitelist(selectedEmail);
      } else if (modalAction === 'reject') {
        await adminService.rejectWhitelist(selectedEmail);
      } else if (modalAction === 'remove') {
        await adminService.removeFromWhitelist(selectedEmail);
      }
      // Refresh the list
      await loadWhitelist();
    } catch (err: any) {
      alert(err.error || 'Action failed');
      console.error('Action error:', err);
    } finally {
      closeModal();
    }
  };

  // Get modal content
  const getModalContent = () => {
    if (modalAction === 'approve') {
      return {
        title: 'Approve User',
        message: `Are you sure you want to approve ${selectedName}?`,
        confirmText: 'Yes, Approve',
        confirmClass: 'btn-success',
      };
    } else if (modalAction === 'reject') {
      return {
        title: 'Reject User',
        message: `Are you sure you want to reject ${selectedName}?`,
        confirmText: 'Yes, Reject',
        confirmClass: 'btn-danger',
      };
    } else if (modalAction === 'remove') {
      return {
        title: 'Remove User',
        message: `Are you sure you want to remove ${selectedName} from whitelist?`,
        confirmText: 'Yes, Remove',
        confirmClass: 'btn-danger',
      };
    }
    return {
      title: '',
      message: '',
      confirmText: '',
      confirmClass: '',
    };
  };

  const modalContent = getModalContent();

  // If not super admin, show access denied
  if (!isSuperAdmin) {
    return (
      <>
        <Header />
        <SidebarNav />
        <div className="page-wrapper">
          <div className="content container-fluid">
            <div className="alert alert-danger">
              <h4>Access Denied</h4>
              <p>Only Super Admins can manage whitelist.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Table columns
  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'firstName',
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar me-2">
            <span className="avatar-title rounded-circle bg-primary text-white" style={{ fontSize: '14px', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {record.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </Link>
          <span>{record.firstName || ''} {record.lastName || ''}</span>
        </div>
      ),
      sorter: (a: any, b: any) => `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.email.localeCompare(b.email),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => {
        let badgeClass = '';
        let icon = null;
        
        if (status === 'pending') {
          badgeClass = 'bg-warning text-dark';
          icon = <Clock size={16} className="me-1" />;
        } else if (status === 'approved') {
          badgeClass = 'bg-success';
          icon = <CheckCircle size={16} className="me-1" />;
        } else if (status === 'rejected') {
          badgeClass = 'bg-danger';
          icon = <XCircle size={16} className="me-1" />;
        }
        
        return (
          <span className={`badge ${badgeClass} p-2`}>
            {icon}
            {status?.charAt(0)?.toUpperCase() + status?.slice(1) || 'Unknown'}
          </span>
        );
      },
      sorter: (a: any, b: any) => a.status?.localeCompare(b.status),
    },
    {
      title: 'Date Added',
      dataIndex: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A',
      sorter: (a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Action',
      dataIndex: '',
      className: 'text-end',
      render: (_: any, record: any) => (
        <div className="text-end">
          {record.status === 'pending' && (
            <>
              <button
                className="btn btn-sm bg-success-light me-2"
                onClick={() => openModal('approve', record.email, record.firstName, record.lastName, record.id)}
                title="Approve"
              >
                <CheckCircle size={16} className="me-1" style={{ color: '#28a745' }} /> 
                Approve
              </button>
              <button
                className="btn btn-sm bg-danger-light"
                onClick={() => openModal('reject', record.email, record.firstName, record.lastName, record.id)}
                title="Reject"
              >
                <XCircle size={16} className="me-1" style={{ color: '#dc3545' }} /> 
                Reject
              </button>
            </>
          )}
          {(record.status === 'approved' || record.status === 'rejected') && (
            <button
              className="btn btn-sm bg-danger-light"
              onClick={() => openModal('remove', record.email, record.firstName, record.lastName, record.id)}
              title="Remove"
            >
              <Trash2 size={16} className="me-1" /> 
              Remove
            </button>
          )}
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
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Whitelist Management</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Whitelist</li>
                </ul>
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
                <div className="card-body">
                  <div className="table-responsive">
                    <Table
                      loading={loading}
                      pagination={{
                        total: data.length,
                        showTotal: (total, range) =>
                          `Showing ${range[0]} to ${range[1]} of ${total} entries`,
                        showSizeChanger: true,
                        onShowSizeChange: onShowSizeChange,
                        itemRender: itemRender,
                      }}
                      style={{ overflowX: "auto" }}
                      columns={columns}
                      dataSource={data}
                      rowKey={(record) => record.id}
                      locale={{
                        emptyText: 'No whitelist entries found'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalContent.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <p>{modalContent.message}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className={`btn ${modalContent.confirmClass}`}
                  onClick={confirmAction}
                >
                  {modalContent.confirmText}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminWhitelist;
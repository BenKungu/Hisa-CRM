import React, { useState, useEffect } from 'react';
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import SidebarNav from "../sidebar";
import { Link } from "react-router-dom";
import Header from "../header";
import { Edit, Trash2, Search, Filter, X, FileText, CheckCircle, XCircle, Clock, DollarSign } from 'react-feather';
import { policyService } from '../../services/policy';

interface PolicyType {
  product_type: string;
  count: number;
  total_premium: number;
  finalised_count: number;
  active_count: number;
  cancelled_count: number;
  policies: any[];
}

// Map product types to icons and colors
const productTypeConfig: { [key: string]: { icon: string; color: string; image: string } } = {
  'Education Policy': {
    icon: '🎓',
    color: '#2a9d36',
    image: 'education'
  },
  'Endowment Policy': {
    icon: '💰',
    color: '#c70e2a',
    image: 'endowment'
  },
  'Life Policy': {
    icon: '❤️',
    color: '#dc3545',
    image: 'life'
  },
  'Health Policy': {
    icon: '🏥',
    color: '#17a2b8',
    image: 'health'
  },
  'Motor Policy': {
    icon: '🚗',
    color: '#fd7e14',
    image: 'motor'
  },
  'Home Policy': {
    icon: '🏠',
    color: '#6f42c1',
    image: 'home'
  },
  'Business Policy': {
    icon: '🏢',
    color: '#2c3e8f',
    image: 'business'
  },
  'Travel Policy': {
    icon: '✈️',
    color: '#20c997',
    image: 'travel'
  },
};

// Default config for unknown types
const defaultConfig = {
  icon: '📋',
  color: '#6c757d',
  image: 'default'
};

const AdminPolicyTypes = () => {
  const [data, setData] = useState<PolicyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PolicyType | null>(null);

  // ============ HELPERS ============

  const formatCurrency = (value: any) => {
    if (!value && value !== 0) return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const getProductTypeConfig = (type: string) => {
    return productTypeConfig[type] || defaultConfig;
  };

  // ============ HANDLERS ============

  const loadPolicyTypes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await policyService.getPolicies();
      if (response.success) {
        const policies = response.data;
        
        // Group by product_type
        const typeMap = new Map<string, PolicyType>();
        
        policies.forEach((policy: any) => {
          const type = policy.product_type || 'Uncategorized';
          
          if (!typeMap.has(type)) {
            typeMap.set(type, {
              product_type: type,
              count: 0,
              total_premium: 0,
              finalised_count: 0,
              active_count: 0,
              cancelled_count: 0,
              policies: []
            });
          }
          
          const entry = typeMap.get(type)!;
          entry.count++;
          entry.total_premium += Number(policy.annualised_premium) || 0;
          entry.policies.push(policy);
          
          if (policy.policy_status?.toLowerCase().includes('finalised')) {
            entry.finalised_count++;
          } else if (policy.policy_status?.toLowerCase().includes('active')) {
            entry.active_count++;
          } else if (policy.policy_status?.toLowerCase().includes('cancelled')) {
            entry.cancelled_count++;
          }
        });
        
        // Convert to array and sort by count
        const sortedTypes = Array.from(typeMap.values())
          .sort((a, b) => b.count - a.count);
        
        setData(sortedTypes);
      } else {
        setError('Failed to load policy types');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load policy types');
      console.error('Error loading policy types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicyTypes();
  }, []);

  const openModal = (type: PolicyType) => {
    setSelectedType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedType(null);
  };

  // ===== FILTERED DATA =====
  const getFilteredData = () => {
    let filtered = data;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.product_type?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  // ============ TABLE COLUMNS ============

  const columns = [
    {
      title: "#",
      dataIndex: "product_type",
      width: 60,
      render: (_: any, __: any, index: number) => (
        <span style={{ color: '#999', fontSize: '14px', fontWeight: '500' }}>
          {index + 1}
        </span>
      ),
    },
    {
      title: "Policy Type",
      dataIndex: "product_type",
      width: 250,
      render: (text: string) => {
        const config = getProductTypeConfig(text);
        return (
          <div className="d-flex align-items-center">
            <span 
              className="avatar me-2 rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{
                width: '40px',
                height: '40px',
                minWidth: '40px',
                minHeight: '40px',
                backgroundColor: config.color + '20',
                color: config.color,
                fontSize: '20px',
                borderRadius: '50%',
                flexShrink: 0
              }}
            >
              {config.icon}
            </span>
            <span style={{ fontWeight: '500', fontSize: '14px' }}>{text || 'Uncategorized'}</span>
          </div>
        );
      },
      sorter: (a: any, b: any) => (a.product_type || '').localeCompare(b.product_type || ''),
    },
    {
      title: "Policies",
      dataIndex: "count",
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ 
          fontWeight: '600', 
          fontSize: '16px',
          color: '#2c3e8f',
          backgroundColor: '#d8ddf3',
          padding: '2px 12px',
          borderRadius: '12px',
          display: 'inline-block'
        }}>
          {count || 0}
        </span>
      ),
      sorter: (a: any, b: any) => (a.count || 0) - (b.count || 0),
    },
    {
      title: "Total Premium",
      dataIndex: "total_premium",
      width: 150,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ fontWeight: '600', color: '#2a9d36', fontSize: '14px' }}>
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
      title: "Active",
      dataIndex: "active_count",
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ 
          fontWeight: '500', 
          fontSize: '13px',
          color: count > 0 ? '#0d6efd' : '#999',
          backgroundColor: count > 0 ? '#cfe2ff' : '#f5f5f5',
          padding: '2px 10px',
          borderRadius: '12px',
          display: 'inline-block'
        }}>
          <FileText size={12} className="me-1" />
          {count || 0}
        </span>
      ),
      sorter: (a: any, b: any) => (a.active_count || 0) - (b.active_count || 0),
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
      render: (_: any, record: PolicyType) => (
        <div className="text-end">
          <button
            className="btn btn-sm me-1"
            onClick={() => openModal(record)}
            title="View Details"
            style={{ backgroundColor: '#2a9d36', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px' }}
          >
            <FileText size={13} />
          </button>
        </div>
      ),
    },
  ];

  // ============ MODAL CONTENT ============

  const getModalContent = () => {
    if (!selectedType) return { title: '', body: null, footer: null };

    const config = getProductTypeConfig(selectedType.product_type);
    const hasPolicies = selectedType.policies.length > 0;
    const recentPolicies = hasPolicies ? selectedType.policies.slice(0, 10) : [];

    return {
      title: 'Policy Type Details',
      body: (
        <div>
          {/* Header */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            borderLeft: `4px solid ${config.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span 
              className="rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: config.color + '20',
                color: config.color,
                fontSize: '28px',
                flexShrink: 0
              }}
            >
              {config.icon}
            </span>
            <div>
              <h5 style={{ marginBottom: '2px', fontWeight: '600' }}>
                {selectedType.product_type || 'Uncategorized'}
              </h5>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {selectedType.count} policies · KES {formatCurrency(selectedType.total_premium)} total premium
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="row g-2">
            <div className="col-4">
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                backgroundColor: '#e8f5e9', 
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#2a9d36' }}>
                  {selectedType.finalised_count || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>Finalised</div>
              </div>
            </div>
            <div className="col-4">
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                backgroundColor: '#cfe2ff', 
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#0d6efd' }}>
                  {selectedType.active_count || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>Active</div>
              </div>
            </div>
            <div className="col-4">
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                backgroundColor: '#fde8ea', 
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#c70e2a' }}>
                  {selectedType.cancelled_count || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>Cancelled</div>
              </div>
            </div>
          </div>

          {/* Recent Policies */}
          {hasPolicies && (
            <>
              <hr />
              <h6 className="mt-3" style={{ color: '#c70e2a' }}>
                <FileText size={14} className="me-1" /> Recent Policies
              </h6>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {recentPolicies.map((policy: any, idx: number) => (
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
                        {policy.client_name || 'N/A'}
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
                {selectedType.policies.length > 10 && (
                  <p className="text-muted" style={{ fontSize: '12px', marginTop: '5px' }}>
                    ... and {selectedType.policies.length - 10} more policies
                  </p>
                )}
              </div>
            </>
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

  const rowClassName = (record: any, index: number) => {
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
                <h3 className="page-title">Policy Types</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Policy Types</li>
                </ul>
              </div>
              <div className="col-sm-5 text-end">
                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: '#2a9d36', borderColor: '#2a9d36' }}
                  disabled
                >
                  Add Policy Type
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
                  <div className="row align-items-center">
                    <div className="col">
                      <h5 className="card-title mb-0">All Policy Types</h5>
                      <p className="text-muted mb-0">
                        Total: <strong className="text-dark">{filteredData.length}</strong> policy types
                      </p>
                    </div>
                    <div className="col-auto">
                      <div className="input-group input-group-sm" style={{ width: '200px' }}>
                        <span className="input-group-text bg-white">
                          <Search size={14} className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Search types..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <Table
                      loading={loading}
                      rowClassName={rowClassName}
                      pagination={{
                        total: filteredData.length,
                        showTotal: (total, range) =>
                          `Showing ${range[0]} to ${range[1]} of ${total} policy types`,
                        showSizeChanger: true,
                        onShowSizeChange: onShowSizeChange,
                        itemRender: itemRender,
                        defaultPageSize: 10,
                      }}
                      style={{ overflowX: "auto" }}
                      columns={columns}
                      dataSource={filteredData}
                      rowKey={(record) => record.product_type}
                      locale={{ emptyText: 'No policy types found' }}
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
      `}</style>

      {/* Modal */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '600px' }}>
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

export default AdminPolicyTypes;


// import React from "react";
// import { Table } from "antd";
// import "bootstrap/dist/css/bootstrap.css";
// import "bootstrap-daterangepicker/daterangepicker.css";
// import { itemRender, onShowSizeChange } from "../paginationfunction";
// import SidebarNav from "../sidebar";
// import {
//   specialities_01,
//   specialities_02,
//   specialities_03,
//   specialities_04,
//   specialities_05,
// } from "../../core/data/json/imagepath";
// import { Link } from "react-router-dom";
// import Header from "../header";
// import { Edit, Trash2 } from "react-feather";

// const AdminSpecialities: React.FC = () => {
//   const data = [
//     {
//       id: 1,
//       PatientName: "#SP001",
//       Specialities: "Urology",
//       Description: " ",
//       Date: "27 Sep 2019",
//       time: "03.40 PM",
//       image: specialities_01,
//     },
//     {
//       id: 2,
//       PatientName: "#SP002",
//       Specialities: "Neurology",
//       Description: " ",
//       Date: "1 Nov 2019",
//       time: "02.59 PM",
//       image: specialities_02,
//     },
//     {
//       id: 3,
//       PatientName: "#SP003",
//       Specialities: "Orthopedic",
//       Description: " ",
//       Date: "3 Nov 2019",
//       time: "09.59 PM",
//       image: specialities_03,
//     },
//     {
//       id: 4,
//       PatientName: "#SP004",
//       Specialities: "Cardiologist",
//       Description: " ",
//       Date: "16 Jun 2019",
//       time: "04.50 PM",
//       image: specialities_04,
//     },
//     {
//       id: 5,
//       PatientName: "#SP005",
//       Specialities: "Dentist",
//       Description: " ",
//       Date: "22 Aug 2019",
//       time: "01.50 PM",
//       image: specialities_05,
//     },
//   ];
//   const columns = [
//     {
//       title: "#",
//       dataIndex: "PatientName",
//       sorter: (a: any, b: any) => a.PatientName.length - b.PatientName.length,
//     },
//     {
//       title: "Specialities",
//       dataIndex: "Specialities",
//       render: (text: any, record: any) => (
//         <>
//           <Link className="avatar mx-2" to="/admin/profile">
//             <img src={record.image} />
//           </Link>
//           <Link to="/admin/profile">{text}</Link>
//         </>
//       ),
//       sorter: (a: any, b: any) => a.Specialities.length - b.Specialities.length,
//     },
//     {
//       title: "Action",
//       className: "text-end",
//       dataIndex: "",
//       render: () => (
//         <div className="text-end">
//           <Link to="#" className="btn btn-sm bg-success-light me-2">
//             <Edit size={16} /> Edit
//           </Link>
//           <Link to="#" className="btn btn-sm bg-danger-light">
//             <Trash2 size={16} /> Delete
//           </Link>
//         </div>
//       ),
//       sorter: (a: any, b: any) => a.length - b.length,
//     },
//   ];

//   return (
//     <>
//     <Header />
//       <SidebarNav />
//       <div className="page-wrapper">
//         <div className="content container-fluid">
//           {/* Page Header */}
//           <div className="page-header">
//             <div className="row">
//               <div className="col-sm-7 col-aut0">
//                 <h3 className="page-title">Policy Types</h3>
//                 <ul className="breadcrumb">
//                   <li className="breadcrumb-item">
//                     <Link to="/admin-dashboard">Dashboard</Link>
//                   </li>
//                   <li className="breadcrumb-item active">Policy Types</li>
//                 </ul>
//               </div>
//               <div className="col-sm-5 col">
//                 <Link
//                   to="#Add_Specialities_details"
//                   data-bs-toggle="modal"
//                   className="btn btn-primary float-end mt-2"
//                 >
//                   Add
//                 </Link>
//               </div>
//             </div>
//           </div>
//           {/* /Page Header */}
//           <div className="row">
//             <div className="col-sm-12">
//               <div className="card">
//                 <div className="card-body">
//                   <div className="table-responsive">
//                     <Table
//                       pagination={{
//                         total: data.length,
//                         showTotal: (total, range) =>
//                           `Showing ${range[0]} to ${range[1]} of ${total} entries`,
//                         showSizeChanger: true,
//                         onShowSizeChange: onShowSizeChange,
//                         itemRender: itemRender,
//                       }}
//                       style={{ overflowX: "auto" }}
//                       columns={columns}
//                       dataSource={data}
//                       rowKey={(record) => record.id}
//                       //  onChange={this.handleTableChange}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div
//         className="modal fade"
//         id="edit_specialities_details"
//         aria-hidden="true"
//         role="dialog"
//       >
//         <div className="modal-dialog modal-dialog-centered" role="document">
//           <div className="modal-content">
//             <div className="modal-header">
//               <h5 className="modal-title">Edit Policies</h5>
//               <button
//                 type="button"
//                 className="btn-close"
//                 data-bs-dismiss="modal"
//                 aria-label="Close"
//               />
//             </div>
//             <div className="modal-body">
//               <form>
//                 <div className="row form-row">
//                   <div className="col-12 col-sm-6">
//                     <div className="form-group">
//                       <label>Policy Types</label>
//                       <input
//                         type="text"
//                         className="form-control"
//                         defaultValue="Cardiology"
//                       />
//                     </div>
//                   </div>
//                   <div className="col-12 col-sm-6">
//                     <div className="form-group">
//                       <label>Image</label>
//                       <input type="file" className="form-control" />
//                     </div>
//                   </div>
//                 </div>
//                 <button type="submit" className="btn btn-primary w-100">
//                   Save Changes
//                 </button>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div
//         className="modal fade"
//         id="delete_modal"
//         aria-hidden="true"
//         role="dialog"
//       >
//         <div className="modal-dialog modal-dialog-centered" role="document">
//           <div className="modal-content">
//             <div className="modal-body">
//               <div className="form-content p-2">
//                 <h4 className="modal-title">Delete</h4>
//                 <p className="mb-4">Are you sure want to delete?</p>
//                 <button type="button" className="btn btn-primary mx-1">
//                   Save{" "}
//                 </button>
//                 <button
//                   type="button"
//                   className="btn btn-danger"
//                   data-bs-dismiss="modal"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div
//         className="modal fade"
//         id="Add_Specialities_details"
//         aria-hidden="true"
//         role="dialog"
//       >
//         <div className="modal-dialog modal-dialog-centered" role="document">
//           <div className="modal-content">
//             <div className="modal-header">
//               <h5 className="modal-title">Add Policy Types</h5>
//               <button
//                 type="button"
//                 className="btn-close"
//                 data-bs-dismiss="modal"
//                 aria-label="Close"
//               />
//             </div>
//             <div className="modal-body">
//               <form>
//                 <div className="row form-row">
//                   <div className="col-12 col-sm-6">
//                     <div className="form-group">
//                       <label>Policy Types</label>
//                       <input type="text" className="form-control" />
//                     </div>
//                   </div>
//                   <div className="col-12 col-sm-6">
//                     <div className="form-group">
//                       <label>Image</label>
//                       <input type="file" className="form-control" />
//                     </div>
//                   </div>
//                 </div>
//                 <button type="submit" className="btn btn-primary w-100">
//                   Save Changes
//                 </button>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default AdminSpecialities;

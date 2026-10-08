import { useEffect, useState } from "react";
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import SidebarNav from "../sidebar";
import { Link } from "react-router-dom";
import Header from "../header";
import { Search, Eye, Edit3, FileText, CheckCircle, Trash2 } from "react-feather";
import apiClient from "../../services/api";

interface ApplicationRow {
  id: string;
  reference: string;
  applicant_name: string;
  applicant_id_no: string;
  agent_name: string | null;
  agent_code: string | null;
  product_type: string | null;
  premium_amount: string | number | null;
  premium_frequency: string | null;
  date_received: string | null;
  status: "draft" | "submitted";
  submitted_at: string | null;
  created_at: string;
  document_count: number;
  uploaded_count: number;
}

interface ApplicationsListProps {
  provider?: "absa" | "old_mutual";
}

const ApplicationsList = ({ provider = "absa" }: ApplicationsListProps) => {
  const isOm = provider === "old_mutual";
  const accent = isOm ? "#2a9d36" : "#c70e2a";
  const listTitle = isOm ? "Old Mutual Applications" : "Absa Applications";

  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState("");

  // ============ HELPERS ============

  const formatCurrency = (value: any) => {
    if (!value && value !== 0) return "0";
    const num = Number(value);
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============ LOAD ============

  const loadApplications = async () => {
    setLoading(true);
    setError("");
    try {
          const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter && statusFilter !== "all")
      params.append("status", statusFilter);
    params.append("provider", provider);

    const res = await apiClient.get(`/applications?${params.toString()}`
      );
      setApplications(res.data?.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to load applications"
      );
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, provider]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadApplications();
  };

  const handleDelete = async (app: ApplicationRow) => {
    const confirmed = window.confirm(
      `Delete draft application ${app.reference}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await apiClient.delete(`/applications/${app.id}`);
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          "Failed to delete. Only drafts can be deleted."
      );
    }
  };

  // ============ TABLE COLUMNS ============

  const columns = [
    {
      title: "#",
      dataIndex: "reference",
      width: 60,
      render: (_: any, __: any, index: number) => (
        <span style={{ color: "#999", fontSize: "14px", fontWeight: "500" }}>
          {index + 1}
        </span>
      ),
    },
    {
      title: "Reference",
      dataIndex: "reference",
      width: 140,
      render: (text: string) => (
        <span style={{ fontWeight: "600", color: "#2c3e8f", fontSize: "13px" }}>
          {text}
        </span>
      ),
      sorter: (a: any, b: any) =>
        (a.reference || "").localeCompare(b.reference || ""),
    },
    {
      title: "Applicant",
      dataIndex: "applicant_name",
      width: 220,
      render: (_: any, record: ApplicationRow) => (
        <div>
          <div style={{ fontWeight: "500", fontSize: "14px" }}>
            {record.applicant_name || "—"}
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            ID: {record.applicant_id_no}
          </div>
        </div>
      ),
      sorter: (a: any, b: any) =>
        (a.applicant_name || "").localeCompare(b.applicant_name || ""),
    },
    {
      title: "Product",
      dataIndex: "product_type",
      width: 160,
      render: (text: string) => (
        <span style={{ fontSize: "13px" }}>{text || "—"}</span>
      ),
    },
    {
      title: "Agent",
      dataIndex: "agent_name",
      width: 180,
      render: (_: any, record: ApplicationRow) => (
        <div>
          <div style={{ fontSize: "13px" }}>{record.agent_name || "—"}</div>
          {record.agent_code && (
            <div style={{ fontSize: "11px", color: "#888" }}>
              {record.agent_code}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Premium",
      dataIndex: "premium_amount",
      width: 160,
      align: "right" as const,
      render: (value: any, record: ApplicationRow) => (
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: "600", color: "#2a9d36", fontSize: "13px" }}>
            KES {formatCurrency(value)}
          </div>
          {record.premium_frequency && (
            <div style={{ fontSize: "11px", color: "#888" }}>
              {record.premium_frequency}
            </div>
          )}
        </div>
      ),
      sorter: (a: any, b: any) =>
        (Number(a.premium_amount) || 0) - (Number(b.premium_amount) || 0),
    },
    {
      title: "Received",
      dataIndex: "date_received",
      width: 120,
      render: (d: string | null) => (
        <span style={{ fontSize: "13px" }}>{formatDate(d)}</span>
      ),
      sorter: (a: any, b: any) => {
        const at = a.date_received ? new Date(a.date_received).getTime() : 0;
        const bt = b.date_received ? new Date(b.date_received).getTime() : 0;
        return at - bt;
      },
    },
    {
      title: "Docs",
      dataIndex: "uploaded_count",
      width: 80,
      align: "center" as const,
      render: (_: any, record: ApplicationRow) => {
        const isComplete = record.uploaded_count > 0;
        return (
          <span
            style={{
              fontWeight: "500",
              fontSize: "13px",
              color: isComplete ? "#2a9d36" : "#999",
              backgroundColor: isComplete ? "#e8f5e9" : "#f5f5f5",
              padding: "2px 10px",
              borderRadius: "12px",
              display: "inline-block",
            }}
          >
            <FileText size={12} className="me-1" />
            {record.uploaded_count}/{record.document_count}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      align: "center" as const,
      render: (status: string) =>
        status === "submitted" ? (
          <span
            style={{
              fontWeight: "500",
              fontSize: "12px",
              color: "#2a9d36",
              backgroundColor: "#e8f5e9",
              padding: "3px 10px",
              borderRadius: "12px",
              display: "inline-block",
            }}
          >
            <CheckCircle size={12} className="me-1" />
            Submitted
          </span>
        ) : (
          <span
            style={{
              fontWeight: "500",
              fontSize: "12px",
              color: "#fd7e14",
              backgroundColor: "#fff3e0",
              padding: "3px 10px",
              borderRadius: "12px",
              display: "inline-block",
            }}
          >
            Draft
          </span>
        ),
    },
        {
      title: "",
      dataIndex: "",
      width: 110,
      className: "text-end",
      render: (_: any, record: ApplicationRow) => (
        <div className="text-end d-flex gap-1 justify-content-end">
          {record.status === "submitted" ? (
            <Link
              to={`/applications/${record.id}`}
              title="View"
              style={{
                backgroundColor: "#2a9d36",
                color: "#fff",
                border: "none",
                padding: "3px 7px",
                borderRadius: "4px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Eye size={13} />
            </Link>
          ) : (
            <>
              <Link
                to={`/applications/${record.id}/documents`}
                title="Continue"
                style={{
                  backgroundColor: "#fd7e14",
                  color: "#fff",
                  border: "none",
                  padding: "3px 7px",
                  borderRadius: "4px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Edit3 size={13} />
              </Link>
              <button
                type="button"
                title="Delete draft"
                onClick={() => handleDelete(record)}
                style={{
                  backgroundColor: "#c70e2a",
                  color: "#fff",
                  border: "none",
                  padding: "3px 7px",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const rowClassName = (_record: any, index: number) => {
    return index % 2 === 0 ? "table-row-even" : "table-row-odd";
  };

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Page Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-7">
                                <h3 className="page-title">{listTitle}</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                   <li className="breadcrumb-item active">{listTitle}</li>
                </ul>
              </div>
              <div className="col-sm-5 text-end">
                                                <Link
                  to="/new-application"
                  className="btn btn-primary"
                  style={{ backgroundColor: accent, borderColor: accent }}
                >
                  + New Application
                </Link>
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
                      <h5 className="card-title mb-0">{listTitle}</h5>
                      <p className="text-muted mb-0">
                        Total:{" "}
                        <strong className="text-dark">
                          {applications.length}
                        </strong>{" "}
                        applications
                      </p>
                    </div>
                    <div className="col-auto">
                      <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
                        <select
                          className="form-select form-select-sm"
                          style={{ width: "140px" }}
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Statuses</option>
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                        </select>
                        <div
                          className="input-group input-group-sm"
                          style={{ width: "240px" }}
                        >
                          <span className="input-group-text bg-white">
                            <Search size={14} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search reference, applicant…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                          <button
                            type="submit"
                            className="btn btn-sm"
                            style={{
                              backgroundColor: "#2a9d36",
                              color: "#fff",
                              borderColor: "#2a9d36",
                            }}
                          >
                            Go
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <Table
                      loading={loading}
                      rowClassName={rowClassName}
                      pagination={{
                        total: applications.length,
                        showTotal: (total, range) =>
                          `Showing ${range[0]} to ${range[1]} of ${total} applications`,
                        showSizeChanger: true,
                        onShowSizeChange: onShowSizeChange,
                        itemRender: itemRender,
                        defaultPageSize: 10,
                      }}
                      style={{ overflowX: "auto" }}
                      columns={columns}
                      dataSource={applications}
                      rowKey={(record) => record.id}
                      locale={{ emptyText: "No applications found" }}
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
    </>
  );
};

export default ApplicationsList;
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SidebarNav from "../sidebar";
import Header from "../header";
import apiClient from "../../services/api";
import { ArrowLeft, FileText, Download, ExternalLink } from "react-feather";
import absaLogo from "../../assets/logos/absa-logo.png";
import omLogo from "../../assets/logos/om-logo.png";

interface DocumentWithUrl {
  id: string;
  doc_type: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded: boolean;
  viewUrl: string | null;
}

const isImage = (mime: string | null) =>
  !!mime && mime.startsWith("image/");

const isPdf = (mime: string | null) =>
  mime === "application/pdf" || (mime ? mime.includes("pdf") : false);

const formatBytes = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

const ViewApplication = () => {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    apiClient
      .get(`/applications/${id}`)
      .then((res) => {
        setApplication(res.data);
        setDocuments(res.data.documents || []);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error || "Failed to load application"
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <SidebarNav />
        <div className="page-wrapper">
          <div className="content container-fluid">
            <p>Loading…</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !application) {
    return (
      <>
        <Header />
        <SidebarNav />
        <div className="page-wrapper">
          <div className="content container-fluid">
            <div className="alert alert-danger">
              {error || "Application not found"}
            </div>
            <Link to="/applications" className="btn btn-secondary">
              <ArrowLeft size={14} className="me-1" /> Back to Applications
            </Link>
          </div>
        </div>
      </>
    );
  }

    const uploadedDocs = documents.filter((d) => d.uploaded);
  const applicantName = `${application.applicant_first_name || ""} ${
    application.applicant_surname || ""
  }`.trim();

  const isSubmitted = application.status === "submitted";
  const isOm = application.provider === "old_mutual";
  const accent = isOm ? "#2a9d36" : "#c70e2a";
  const providerLabel = isOm ? "Old Mutual" : "Absa";
const basePath = isOm ? "/om-applications" : "/applications";
const logo = isOm ? omLogo : absaLogo;

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Page Header */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col-sm-8">
                                <h3
                  className="page-title d-flex align-items-center"
                  style={{ gap: "12px", flexWrap: "wrap" }}
                >
                  <img
                    src={logo}
                    alt={providerLabel}
                    style={{ height: 32, objectFit: "contain" }}
                  />
                  <span
                    style={{
                      color: accent,
                      fontWeight: 600,
                      marginRight: "4px",
                    }}
                  >
                    {providerLabel}
                  </span>
                  <span>{application.reference}</span>
                  <span
                    style={{
                      fontWeight: "500",
                      fontSize: "13px",
                      color: isSubmitted ? accent : "#fd7e14",
                      backgroundColor: "#f5f5f5",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      display: "inline-block",
                    }}
                  >
                    {isSubmitted ? "Submitted" : "Draft"}
                  </span>
                </h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                                    <li className="breadcrumb-item">
                    <Link to={basePath}>Applications</Link>
                  </li>
                  <li className="breadcrumb-item active">
                    {application.reference}
                  </li>
                </ul>
              </div>
              <div className="col-sm-4 text-end">
                                <Link
                  to={basePath}
                  className="btn btn-outline-secondary"
                >
                  <ArrowLeft size={14} className="me-1" /> Back to List
                </Link>
              </div>
            </div>
          </div>

          {/* Applicant + Application Details */}
          <div className="row">
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Applicant</h5>
                </div>
                <div className="card-body">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <td style={{ width: "40%" }}>
                          <strong>Name</strong>
                        </td>
                        <td>{applicantName || "—"}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>ID Number</strong>
                        </td>
                        <td>{application.applicant_id_no || "—"}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Linked Client</strong>
                        </td>
                        <td>
                                                    {application.client_id ? (
                            <span
                              style={{
                                backgroundColor: accent,
                                color: "#fff",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              Linked
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: "#999",
                                color: "#fff",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              Not linked yet
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Application</h5>
                </div>
                <div className="card-body">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <td style={{ width: "40%" }}>
                          <strong>Product Type</strong>
                        </td>
                        <td>{application.product_type || "—"}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Premium</strong>
                        </td>
                        <td>
                                                    {application.premium_amount ? (
                            <span
                              style={{
                                fontWeight: "600",
                                color: accent,
                              }}
                            >
                              KES {formatCurrency(application.premium_amount)}
                            </span>
                          ) : (
                            "—"
                          )}
                          {application.premium_frequency
                            ? ` (${application.premium_frequency})`
                            : ""}
                        </td>
                      </tr>
                                            <tr>
                        <td>
                          <strong>Frequency</strong>
                        </td>
                        <td>{application.premium_frequency || "—"}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Payment Term</strong>
                        </td>
                        <td>{application.payment_term || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

                    {/* Agent + Dates */}
          <div className="row">
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Agent</h5>
                </div>
                <div className="card-body">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <td style={{ width: "40%" }}>
                          <strong>Agent Name</strong>
                        </td>
                        <td>{application.agent_name || "—"}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Agent Code</strong>
                        </td>
                        <td>{application.agent_code || "—"}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Company</strong>
                        </td>
                        <td>Hisa Africa</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Dates</h5>
                </div>
                <div className="card-body">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <td style={{ width: "40%" }}>
                          <strong>Date Received</strong>
                        </td>
                        <td>{formatDate(application.date_received)}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Direct Debit</strong>
                        </td>
                        <td>{formatDate(application.direct_debit_date)}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Submitted</strong>
                        </td>
                        <td>
                          {application.submitted_at ? (
                            <>
                              {new Date(
                                application.submitted_at
                              ).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                              {application.created_by_user && (
                                <>
                                  {" by "}
                                  <strong>
                                    {`${
                                      application.created_by_user
                                        .first_name || ""
                                    } ${
                                      application.created_by_user
                                        .last_name || ""
                                    }`.trim() ||
                                      application.created_by_user.email}
                                  </strong>
                                </>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FileText size={16} className="me-2" />
                    Documents ({uploadedDocs.length})
                  </h5>
                </div>
                <div className="card-body">
                  {uploadedDocs.length === 0 && (
                    <p className="text-muted mb-0">
                      No documents were uploaded.
                    </p>
                  )}

                  {uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="mb-4 pb-4"
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                                            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                        <div>
                          <h6
                            className="mb-0"
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#1a1a1a",
                            }}
                          >
                            {doc.doc_type}
                          </h6>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#888",
                              marginTop: "2px",
                            }}
                          >
                            {doc.file_name}
                            {doc.size_bytes
                              ? ` · ${formatBytes(doc.size_bytes)}`
                              : ""}
                          </div>
                        </div>
                        {doc.viewUrl && (
                          <div className="d-flex gap-2">
                                                        <a
                              href={doc.viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm"
                              style={{
                                backgroundColor: accent,
                                color: "#fff",
                                borderColor: accent,
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              <Download size={12} className="me-1" />
                              Download
                            </a>
                            <a
                              href={doc.viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-secondary"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              <ExternalLink size={12} className="me-1" />
                              New Tab
                            </a>
                          </div>
                        )}
                      </div>

                      {!doc.viewUrl && (
                        <div className="text-muted small">
                          Preview link unavailable.
                        </div>
                      )}

                      {doc.viewUrl && isImage(doc.mime_type) && (
                        <div style={{ maxWidth: "500px" }}>
                          <img
                            src={doc.viewUrl}
                            alt={doc.doc_type}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "400px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                            }}
                          />
                        </div>
                      )}

                      {doc.viewUrl && isPdf(doc.mime_type) && (
                        <div
                          style={{
                            width: "100%",
                            height: "600px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                          }}
                        >
                          <iframe
                            src={doc.viewUrl}
                            title={doc.doc_type}
                            width="100%"
                            height="100%"
                            style={{ border: "none" }}
                          />
                        </div>
                      )}

                      {doc.viewUrl &&
                        !isImage(doc.mime_type) &&
                        !isPdf(doc.mime_type) && (
                          <div
                            className="p-3 bg-light d-flex align-items-center"
                            style={{ borderRadius: "4px" }}
                          >
                            <FileText
                              size={28}
                              style={{ color: "#666", marginRight: "15px" }}
                            />
                            <div>
                              <div>
                                <strong>{doc.file_name}</strong>
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#888" }}
                              >
                                This file type can't be previewed inline.
                                Use the buttons above to open it.
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewApplication;
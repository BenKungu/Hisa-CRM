import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SidebarNav from "../sidebar";
import Header from "../header";
import apiClient from "../../services/api";

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

const ApplicationPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get(`/applications/${id}`)
      .then((res) => {
        setApplication(res.data);
        setDocuments(res.data.documents || []);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load application");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!id || !confirmed) return;
    setSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/applications/${id}/submit`, {});
      navigate(`/applications/${id}/success`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Submission failed");
      setSubmitting(false);
    }
  };

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

  const uploadedDocs = documents.filter((d) => d.uploaded);
  const applicantName = application
    ? `${application.applicant_first_name || ""} ${application.applicant_surname || ""}`.trim()
    : "";

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Preview & Confirm</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/new-application">New Application</Link>
                  </li>
                  <li className="breadcrumb-item active">Preview</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          {/* Summary card */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">
                    Application Summary — {application?.reference}
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <p>
                        <strong>Applicant:</strong> {applicantName}
                      </p>
                      <p>
                        <strong>ID Number:</strong>{" "}
                        {application?.applicant_id_no}
                      </p>
                      <p>
                        <strong>Date Received:</strong>{" "}
                        {application?.date_received
                          ? new Date(
                              application.date_received
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="col-md-4">
                      <p>
                        <strong>Agent:</strong>{" "}
                        {application?.agent_name || "—"}{" "}
                        {application?.agent_code
                          ? `(${application.agent_code})`
                          : ""}
                      </p>
                      <p>
                        <strong>Policy Type:</strong>{" "}
                        {application?.product_type || "—"}
                      </p>
                      <p>
                        <strong>Frequency:</strong>{" "}
                        {application?.premium_frequency || "—"}
                      </p>
                    </div>
                    <div className="col-md-4">
                      <p>
                        <strong>Premium:</strong>{" "}
                        {application?.premium_amount
                          ? Number(
                              application.premium_amount
                            ).toLocaleString("en-KE")
                          : "—"}
                      </p>
                      <p>
                        <strong>Direct Debit Date:</strong>{" "}
                        {application?.direct_debit_date
                          ? new Date(
                              application.direct_debit_date
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                  {application?.notes && (
                    <div className="row mt-2">
                      <div className="col-md-12">
                        <p>
                          <strong>Notes:</strong> {application.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Document previews */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">
                    Documents ({uploadedDocs.length})
                  </h5>
                  <p className="card-text mb-0">
                    Review each document below before submitting.
                  </p>
                </div>
                <div className="card-body">
                  {uploadedDocs.length === 0 && (
                    <p className="text-muted">
                      No documents uploaded yet. Go back and upload at least one.
                    </p>
                  )}

                  {uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="mb-4 pb-4"
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">
                          {doc.doc_type}
                          <span className="text-muted ms-2">
                            — {doc.file_name}{" "}
                            {doc.size_bytes
                              ? `(${formatBytes(doc.size_bytes)})`
                              : ""}
                          </span>
                        </h6>
                        {doc.viewUrl && (
                          <a
                            href={doc.viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            Open in new tab
                          </a>
                        )}
                      </div>

                      {!doc.viewUrl && (
                        <div className="text-muted small">
                          Preview unavailable
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
                            <i
                              className="fas fa-file me-3"
                              style={{ fontSize: "32px", color: "#666" }}
                            />
                            <div>
                              <div>
                                <strong>{doc.file_name}</strong>
                              </div>
                              <div className="text-muted small">
                                This file type can't be previewed inline.
                                Click "Open in new tab" to view it.
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

          {/* Confirm + Submit */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="confirmCheck"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="confirmCheck"
                    >
                      I confirm all documents are correct and complete.
                    </label>
                  </div>

                  <div className="submit-section">
                    <button
                      type="button"
                      className="btn btn-primary submit-btn"
                      onClick={handleSubmit}
                      disabled={!confirmed || submitting || uploadedDocs.length === 0}
                    >
                      {submitting ? "Submitting…" : "Submit to Absa"}
                    </button>
                    <Link
                      to={`/applications/${id}/documents`}
                      className="btn btn-outline-secondary ms-2"
                    >
                      Back to Documents
                    </Link>
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

export default ApplicationPreview;
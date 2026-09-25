import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SidebarNav from "../sidebar";
import Header from "../header";
import apiClient from "../../services/api";

const DEFAULT_DOC_TYPES = [
  "Application Form",
  "Direct Debit Form",
  "PIN Certificate",
  "Identification",
  "Bank Proof",
  "Proof of Payment",
  "Premium Illustrator",
];

interface DocRow {
  rowId: string;
  doc_type: string;
  status: "idle" | "uploading" | "uploaded" | "error";
  documentId?: string;
  fileName?: string;
  error?: string;
}

const buildInitialRows = (existingDocs: any[]): DocRow[] => {
  const rows: DocRow[] = [];
  const usedIds = new Set<string>();

  DEFAULT_DOC_TYPES.forEach((type) => {
    const match = existingDocs.find(
      (d) => d.doc_type === type && !usedIds.has(d.id)
    );
    if (match) {
      usedIds.add(match.id);
      rows.push({
        rowId: `row-${match.id}`,
        doc_type: type,
        status: "uploaded",
        documentId: match.id,
        fileName: match.file_name,
      });
    } else {
      rows.push({
        rowId: `row-${crypto.randomUUID()}`,
        doc_type: type,
        status: "idle",
      });
    }
  });

  existingDocs.forEach((d) => {
    if (!usedIds.has(d.id)) {
      rows.push({
        rowId: `row-${d.id}`,
        doc_type: d.doc_type,
        status: "uploaded",
        documentId: d.id,
        fileName: d.file_name,
      });
    }
  });

  return rows;
};

const ApplicationDocuments = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [rows, setRows] = useState<DocRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nextBusy, setNextBusy] = useState(false);

  // Keep a ref of rows so the file input onChange handler sees latest state
  const rowsRef = useRef<DocRow[]>([]);
  rowsRef.current = rows;

  useEffect(() => {
    if (!id) return;
    apiClient
      .get(`/applications/${id}`)
      .then((res) => {
        setApplication(res.data);
        setRows(buildInitialRows(res.data.documents || []));
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load application");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateRow = (rowId: string, patch: Partial<DocRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r))
    );
  };

  const uploadFile = async (row: DocRow, file: File) => {
    if (!id) return;
    updateRow(row.rowId, { status: "uploading", error: undefined });

    try {
      // 1. Ask backend for a presigned PUT URL + create the DB row
      const reqRes = await apiClient.post(`/applications/${id}/documents`, {
        doc_type: row.doc_type,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });
      const { documentId, uploadUrl } = reqRes.data;

      // 2. PUT the file directly to Lightsail Object Storage
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error(`Storage upload failed (${putRes.status})`);
      }

      // 3. Confirm upload success to backend
      await apiClient.patch(`/applications/${id}/documents/${documentId}`, {});

      updateRow(row.rowId, {
        status: "uploaded",
        documentId,
        fileName: file.name,
      });
    } catch (err: any) {
      updateRow(row.rowId, {
        status: "error",
        error:
          err.response?.data?.error ||
          err.message ||
          "Upload failed. Check storage configuration.",
      });
    }
  };

  const handleFileChange = (
    row: DocRow,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(row, file);
    e.target.value = ""; // allow re-picking the same file
  };

  const handleDelete = async (row: DocRow) => {
    if (!id || !row.documentId) return;
    if (!confirm(`Remove ${row.fileName || row.doc_type}?`)) return;

    try {
      await apiClient.delete(
        `/applications/${id}/documents/${row.documentId}`
      );
      updateRow(row.rowId, {
        status: "idle",
        documentId: undefined,
        fileName: undefined,
        error: undefined,
      });
    } catch (err: any) {
      updateRow(row.rowId, {
        status: "error",
        error: err.response?.data?.error || "Failed to delete",
      });
    }
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        rowId: `row-${crypto.randomUUID()}`,
        doc_type: DEFAULT_DOC_TYPES[0],
        status: "idle",
      },
    ]);
  };

  const removeEmptyRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const changeDocType = (rowId: string, value: string) => {
    updateRow(rowId, { doc_type: value });
  };

  const handleNext = () => {
    if (uploadedCount === 0) {
      setError("Upload at least one document before continuing.");
      return;
    }
    navigate(`/applications/${id}/preview`);
  };

  const uploadedCount = rows.filter((r) => r.status === "uploaded").length;

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
                <h3 className="page-title">Application Documents</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/new-application">New Application</Link>
                  </li>
                  <li className="breadcrumb-item active">Documents</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">
                    {applicantName} — {application?.reference}
                  </h5>
                  <p className="card-text mb-0">
                    Upload each required document. Files upload immediately.
                  </p>
                </div>
                <div className="card-body custom-edit-service">
                  {error && <div className="alert alert-danger">{error}</div>}

                  {rows.map((row, idx) => (
                    <div
                      className="service-fields mb-3 pb-3"
                      style={{
                        borderBottom:
                          idx < rows.length - 1 ? "1px solid #eee" : "none",
                      }}
                      key={row.rowId}
                    >
                      <div className="row align-items-end">
                        <div className="col-lg-4">
                          <div className="form-group mb-0">
                            <label>
                              {idx + 1}. Document Type
                            </label>
                            <select
                              className="form-select"
                              value={row.doc_type}
                              onChange={(e) =>
                                changeDocType(row.rowId, e.target.value)
                              }
                              disabled={row.status === "uploaded"}
                            >
                              {DEFAULT_DOC_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="col-lg-5">
                          <div className="form-group mb-0">
                            <label>File</label>
                            {row.status === "uploaded" ? (
                              <input
                                className="form-control"
                                type="text"
                                value={row.fileName || ""}
                                readOnly
                              />
                            ) : (
                              <input
                                className="form-control"
                                type="file"
                                onChange={(e) => handleFileChange(row, e)}
                                disabled={row.status === "uploading"}
                              />
                            )}
                          </div>
                        </div>

                        <div className="col-lg-3">
                          <div className="d-flex align-items-center gap-2">
                            {row.status === "idle" && (
                              <span className="badge bg-secondary">
                                No file
                              </span>
                            )}
                            {row.status === "uploading" && (
                              <span className="badge bg-info">
                                Uploading…
                              </span>
                            )}
                            {row.status === "uploaded" && (
                              <span className="badge bg-success">
                                ✓ Uploaded
                              </span>
                            )}
                            {row.status === "error" && (
                              <span
                                className="badge bg-danger"
                                title={row.error}
                              >
                                Error
                              </span>
                            )}

                            {row.status === "uploaded" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(row)}
                              >
                                Remove
                              </button>
                            )}

                            {row.status === "idle" &&
                              idx >= DEFAULT_DOC_TYPES.length && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => removeEmptyRow(row.rowId)}
                                >
                                  Remove
                                </button>
                              )}
                          </div>
                          {row.error && (
                            <div className="text-danger small mt-1">
                              {row.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={addRow}
                    >
                      + Add another document
                    </button>
                  </div>

                  <div className="submit-section mt-4">
                    <button
                      type="button"
                      className="btn btn-primary submit-btn"
                      onClick={handleNext}
                      disabled={uploadedCount === 0 || nextBusy}
                    >
                      Next
                    </button>
                    <span className="ms-3 text-muted">
                      {uploadedCount} of {rows.length} uploaded
                    </span>
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

export default ApplicationDocuments;
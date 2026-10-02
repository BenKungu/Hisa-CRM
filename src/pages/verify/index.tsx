import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../services/api";

interface PublicDoc {
  id: string;
  doc_type: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  url: string;
}

interface PublicApplication {
  reference: string;
  applicant_name: string;
  applicant_id_no: string;
  product_type: string | null;
  premium_amount: string | number | null;
  premium_frequency: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  documents: PublicDoc[];
}

const formatBytes = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

const VerifyPage = () => {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [application, setApplication] = useState<PublicApplication | null>(
    null
  );

  useEffect(() => {
    if (!token) return;
    apiClient
      .get(`/public/applications/verify/${token}`)
      .then((res) => {
        setApplication(res.data.data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error || "Application not found or link invalid"
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          fontFamily: "Arial, sans-serif",
          color: "#666",
        }}
      >
        Loading…
      </div>
    );
  }

  if (error || !application) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          fontFamily: "Arial, sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderTop: "3px solid #c70e2a",
            maxWidth: "500px",
            width: "100%",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: "12px",
            }}
          >
            Hisa Insurance CRM
          </div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#1a1a1a",
              margin: "0 0 12px 0",
            }}
          >
            Link Not Found
          </h2>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            {error || "This verification link is invalid or has been revoked."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e5e5e5",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "30px 40px",
            borderBottom: "3px solid #2a9d36",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: "6px",
            }}
          >
            Hisa Insurance CRM
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#1a1a1a",
            }}
          >
            Policy Application
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#666",
              marginTop: "4px",
            }}
          >
            Reference:{" "}
            <span style={{ color: "#2a9d36", fontWeight: "600" }}>
              {application.reference}
            </span>
          </div>
        </div>

        {/* Applicant + Application summary */}
        <div style={{ padding: "30px 40px 10px 40px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #e5e5e5",
                    fontSize: "13px",
                    color: "#999",
                    width: "40%",
                  }}
                >
                  Applicant Name
                </td>
                <td
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #e5e5e5",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    fontWeight: "600",
                    textAlign: "right",
                  }}
                >
                  {application.applicant_name}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #e5e5e5",
                    fontSize: "13px",
                    color: "#999",
                  }}
                >
                  ID Number
                </td>
                <td
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #e5e5e5",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    textAlign: "right",
                  }}
                >
                  {application.applicant_id_no}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #e5e5e5",
                    fontSize: "13px",
                    color: "#999",
                  }}
                >
                  Policy Type
                </td>
                <td
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #e5e5e5",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    textAlign: "right",
                  }}
                >
                  {application.product_type || "—"}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #e5e5e5",
                    fontSize: "13px",
                    color: "#999",
                  }}
                >
                  Submitted
                </td>
                <td
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #e5e5e5",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    textAlign: "right",
                  }}
                >
                  {formatDate(application.submitted_at)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Documents */}
        <div style={{ padding: "30px 40px 10px 40px" }}>
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: "12px",
            }}
          >
            Documents ({application.documents.length})
          </div>

          {application.documents.length === 0 && (
            <p style={{ fontSize: "13px", color: "#888" }}>
              No documents available.
            </p>
          )}

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              {application.documents.map((doc) => (
                <tr key={doc.id}>
                  <td
                    style={{
                      padding: "14px 0",
                      borderBottom: "1px solid #e5e5e5",
                      fontSize: "14px",
                      color: "#1a1a1a",
                    }}
                  >
                    <div style={{ fontWeight: "600" }}>{doc.doc_type}</div>
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
                  </td>
                  <td
                    style={{
                      padding: "14px 0",
                      borderBottom: "1px solid #e5e5e5",
                      textAlign: "right",
                    }}
                  >
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#2a9d36",
                        textDecoration: "none",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      Download &rarr;
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notice */}
        <div style={{ padding: "20px 40px 0 40px" }}>
          <div
            style={{
              borderLeft: "3px solid #F15A29",
              background: "#fafafa",
              padding: "14px 18px",
              fontSize: "12px",
              color: "#666",
              lineHeight: 1.5,
            }}
          >
            Download links are generated fresh on each visit and remain valid
            for <strong style={{ color: "#1a1a1a" }}>1 hour</strong>. Refresh
            the page if they expire.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "30px 40px",
            textAlign: "center",
            fontSize: "11px",
            color: "#999",
            borderTop: "1px solid #e5e5e5",
            marginTop: "20px",
          }}
        >
          © {new Date().getFullYear()} Hisa Insurance CRM. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
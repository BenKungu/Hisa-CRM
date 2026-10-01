import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SidebarNav from "../sidebar";
import Header from "../header";
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

const ApplicationsList = () => {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter && statusFilter !== "all")
      params.append("status", statusFilter);

    apiClient
      .get(`/applications?${params.toString()}`)
      .then((res) => setApplications(res.data.data || []))
      .catch((err) =>
        setError(err.response?.data?.error || "Failed to load applications")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-GB") : "—";

  const formatMoney = (v: string | number | null) => {
    if (v === null || v === undefined || v === "") return "—";
    const n = Number(v);
    if (isNaN(n)) return "—";
    return n.toLocaleString("en-KE");
  };

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col-sm-6">
                <h3 className="page-title">Applications</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Applications</li>
                </ul>
              </div>
              <div className="col-sm-6 text-end">
                <Link to="/new-application" className="btn btn-primary">
                  + New Application
                </Link>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <form onSubmit={handleSearch} className="row g-2 mb-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search reference, applicant, ID, agent…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <button type="submit" className="btn btn-primary w-100">
                        Search
                      </button>
                    </div>
                  </form>

                  {error && (
                    <div className="alert alert-danger">{error}</div>
                  )}

                  {loading ? (
                    <p>Loading…</p>
                  ) : applications.length === 0 ? (
                    <p className="text-muted">No applications found.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead>
                          <tr>
                            <th>Reference</th>
                            <th>Applicant</th>
                            <th>ID No</th>
                            <th>Product</th>
                            <th>Premium</th>
                            <th>Agent</th>
                            <th>Received</th>
                            <th>Docs</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((app) => (
                            <tr key={app.id}>
                              <td>
                                <strong>{app.reference}</strong>
                              </td>
                              <td>{app.applicant_name}</td>
                              <td>{app.applicant_id_no}</td>
                              <td>{app.product_type || "—"}</td>
                              <td>
                                {formatMoney(app.premium_amount)}
                                {app.premium_frequency
                                  ? ` (${app.premium_frequency})`
                                  : ""}
                              </td>
                              <td>
                                {app.agent_name || "—"}
                                {app.agent_code ? ` (${app.agent_code})` : ""}
                              </td>
                              <td>{formatDate(app.date_received)}</td>
                              <td>
                                {app.uploaded_count}/{app.document_count}
                              </td>
                              <td>
                                {app.status === "submitted" ? (
                                  <span className="badge bg-success">
                                    Submitted
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary">
                                    Draft
                                  </span>
                                )}
                              </td>
                              <td>
                                {app.status === "submitted" ? (
                                  <Link
                                    to={`/applications/${app.id}`}
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    View
                                  </Link>
                                ) : (
                                  <Link
                                    to={`/applications/${app.id}/documents`}
                                    className="btn btn-sm btn-outline-secondary"
                                  >
                                    Continue
                                  </Link>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationsList;
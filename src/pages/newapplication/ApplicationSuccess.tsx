import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SidebarNav from "../sidebar";
import Header from "../header";
import apiClient from "../../services/api";

const ApplicationSuccess = () => {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get(`/applications/${id}`)
      .then((res) => setApplication(res.data))
      .catch(() => {});
  }, [id]);

  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="row">
            <div className="col-md-8 offset-md-2">
              <div className="card">
                <div className="card-body text-center py-5">
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "#2a9d36",
                      marginBottom: 20,
                    }}
                  >
                    <i
                      className="fas fa-check"
                      style={{ color: "#fff", fontSize: 40 }}
                    />
                  </div>

                  <h3 className="mb-2">Application Submitted</h3>
                  <p className="text-muted mb-4">
                    The application has been sent to Absa onboarding.
                  </p>

                  {application && (
                    <div className="mb-4">
                      <p className="mb-1">
                        <strong>Reference:</strong> {application.reference}
                      </p>
                      <p className="mb-1">
                        <strong>Applicant:</strong>{" "}
                        {application.applicant_first_name}{" "}
                        {application.applicant_surname}
                      </p>
                      {application.submitted_at && (
                        <p className="mb-1 text-muted small">
                          Submitted on{" "}
                          {new Date(application.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="d-flex justify-content-center gap-2">
                    <Link
                      to="/new-application"
                      className="btn btn-primary"
                    >
                      Start Another Application
                    </Link>
                    <Link
                      to="/admin-dashboard"
                      className="btn btn-outline-secondary"
                    >
                      Back to Dashboard
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

export default ApplicationSuccess;
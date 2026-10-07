import { Link } from "react-router-dom";
import SidebarNav from "../sidebar";
import Header from "../header";
import { FileText } from "react-feather";
import absaLogo from "../../assets/logos/absa-logo.png";
import omLogo from "../../assets/logos/om-logo.png";

const ProviderChooser = () => {
  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">New Application</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">New Application</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12 mb-3">
              <div
                className="card"
                style={{ borderLeft: "4px solid #F15A29", background: "#fff" }}
              >
                <div className="card-body py-3">
                  <div className="d-flex align-items-center">
                    <FileText size={22} style={{ color: "#F15A29", marginRight: "12px" }} />
                    <div>
                      <h6 className="mb-1" style={{ fontWeight: 600 }}>
                        Choose where this application is going
                      </h6>
                      <p className="mb-0" style={{ fontSize: "13px", color: "#666" }}>
                        This determines which document set is required and which onboarding team receives it.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Absa card */}
            <div className="col-md-6 mb-3">
              <Link
                to="/applications/absa/new"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="card h-100"
                  style={{
                    borderTop: "4px solid #c70e2a",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(199,14,42,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="card-body text-center py-5">
                    <div
                      style={{
                        height: 70,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                      }}
                    >
                      <img
                        src={absaLogo}
                        alt="Absa"
                        style={{ maxHeight: 70, maxWidth: 180, objectFit: "contain" }}
                      />
                    </div>
                    <h5
                      style={{
                        color: "#c70e2a",
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      Absa Application
                    </h5>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#666",
                        marginBottom: 0,
                      }}
                    >
                      Onboarding for Absa Life policy applications
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Old Mutual card */}
            <div className="col-md-6 mb-3">
              <Link
                to="/om-applications/new"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="card h-100"
                  style={{
                    borderTop: "4px solid #2a9d36",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(42,157,54,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="card-body text-center py-5">
                    <div
                      style={{
                        height: 70,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                      }}
                    >
                      <img
                        src={omLogo}
                        alt="Old Mutual"
                        style={{ maxHeight: 70, maxWidth: 180, objectFit: "contain" }}
                      />
                    </div>
                    <h5
                      style={{
                        color: "#2a9d36",
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      Old Mutual Application
                    </h5>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#666",
                        marginBottom: 0,
                      }}
                    >
                      Onboarding for Old Mutual applications
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProviderChooser;
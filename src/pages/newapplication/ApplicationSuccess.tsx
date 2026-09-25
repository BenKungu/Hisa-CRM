import { Link } from "react-router-dom";
import SidebarNav from "../sidebar";
import Header from "../header";

const ApplicationSuccess = () => {
  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="card">
            <div className="card-body">
              <h4>Submitted — coming next</h4>
              <Link to="/admin-dashboard">Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationSuccess;
import { Link } from "react-router-dom";
import SidebarNav from "../sidebar";
import Header from "../header";

const ApplicationPreview = () => {
  return (
    <>
      <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="card">
            <div className="card-body">
              <h4>Preview — coming next</h4>
              <p>This page is a placeholder for step 3.</p>
              <Link to="/admin-dashboard">Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationPreview;
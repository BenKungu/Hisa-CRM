import React from "react";
// import DoctorListDesboard from "./DoctorList";
// import PatientsListDesboard from "./PatientsList";
import LineChart from "./LineChart";
import StatusCharts from "./StatusCharts";

const AdminDashboard: React.FC = () => {
  return (
    <>
    
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content container-fluid pb-0">
            <div className="page-header">
              <div className="row">
                <div className="col-sm-12">
                  <h3 className="page-title">Welcome Hisa Admin!</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item active">Dashboard</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xl-3 col-sm-6 col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="dash-widget-header">
                      <span className="dash-widget-icon text-primary border-primary">
                        <i className="fe fe-users"></i>
                      </span>
                      <div className="dash-count">
                        <h3>579</h3>
                      </div>
                    </div>
                    <div className="dash-widget-info">
                      <h6 className="text-muted">Policies</h6>
                      <div className="progress progress-sm">
                        <div className="progress-bar bg-primary w-50" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <>
                <div className="col-xl-3 col-sm-6 col-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="dash-widget-header">
                        <span className="dash-widget-icon text-success">
                          <i className="fe fe-credit-card"></i>
                        </span>
                        <div className="dash-count">
                          <h3>54</h3>
                        </div>
                      </div>
                      <div className="dash-widget-info">
                        <h6 className="text-muted">Education</h6>
                        <div className="progress progress-sm">
                          <div className="progress-bar bg-success w-50" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-sm-6 col-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="dash-widget-header">
                        <span className="dash-widget-icon text-danger border-danger">
                          <i className="fe fe-money"></i>
                        </span>
                        <div className="dash-count">
                          <h3>425</h3>
                        </div>
                      </div>
                      <div className="dash-widget-info">
                        <h6 className="text-muted">Edownment</h6>
                        <div className="progress progress-sm">
                          <div className="progress-bar bg-danger w-50" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-sm-6 col-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="dash-widget-header">
                        <span className="dash-widget-icon text-warning border-warning">
                          <i className="fe fe-folder"></i>
                        </span>
                        <div className="dash-count">
                          <h3>45389000</h3>
                        </div>
                      </div>
                      <div className="dash-widget-info">
                        <h6 className="text-muted">Total Premiums</h6>
                        <div className="progress progress-sm">
                          <div className="progress-bar bg-warning w-50" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            </div>
            <div className="row">
              <div className="col-md-12 col-lg-6">
                {/* Sales Chart */}
                <div className="card card-chart">
                  <div className="card-header">
                    <h4 className="card-title">Revenue</h4>
                  </div>
                  <div className="card-body">
                    {/* <div id="morrisArea" /> */}
                    <LineChart />
                  </div>
                </div>
                {/* /Sales Chart */}
              </div>
              <div className="col-md-12 col-lg-6">
                {/* Invoice Chart */}
                <div className="card card-chart">
                  <div className="card-header">
                    <h4 className="card-title">Status</h4>
                  </div>
                  <div className="card-body">
                    <div id="morrisLine" />
                    {/* <LineChart /> */}
                    {/* <StatusChart /> */}
                    <StatusCharts />
                  </div>
                </div>
                {/* /Invoice Chart */}
              </div>
            </div>

            {/* <div className="row">
              <DoctorListDesboard />
              <PatientsListDesboard />
            </div> */}
          </div>
        </div>
        {/* /Page Wrapper */}
    </>
  );
};

export default AdminDashboard;

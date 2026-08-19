import React from "react";
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
import SidebarNav from "../sidebar";
import {
  specialities_01,
  specialities_02,
  specialities_03,
  specialities_04,
  specialities_05,
} from "../../core/data/json/imagepath";
import { Link } from "react-router-dom";
import Header from "../header";
import { Edit, Trash2 } from "react-feather";

const AdminSpecialities: React.FC = () => {
  const data = [
    {
      id: 1,
      PatientName: "#SP001",
      Specialities: "Urology",
      Description: " ",
      Date: "27 Sep 2019",
      time: "03.40 PM",
      image: specialities_01,
    },
    {
      id: 2,
      PatientName: "#SP002",
      Specialities: "Neurology",
      Description: " ",
      Date: "1 Nov 2019",
      time: "02.59 PM",
      image: specialities_02,
    },
    {
      id: 3,
      PatientName: "#SP003",
      Specialities: "Orthopedic",
      Description: " ",
      Date: "3 Nov 2019",
      time: "09.59 PM",
      image: specialities_03,
    },
    {
      id: 4,
      PatientName: "#SP004",
      Specialities: "Cardiologist",
      Description: " ",
      Date: "16 Jun 2019",
      time: "04.50 PM",
      image: specialities_04,
    },
    {
      id: 5,
      PatientName: "#SP005",
      Specialities: "Dentist",
      Description: " ",
      Date: "22 Aug 2019",
      time: "01.50 PM",
      image: specialities_05,
    },
  ];
  const columns = [
    {
      title: "#",
      dataIndex: "PatientName",
      sorter: (a: any, b: any) => a.PatientName.length - b.PatientName.length,
    },
    {
      title: "Specialities",
      dataIndex: "Specialities",
      render: (text: any, record: any) => (
        <>
          <Link className="avatar mx-2" to="/admin/profile">
            <img src={record.image} />
          </Link>
          <Link to="/admin/profile">{text}</Link>
        </>
      ),
      sorter: (a: any, b: any) => a.Specialities.length - b.Specialities.length,
    },
    {
      title: "Action",
      className: "text-end",
      dataIndex: "",
      render: () => (
        <div className="text-end">
          <Link to="#" className="btn btn-sm bg-success-light me-2">
            <Edit size={16} /> Edit
          </Link>
          <Link to="#" className="btn btn-sm bg-danger-light">
            <Trash2 size={16} /> Delete
          </Link>
        </div>
      ),
      sorter: (a: any, b: any) => a.length - b.length,
    },
  ];

  return (
    <>
    <Header />
      <SidebarNav />
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Page Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-7 col-aut0">
                <h3 className="page-title">Policy Types</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Policy Types</li>
                </ul>
              </div>
              <div className="col-sm-5 col">
                <Link
                  to="#Add_Specialities_details"
                  data-bs-toggle="modal"
                  className="btn btn-primary float-end mt-2"
                >
                  Add
                </Link>
              </div>
            </div>
          </div>
          {/* /Page Header */}
          {/* <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <div className="table-responsive">
                    <Table
                      pagination={{
                        total: data.length,
                        showTotal: (total, range) =>
                          `Showing ${range[0]} to ${range[1]} of ${total} entries`,
                        showSizeChanger: true,
                        onShowSizeChange: onShowSizeChange,
                        itemRender: itemRender,
                      }}
                      style={{ overflowX: "auto" }}
                      columns={columns}
                      dataSource={data}
                      rowKey={(record) => record.id}
                      //  onChange={this.handleTableChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
      <div
        className="modal fade"
        id="edit_specialities_details"
        aria-hidden="true"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Policies</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <form>
                <div className="row form-row">
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>Policy Types</label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="Cardiology"
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>Image</label>
                      <input type="file" className="form-control" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="delete_modal"
        aria-hidden="true"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-body">
              <div className="form-content p-2">
                <h4 className="modal-title">Delete</h4>
                <p className="mb-4">Are you sure want to delete?</p>
                <button type="button" className="btn btn-primary mx-1">
                  Save{" "}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  data-bs-dismiss="modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal fade"
        id="Add_Specialities_details"
        aria-hidden="true"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Policy Types</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <form>
                <div className="row form-row">
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>Policy Types</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group">
                      <label>Image</label>
                      <input type="file" className="form-control" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSpecialities;

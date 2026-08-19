import React from "react";
import { Table } from "antd";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import { itemRender, onShowSizeChange } from "../paginationfunction";
// import SidebarNav from '../sidebar';
import {
  doctor_thumb_01,
  doctor_thumb_02,
  doctor_thumb_03,
  doctor_thumb_04,
  doctor_thumb_05,
  patient1,
  patient2,
  patient3,
  patient4,
  patient5,
} from "../../core/data/json/imagepath";
import { Link } from "react-router-dom";
interface AppointmentData {
  id: number;
  DoctorName: string;
  Speciality: string;
  PatientName: string;
  Earned: string;
  Date: string;
  time: string;
  Amount: string;
  image: string;
  images1: string;
  Status: string;
}

const AppointmentList: React.FC = () => {
  const data: AppointmentData[] = [
    {
      id: 1,
      DoctorName: "Dr. Ruby Perrin",
      Speciality: "Dental ",
      PatientName: "Charlene Reed",
      Earned: "$5000.00 ",
      Date: "27 Sep 2019",
      time: "11.00 AM - 11.15 AM",
      Amount: "$200.00",
      image: doctor_thumb_01,
      images1: patient1,
      Status: "checkbox",
    },
    {
      id: 2,
      DoctorName: "Dr. Darren Elder",
      Speciality: "Dental ",
      PatientName: "Travis Trimble",
      Earned: "$3300.00 ",
      Date: "1 Nov 2019",
      time: "11.00 PM - 11.35 PM",
      Amount: "$300.00",
      image: doctor_thumb_02,
      images1: patient2,
      Status: "checkbox",
    },
    {
      id: 3,
      DoctorName: "Dr. Deborah Angel",
      Speciality: "Cardiology ",
      PatientName: "Carl Kelly",
      Earned: "$4100.00",
      Date: "3 Nov 2019",
      time: "12.00 PM - 12.15 PM",
      Amount: "$150.00",
      image: doctor_thumb_03,
      images1: patient3,
      Status: "checkbox",
    },
    {
      id: 4,
      DoctorName: "Dr. Sofia Brient",
      Speciality: "Urology ",
      PatientName: "Michelle Fairfax",
      Earned: "$4000.00 ",
      Date: "16 Jun 2019",
      time: "1.00 PM - 1.20 PM",
      Amount: "$150.00",
      image: doctor_thumb_04,
      images1: patient4,
      Status: "checkbox",
    },
    {
      id: 5,
      DoctorName: "Dr. Marvin Campbell",
      Speciality: "Orthopaedics ",
      PatientName: "Gina Moore",
      Earned: "$2000.00 ",
      Date: "22 Aug 2019",
      time: "1.00 PM - 1.15 PM",
      Amount: "$200.00",
      image: doctor_thumb_05,
      images1: patient5,
      Status: "checkbox",
    },
  ];
  const columns = [
    {
      title: "Doctor Name",
      dataIndex: "DoctorName",
      render: (text: string, record: AppointmentData) => (
        <>
          <Link className="avatar mx-2" to="/admin/profile">
            <img className="rounded-circle" src={record.image} />
          </Link>
          <Link to="/admin/profile" className="text-decoration-none">
            {text}
          </Link>
        </>
      ),
      sorter: (a: AppointmentData, b: AppointmentData) =>
        a.DoctorName.length - b.DoctorName.length,
    },
    {
      title: "Speciality",
      dataIndex: "Speciality",
      sorter: (a: AppointmentData, b: AppointmentData) =>
        a.Speciality.length - b.Speciality.length,
    },

    {
      title: "Patient Name",
      dataIndex: "PatientName",
      render: (text: string, record: AppointmentData) => (
        <>
          <Link className="avatar mx-2" to="/admin/profile">
            <img className="rounded-circle" src={record.images1} />
          </Link>
          <Link to="/admin/profile">{text}</Link>
        </>
      ),
      sorter: (a: AppointmentData, b: AppointmentData) =>
        a.PatientName.length - b.PatientName.length,
    },

    {
      title: "Appointment Time",
      render: (record: AppointmentData) => (
        <>
          <span className="user-name">{record.Date}</span>
          <br />
          <span className="d-block">{record.time}</span>
        </>
      ),
      sorter: (a: AppointmentData, b: AppointmentData) =>
        a.Date.length - b.time.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: any, record: any) => {
        return (
          <div className="status-toggle">
            <input
              id={`rating${record?.id}`}
              className="check"
              type="checkbox"
              defaultChecked={false}
            />
            <label
              htmlFor={`rating${record?.id}`}
              className="checktoggle checkbox-bg"
            >
              {text}
            </label>
          </div>
        );
      },
      sorter: (a: AppointmentData, b: AppointmentData) =>
        a.Status.length - b.Status.length,
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      sorter: (a: AppointmentData, b: AppointmentData) =>
        a.Amount.length - b.Amount.length,
    },
  ];
  return (
    <>
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Page Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Appointments</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="index.html">Dashboard</a>
                  </li>
                  <li className="breadcrumb-item active">Appointments</li>
                </ul>
              </div>
            </div>
          </div>
          {/* /Page Header */}
          <div className="row">
            <div className="col-md-12">
              {/* Recent Orders */}
              <div className="card card-table">
                <div className="card-header">
                  <h4 className="card-title">Appointment List</h4>
                </div>
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
              {/* /Recent Orders */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default AppointmentList;

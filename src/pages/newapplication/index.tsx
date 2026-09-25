import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SidebarNav from "../sidebar";
import Header from "../header";
import apiClient from "../../services/api";

const NewApplication = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agents, setAgents] = useState<{ agent_code: string; agent_name: string }[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);

  useEffect(() => {
    apiClient
      .get("/policies/agents")
      .then((res) => {
        const list = (res.data?.data || []).filter(
          (a: any) => a.agent_code && a.agent_name
        );
        setAgents(list);
      })
      .catch(() => setAgents([]));

    apiClient
      .get("/policies")
      .then((res) => {
        const types = new Set<string>();
        (res.data?.data || []).forEach((p: any) => {
          if (p.product_type) types.add(p.product_type);
        });
        setProductTypes(Array.from(types).sort());
      })
      .catch(() => setProductTypes([]));
  }, []);

  const [form, setForm] = useState({
    agent_name: "",
    agent_code: "",
    first_name: "",
    surname: "",
    id_no: "",
    date_received: "",
    product_type: "",
    premium_frequency: "",
    direct_debit_date: "",
    premium_amount: "",
    notes: "",
  });

  const handle = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await apiClient.post("/applications", form);
      navigate(`/applications/${res.data.id}/documents`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create application");
      setSaving(false);
    }
  };

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
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body custom-edit-service">
                  {error && <div className="alert alert-danger">{error}</div>}

                  <form autoComplete="off" onSubmit={handleSubmit}>
                    {/* Agent */}
                    <div className="service-fields mb-3">
                      <div className="row">
                                                <div className="col-lg-6">
                          <div className="form-group">
                            <label>
                              Select Agent <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={form.agent_code}
                              onChange={(e) => {
                                const selected = agents.find(
                                  (a) => a.agent_code === e.target.value
                                );
                                setForm((prev) => ({
                                  ...prev,
                                  agent_code: e.target.value,
                                  agent_name: selected?.agent_name || "",
                                }));
                              }}
                              required
                            >
                              <option value="">-- Select Agent --</option>
                              {agents.map((a) => (
                                <option key={a.agent_code} value={a.agent_code}>
                                  {a.agent_name} ({a.agent_code})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="form-group">
                            <label>Agent Code</label>
                            <input
                              className="form-control"
                              type="text"
                              value={form.agent_code}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Client */}
                    <div className="service-fields mb-3">
                      <div className="row">
                        <div className="col-lg-4">
                          <div className="form-group">
                            <label>
                              Client First Name <span className="text-danger">*</span>
                            </label>
                            <input
                              className="form-control"
                              type="text"
                              value={form.first_name}
                              onChange={(e) => handle("first_name", e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="form-group">
                            <label>
                              Client Surname <span className="text-danger">*</span>
                            </label>
                            <input
                              className="form-control"
                              type="text"
                              value={form.surname}
                              onChange={(e) => handle("surname", e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="form-group">
                            <label>
                              Client ID Number <span className="text-danger">*</span>
                            </label>
                            <input
                              className="form-control"
                              type="text"
                              value={form.id_no}
                              onChange={(e) => handle("id_no", e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="service-fields mb-3">
                      <div className="row">
                        <div className="col-lg-6">
                          <div className="form-group">
                            <label>
                              Date Received <span className="text-danger">*</span>
                            </label>
                            <input
                              className="form-control"
                              type="date"
                              value={form.date_received}
                              onChange={(e) => handle("date_received", e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="form-group">
                            <label>Direct Debit Date</label>
                            <input
                              className="form-control"
                              type="date"
                              value={form.direct_debit_date}
                              onChange={(e) => handle("direct_debit_date", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Policy */}
                    <div className="service-fields mb-3">
                      <div className="row">
                        <div className="col-lg-6">
                          <div className="form-group">
                                                        <label>
                              Policy Type <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={form.product_type}
                              onChange={(e) => handle("product_type", e.target.value)}
                              required
                            >
                              <option value="">-- Select Policy Type --</option>
                              {productTypes.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="form-group">
                            <label>
                              Frequency <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={form.premium_frequency}
                              onChange={(e) => handle("premium_frequency", e.target.value)}
                              required
                            >
                              <option value="">-- Select --</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Quarterly">Quarterly</option>
                              <option value="Semi-Annual">Semi-Annual</option>
                              <option value="Annual">Annual</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Premium */}
                    <div className="service-fields mb-3">
                      <div className="row">
                        <div className="col-lg-6">
                          <div className="form-group">
                            <label>
                              Premium Amount <span className="text-danger">*</span>
                            </label>
                            <input
                              className="form-control"
                              type="number"
                              step="0.01"
                              value={form.premium_amount}
                              onChange={(e) => handle("premium_amount", e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="service-fields mb-3">
                      <div className="row">
                        <div className="col-lg-12">
                          <div className="form-group">
                            <label>Notes</label>
                            <textarea
                              className="form-control service-desc"
                              rows={3}
                              value={form.notes}
                              onChange={(e) => handle("notes", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="submit-section">
                      <button
                        className="btn btn-primary submit-btn"
                        type="submit"
                        disabled={saving}
                      >
                        {saving ? "Creating..." : "Next"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewApplication;


// import SidebarNav from "../sidebar";
// import { Link } from "react-router-dom";
// import Header from "../header";

// const NewApplication = () => {
//   return (
//     <>
//       <Header />
//       <SidebarNav />
//       <>
//         {/* Page Wrapper */}
//         <div className="page-wrapper">
//           <div className="content container-fluid">
//             {/* Page Header */}
//             <div className="page-header">
//               <div className="row">
//                 <div className="col-sm-12">
//                   <h3 className="page-title">New Application</h3>
//                   <ul className="breadcrumb">
//                     <li className="breadcrumb-item">
//                       <Link to="/pharmacyadmin">Dashboard</Link>
//                     </li>
//                     <li className="breadcrumb-item active">New Application</li>
//                   </ul>
//                 </div>
//               </div>
//             </div>
//             {/* /Page Header */}
//             <div className="row">
//               <div className="col-sm-12">
//                 <div className="card">
//                   <div className="card-body custom-edit-service">
//                     {/* Add Medicine */}
//                     <form
//                       autoComplete="off"
//                       id="update_service"
//                     >
//                       <input
//                         type="hidden"
//                         name="csrf_token_name"
//                         defaultValue="0146f123a4c7ae94253b39bca6bd5a5e"
//                       />
//                       <div className="service-fields mb-3">
//                         <div className="row">
//                           <div className="col-lg-6">
//                             <div className="form-group">
//                               <label>
//                                 Name<span className="text-danger">*</span>
//                               </label>
//                               <input
//                                 type="hidden"
//                                 name="name"
//                                 id="name"
//                                 defaultValue={18}
//                               />
//                               <input
//                                 className="form-control"
//                                 type="text"
//                                 name="name"
//                                 id="name"
//                                 defaultValue=""
//                                 required
//                               />
//                             </div>
//                           </div>
//                           <div className="col-lg-6">
//                             <label>
//                               Email<span className="text-danger">*</span>
//                             </label>
//                             <input
//                               type="hidden"
//                               name="email"
//                               id="email"
//                               defaultValue={18}
//                             />
//                             <input
//                               className="form-control"
//                               type="text"
//                               name="email"
//                               id="email"
//                               defaultValue=""
//                               required
//                             />
//                           </div>
//                         </div>
//                       </div>
//                       <div className="service-fields mb-3">
//                         <div className="row">
//                           <div className="col-lg-6">
//                             <div className="form-group">
//                               <label>
//                                 Phone<span className="text-danger">*</span>
//                               </label>
//                               <input
//                                 type="hidden"
//                                 name="phone"
//                                 id="phone"
//                                 defaultValue={18}
//                               />
//                               <input
//                                 className="form-control"
//                                 type="text"
//                                 name="phone"
//                                 id="phone"
//                                 defaultValue=""
//                                 required
//                               />
//                             </div>
//                           </div>
//                           <div className="col-lg-6">
//                             <label>
//                               Company<span className="text-danger">*</span>
//                             </label>
//                             <input
//                               type="hidden"
//                               name="company"
//                               id="company"
//                               defaultValue={18}
//                             />
//                             <input
//                               className="form-control"
//                               type="text"
//                               name="company"
//                               id="company"
//                               defaultValue=""
//                               required
//                             />
//                           </div>
//                         </div>
//                       </div>
//                       <div className="service-fields mb-3">
//                         <div className="row">
//                           <div className="col-lg-12">
//                             <div className="form-group">
//                               <label>
//                                 Address <span className="text-danger">*</span>
//                               </label>
//                               <textarea
//                                 id="address"
//                                 className="form-control service-desc"
//                                 name="address"
//                                 defaultValue={""}
//                               />
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="service-fields mb-3">
//                         <div className="row">
//                           <div className="col-lg-12">
//                             <div className="service-upload">
//                               <i className="fas fa-cloud-upload-alt" />
//                               <span>Upload Supplier Image *</span>
//                               <input
//                                 type="file"
//                                 name="images[]"
//                                 id="images"
//                                 multiple
//                                 accept="image/jpeg, image/png, image/gif,"
//                               />
//                             </div>
//                             <div id="uploadPreview">
//                               <ul className="upload-wrap">
//                                 <li>
//                                   <div className=" upload-images">
//                                   </div>
//                                 </li>
//                               </ul>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="submit-section">
//                         <button
//                           className="btn btn-primary submit-btn"
//                           type="submit"
//                           name="form_submit"
//                           value="submit"
//                         >
//                           Submit
//                         </button>
//                       </div>
//                     </form>
//                     {/* /Add Medicine */}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//         {/* /Page Wrapper */}
//         {/* /Main Wrapper */}
//       </>
//     </>
//   );
// };

// export default NewApplication;

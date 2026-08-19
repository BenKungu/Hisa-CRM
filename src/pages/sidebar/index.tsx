import { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { Appcontext } from "../context/AppContext";
import { useLocation } from "react-router-dom";
import { 
  Home, 
  Layout, 
  Users, 
  UserPlus, 
  User, 
  FileText, 
} from "react-feather";
import { all_routes } from "../../routes/all_routes";

const SidebarNav = () => {

  const location = useLocation();
  const pathname = location.pathname;

  const { setIsAuth } = useContext(Appcontext);
  const [, setSideMenu] = useState("");

  const [isSidebarExpanded, _setSidebarExpanded] = useState(false);
  const [isMouseOverSidebar, setMouseOverSidebar] = useState(false);

  // Auto-expand submenus based on current pathname
  useEffect(() => {
    // Auto-expand Reports submenu if on invoice report page
    if (pathname?.includes("invoicerepot")) {
      setSideMenu("reports");
    }
    // Auto-expand Error Pages submenu if on error pages
    if (pathname?.includes("404") || pathname?.includes("500")) {
      setSideMenu("errorpages");
    }
    // Auto-expand Forms submenu if on form pages
    if (pathname?.includes("basic-input") || pathname?.includes("form-input-group") || pathname?.includes("form-horizontal") || pathname?.includes("form-vertical") || pathname?.includes("form-mask") || pathname?.includes("form-validation")) {
      setSideMenu("forms");
    }
    // Auto-expand Tables submenu if on table pages
    if (pathname?.includes("tables-basic") || pathname?.includes("data-tables")) {
      setSideMenu("tables");
    }
    // Auto-expand Multi Level submenu if on multilevel pages
    if (pathname?.includes("multilevel")) {
      setSideMenu("multilevel");
    }
  }, [pathname]);

  useEffect(() => {
    if (
      isMouseOverSidebar &&
      document.body.classList.contains("mini-sidebar")
    ) {
      document.body.classList.add("expand-menu");
      return;
    }
    document.body.classList.remove("expand-menu");
  }, [isMouseOverSidebar]);

  const HandleMouseEnter = () => {
    setMouseOverSidebar(true);
  };

  const HandleMouseLeave = () => {
    setMouseOverSidebar(false);
  };

  return (
    <>
      {/* <!-- Sidebar --> */}
      <div
        className={`sidebar ${isSidebarExpanded ? "" : "hidden"}`}
        id="sidebar"
        onMouseEnter={HandleMouseEnter}
        onMouseLeave={HandleMouseLeave}
      >
        <OverlayScrollbarsComponent
          options={{
            scrollbars: {
              autoHide: "scroll",
              autoHideDelay: 1000,
              theme: "os-theme-dark"
            },
            overflow: {
              x: "hidden",
              y: "scroll"
            }
          }}
          style={{ height: "95vh" }}
        >
          <div className="sidebar-inner slimscroll">
            <div id="sidebar-menu" className="sidebar-menu">
              <ul>
                <li className="menu-title">
                  <span>Main</span>
                </li>
                <li className={pathname === all_routes.adminDashboard ? "active" : ""}>
                  <Link to="/admin-dashboard">
                    <Home size={16} />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li
                  className={
                    pathname?.includes("/appointment-list")
                      ? "active"
                      : ""
                  }
                >
                  <Link to="/businesses">
                    <Layout size={16} /> <span>Businesses</span>
                  </Link>
                </li>
                <li
                  className={pathname?.includes("specialities") ? "active" : ""}
                >
                  <Link to="/policies">
                    <Users size={16} /> <span>Policy Types</span>
                  </Link>
                </li>
                <li
                  className={pathname?.includes("doctor-list") ? "active" : ""}
                >
                  <Link to="/agents">
                    <UserPlus size={16} />
                    <span>Agents</span>
                  </Link>
                </li>
                <li
                  className={pathname?.includes("patient-list") ? "active" : ""}
                >
                  <Link to="/clients">
                    <User size={16} /> <span>Clients</span>
                  </Link>
                </li>
                
                {/* Profile - moved here, independent */}
                <li className={pathname?.includes("profile") ? "active" : ""}>
                  <Link to="/profile">
                    <UserPlus size={16} /> <span>Profile</span>
                  </Link>
                </li>
                
                {/* Login - independent */}
                <li className={pathname?.includes("login") ? "active" : ""}>
                  <Link to="/login" onClick={() => setIsAuth("admin")}>
                    <FileText size={16} /> <span>Login</span>
                  </Link>
                </li>
                
                {/* Register - independent */}
                <li className={pathname?.includes("register") ? "active" : ""}>
                  <Link to="/register" onClick={() => setIsAuth("admin")}>
                    <FileText size={16} /> <span>Register</span>
                  </Link>
                </li>
                
                {/* Forgot Password - independent */}
                <li className={pathname?.includes("forgotpassword") ? "active" : ""}>
                  <Link to="/forgotpassword" onClick={() => setIsAuth("admin")}>
                    <FileText size={16} /> <span>Forgot Password</span>
                  </Link>
                </li>
                
                {/* Lock Screen - independent */}
                <li className={pathname?.includes("lockscreen") ? "active" : ""}>
                  <Link to="/lockscreen" onClick={() => setIsAuth("admin")}>
                    <FileText size={16} /> <span>Lock Screen</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </OverlayScrollbarsComponent>
      </div>
      {/* <!-- /Sidebar --> */}
    </>
  );
};

export default SidebarNav;


// import { useState, useContext, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
// import "overlayscrollbars/overlayscrollbars.css";
// import { Appcontext } from "../context/AppContext";
// import { useLocation } from "react-router-dom";
// import { 
//   Home, 
//   Layout, 
//   Users, 
//   UserPlus, 
//   User, 
//   FileText, 
// } from "react-feather";
// import { all_routes } from "../../routes/all_routes";

// const SidebarNav = () => {

//   const location = useLocation();
//   const pathname = location.pathname;

//   const { setIsAuth } = useContext(Appcontext);
//   const [isSideMenu, setSideMenu] = useState("");

//   const toggleSidebar = (value: any) => {
//     setSideMenu(value);
//   };
//   const [isSidebarExpanded, _setSidebarExpanded] = useState(false);
//   const [isMouseOverSidebar, setMouseOverSidebar] = useState(false);

//   // Auto-expand submenus based on current pathname
//   useEffect(() => {
//     // Auto-expand Reports submenu if on invoice report page
//     if (pathname?.includes("invoicerepot")) {
//       setSideMenu("reports");
//     }
//     // Auto-expand Authentication submenu if on auth pages
//     if (pathname?.includes("login") || pathname?.includes("register") || pathname?.includes("forgotpassword") || pathname?.includes("lockscreen")) {
//       setSideMenu("authentication");
//     }
//     // Auto-expand Error Pages submenu if on error pages
//     if (pathname?.includes("404") || pathname?.includes("500")) {
//       setSideMenu("errorpages");
//     }
//     // Auto-expand Forms submenu if on form pages
//     if (pathname?.includes("basic-input") || pathname?.includes("form-input-group") || pathname?.includes("form-horizontal") || pathname?.includes("form-vertical") || pathname?.includes("form-mask") || pathname?.includes("form-validation")) {
//       setSideMenu("forms");
//     }
//     // Auto-expand Tables submenu if on table pages
//     if (pathname?.includes("tables-basic") || pathname?.includes("data-tables")) {
//       setSideMenu("tables");
//     }
//     // Auto-expand Multi Level submenu if on multilevel pages
//     if (pathname?.includes("multilevel")) {
//       setSideMenu("multilevel");
//     }
//   }, [pathname]);

//   useEffect(() => {
//     if (
//       isMouseOverSidebar &&
//       document.body.classList.contains("mini-sidebar")
//     ) {
//       document.body.classList.add("expand-menu");
//       return;
//     }
//     document.body.classList.remove("expand-menu");
//   }, [isMouseOverSidebar]);

//   const HandleMouseEnter = () => {
//     setMouseOverSidebar(true);
//   };

//   const HandleMouseLeave = () => {
//     setMouseOverSidebar(false);
//   };

//   return (
//     <>
//       {/* <!-- Sidebar --> */}
//       <div
//         className={`sidebar ${isSidebarExpanded ? "" : "hidden"}`}
//         id="sidebar"
//         onMouseEnter={HandleMouseEnter}
//         onMouseLeave={HandleMouseLeave}
//       >
//         <OverlayScrollbarsComponent
//           options={{
//             scrollbars: {
//               autoHide: "scroll",
//               autoHideDelay: 1000,
//               theme: "os-theme-dark"
//             },
//             overflow: {
//               x: "hidden",
//               y: "scroll"
//             }
//           }}
//           style={{ height: "95vh" }}
//         >
//           <div className="sidebar-inner slimscroll">
//             <div id="sidebar-menu" className="sidebar-menu">
//               <ul>
//                 <li className="menu-title">
//                   <span>Main</span>
//                 </li>
//                 <li className={pathname === all_routes.adminDashboard ? "active" : ""}>
//                   <Link to="/admin-dashboard">
//                     <Home size={16} />
//                     <span>Dashboard</span>
//                   </Link>
//                 </li>
//                 <li
//                   className={
//                     pathname?.includes("/appointment-list")
//                       ? "active"
//                       : ""
//                   }
//                 >
//                   <Link to="/appointment-list">
//                     <Layout size={16} /> <span>Businesses</span>
//                   </Link>
//                 </li>
//                 <li
//                   className={pathname?.includes("specialities") ? "active" : ""}
//                 >
//                   <Link to="/specialities">
//                     <Users size={16} /> <span>Policies</span>
//                   </Link>
//                 </li>
//                 <li
//                   className={pathname?.includes("doctor-list") ? "active" : ""}
//                 >
//                   <Link to="/doctor-list">
//                     <UserPlus size={16} />
//                     <span>Agents</span>
//                   </Link>
//                 </li>
//                 <li
//                   className={pathname?.includes("patient-list") ? "active" : ""}
//                 >
//                   <Link to="/patient-list">
//                     <User size={16} /> <span>Clients</span>
//                   </Link>
//                 </li>
//                 <li className="menu-title">
//                   <span>Pages</span>
//                 </li>
//                 <li className={pathname?.includes("profile") ? "active" : ""}>
//                   <Link to="/profile">
//                     <UserPlus size={16} /> <span>Profile</span>
//                   </Link>
//                 </li>
//                 <li className="submenu">
//                   <Link
//                     to="#"
//                     className={isSideMenu == "authentication" ? "subdrop" : ""}
//                     onClick={() =>
//                       toggleSidebar(
//                         isSideMenu == "authentication" ? "" : "authentication"
//                       )
//                     }
//                   >
//                     <FileText size={16} />{" "}
//                     <span> Authentication </span>{" "}
//                     <span className="menu-arrow"></span>
//                   </Link>
//                   <ul
//                     style={{
//                       display:
//                         isSideMenu == "authentication" ? "block" : "none",
//                     }}
//                   >
//                     <li>
//                       <Link
//                         to="/login"
//                         className={pathname?.includes("login") ? "active" : ""}
//                         onClick={() => setIsAuth("admin")}
//                       >
//                         {" "}
//                         Login{" "}
//                       </Link>
//                     </li>
//                     <li>
//                       <Link
//                         to="/register"
//                         className={
//                           pathname?.includes("register") ? "active" : ""
//                         }
//                         onClick={() => setIsAuth("admin")}
//                       >
//                         {" "}
//                         Register{" "}
//                       </Link>
//                     </li>
//                     <li>
//                       <Link
//                         to="/forgotpassword"
//                         className={
//                           pathname?.includes("forgotpassword") ? "active" : ""
//                         }
//                         onClick={() => setIsAuth("admin")}
//                       >
//                         {" "}
//                         Forgot Password{" "}
//                       </Link>
//                     </li>
//                     <li>
//                       <Link
//                         to="/lockscreen"
//                         className={
//                           pathname?.includes("lockscreen") ? "active" : ""
//                         }
//                         onClick={() => setIsAuth("admin")}
//                       >
//                         {" "}
//                         Lock Screen{" "}
//                       </Link>
//                     </li>
//                   </ul>
//                 </li>
//               </ul>
//             </div>
//           </div>
//         </OverlayScrollbarsComponent>
//       </div>
//       {/* <!-- /Sidebar --> */}
//     </>
//   );
// };

// export default SidebarNav;

import { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { Appcontext } from "../context/AppContext";
import { useLocation } from "react-router-dom";
import { 
  Home,           
  Briefcase,
  FileText,         
  UserPlus,       
  Users,         
  UserCheck,     
  Lock, 
  CheckCircle,        
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
    if (pathname?.includes("invoicerepot")) {
      setSideMenu("reports");
    }
    if (pathname?.includes("404") || pathname?.includes("500")) {
      setSideMenu("errorpages");
    }
    if (pathname?.includes("basic-input") || pathname?.includes("form-input-group") || pathname?.includes("form-horizontal") || pathname?.includes("form-vertical") || pathname?.includes("form-mask") || pathname?.includes("form-validation")) {
      setSideMenu("forms");
    }
    if (pathname?.includes("tables-basic") || pathname?.includes("data-tables")) {
      setSideMenu("tables");
    }
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
                <li className={pathname?.includes("clients") ? "active" : ""}>
                  <Link to="/clients">
                    <Users size={16} /> <span>Clients</span>
                  </Link>
                </li>
                <li className={pathname?.includes("/businesses") ? "active" : ""}>
                  <Link to="/businesses">
                    <Briefcase size={16} /> <span>Businesses</span>
                  </Link>
                </li>
                <li className={pathname?.includes("agents") ? "active" : ""}>
                  <Link to="/agents">
                    <UserPlus size={16} />
                    <span>Agents</span>
                  </Link>
                </li>
                <li className={pathname?.includes("policies") ? "active" : ""}>
                  <Link to="/policies">
                    <FileText size={16} /> <span>Policy Types</span>
                  </Link>
                </li>
                <li className={pathname?.includes("whitelist") ? "active" : ""}>
                  <Link to="/whitelist">
                    <CheckCircle size={16} /> <span>Whitelist</span>
                  </Link>
                </li>
                <li className={pathname?.includes("profile") ? "active" : ""}>
                  <Link to="/profile">
                    <UserCheck size={16} /> <span>Profile</span>
                  </Link>
                </li>
                <li className={pathname?.includes("lockscreen") ? "active" : ""}>
                  <Link to="/lockscreen" onClick={() => setIsAuth("admin")}>
                    <Lock size={16} /> <span>Lock Screen</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </>
  );
};

export default SidebarNav;


import { Link, Outlet, useLocation } from "react-router";
import { useAppDispatch, useAppSelector } from "../hooks/useReduxHooks";
import { useEffect, useRef, useState } from "react";
import {
  resetMobileSidebar,
  setMobileSidebar,
} from "../core/redux/sidebarSlice";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useBootstrapTooltips } from "../hooks/useBootstrapTooltips";
import { useMobileSidebarOverlay } from "../hooks/useMobileSidebarOverlay";
import type { RootState } from "../core/redux/store";
import type { SidebarState } from "../core/redux/sidebarSlice";
import Header from "../pages/header";
import SidebarNav from "../pages/sidebar";

const MainLayout = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Update HTML class when theme changes
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add("dark-mode");
      html.classList.remove("light-mode");
    } else {
      html.classList.add("light-mode");
      html.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  const { mobileSidebar } = useAppSelector(
    (state: RootState) => state.sidebar as SidebarState
  );

  // Ref for the main wrapper to detect clicks outside sidebar
  const mainWrapperRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  const isMobile = useIsMobile();

  // Check if current page is layout-fullwidth
  const isLayoutFullwidth = location.pathname === "/layout-fullwidth";

  // Centralized tooltip initialization/cleanup
  useBootstrapTooltips([location.pathname]);

  // Centralized mobile sidebar overlay and outside click/touch handling
  useMobileSidebarOverlay({
    mobileSidebar,
    isLayoutFullwidth,
    isMobile,
    containerRef: mainWrapperRef,
    onClose: () => dispatch(setMobileSidebar(false)),
  });

  useEffect(() => {
    dispatch(resetMobileSidebar());
  }, [location.pathname, dispatch]);

  return (
    <>
      <div className="main-wrapper" ref={mainWrapperRef}>
        <div className="header-theme header-theme-two">
          <Link
            to="#"
            id="dark-mode-toggle"
            className={`theme-toggle moon ${
              isDarkMode ? "active" : "activate"
            }`}
            onClick={toggleTheme}
          >
            <i className="isax isax-moon5" />
          </Link>
          <Link
            to="#"
            id="light-mode-toggle"
            className={`theme-toggle sun ${
              !isDarkMode ? "active" : "activate"
            }`}
            onClick={toggleTheme}
          >
            <i className="isax isax-sun-15" />
          </Link>
        </div>
        <Header />
        <SidebarNav />
        <Outlet />
      </div>
      <div className={`sidebar-overlay${mobileSidebar ? " opened" : ""}`}></div>
    </>
  );
};

export default MainLayout;

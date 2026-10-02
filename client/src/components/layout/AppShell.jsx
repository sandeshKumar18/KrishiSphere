
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Header from "./Header";
import Sidebar from "./Sidebar";

const AppShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen((current) => !current);
  };


  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);


  useEffect(() => {
    const updateSidebarState = () => {
      const isMobile = window.matchMedia(
        "(max-width: 900px)"
      ).matches;

      
      document.body.classList.toggle(
        "sidebar-is-open",
        sidebarOpen && !isMobile
      );

      document.body.style.overflow =
        sidebarOpen && isMobile ? "hidden" : "";
    };

    updateSidebarState();

    const mediaQuery = window.matchMedia(
      "(max-width: 900px)"
    );

    mediaQuery.addEventListener(
      "change",
      updateSidebarState
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        updateSidebarState
      );

      document.body.classList.remove(
        "sidebar-is-open"
      );

      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

   useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  return (
    <div className="app-shell">

      <Header
        onMenuClick={toggleSidebar}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <main className="app-main">
        <div className="page-container">
          {children}
        </div>
      </main>

    </div>
  );
};

export default AppShell;

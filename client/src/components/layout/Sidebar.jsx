import { NavLink } from "react-router-dom";

import {
  BarChart3,
  Landmark,
  Leaf,
  Settings,
  ShoppingBag,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";

import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose }) => {
  const navigation = [
    {
      label: "Overview",
      path: "/",
      icon: BarChart3,
    },
    {
      label: "My Fields",
      path: "/fields",
      icon: Leaf,
    },
    {
      label: "Crop Cycles",
      path: "/crop-cycles",
      icon: Sprout,
    },
    {
      label: "Market",
      path: "/market",
      icon: ShoppingBag,
    },
    {
      label: "AI Advice",
      path: "/ai-advice",
      icon: Sparkles,
    },
    {
      label: "Government Schemes",
      path: "/government-schemes",
      icon: Landmark,
    },
    {
      label: "Crop Catalog",
      path: "/crops",
      icon: Leaf,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`navigation-drawer ${isOpen ? "open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="drawer-header">
        <div className="drawer-brand">
          <div className="drawer-brand-mark">
            <Sprout size={19} />
          </div>

          <div className="drawer-brand-text">
            <span>KrishiSphere</span>
            <small>Farm workspace</small>
          </div>
        </div>

        <button
          type="button"
          className="drawer-close"
          onClick={onClose}
          aria-label="Close navigation"
          title="Close navigation"
        >
          <X size={19} />
        </button>
      </div>

      <nav className="drawer-nav">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `drawer-link ${isActive ? "active" : ""}`
              }
            >
              <span className="drawer-icon">
                <Icon size={19} />
              </span>

              <span className="drawer-link-label">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="drawer-footer">
        <div className="drawer-footer-icon">
          <Sprout size={17} />
        </div>

        <div className="drawer-footer-content">
          <strong>Grow smarter</strong>
          <span>Better field decisions.</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
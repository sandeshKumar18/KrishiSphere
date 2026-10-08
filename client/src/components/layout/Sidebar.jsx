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
import { useTranslation } from "react-i18next";

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigation = [
  {
    key: "overview",
    label: t("nav.overview"),
    path: "/",
    icon: BarChart3,
  },
  {
    key: "fields",
    label: t("nav.myFields"),
    path: "/fields",
    icon: Leaf,
  },
  {
    key: "cropCycles",
    label: t("nav.cropCycles"),
    path: "/crop-cycles",
    icon: Sprout,
  },
  {
    key: "market",
    label: t("nav.market"),
    path: "/market",
    icon: ShoppingBag,
  },
  {
    key: "aiAdvice",
    label: t("nav.aiAdvice"),
    path: "/ai-advice",
    icon: Sparkles,
  },
  {
    key: "governmentSchemes",
    label: t("nav.governmentSchemes"),
    path: "/government-schemes",
    icon: Landmark,
  },
  {
    key: "cropCatalog",
    label: t("nav.cropCatalog"),
    path: "/crops",
    icon: Leaf,
  },
  {
    key: "settings",
    label: t("nav.settings"),
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
            <small>{t("sidebar.workspace")}</small>
          </div>
        </div>

        <button
          type="button"
          className="drawer-close"
          onClick={onClose}
          aria-label={t("sidebar.closeNavigation")}
          title={t("sidebar.closeNavigation")}
        >
          <X size={19} />
        </button>
      </div>

      <nav className="drawer-nav">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.key}
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
          <strong>{t("sidebar.growSmarter")}</strong>
          <span>{t("sidebar.betterDecisions")}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
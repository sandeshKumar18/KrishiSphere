import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Sprout,
  Wheat,
  Sparkles,
  Menu,
} from "lucide-react";

const items = [
  {
    label: "Home",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Fields",
    path: "/fields",
    icon: Sprout,
  },
  {
    label: "Crops",
    path: "/crop-cycles",
    icon: Wheat,
  },
  {
    label: "AI",
    path: "/advice",
    icon: Sparkles,
  },
];

const MobileBottomNav = ({ onMoreClick }) => {
  return (
    <nav className="mobile-bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `mobile-nav-item ${
                isActive ? "mobile-nav-item-active" : ""
              }`
            }
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      <button
        className="mobile-nav-item"
        onClick={onMoreClick}
      >
        <Menu size={19} />
        <span>More</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
import {
  Bell,
  CircleHelp,
  Menu,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import krishiSphereLogo from "../../assets/KrishiSphere_LOGO.png";
import { useNavigate } from "react-router-dom";
import "./Header.css";

import { useAuth } from "../../context/AuthContext.jsx";
import FarmAlerts from "../../pages/FarmAlerts.jsx";

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const farmerName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "Farmer";

  const avatarLetter =
    farmerName.charAt(0).toUpperCase();

    const changeLanguage = (language) => {
  i18n.changeLanguage(language);
    localStorage.setItem(
      "krishisphere-language",
      language
    );
  };

  return (
    <header className="topbar">

      <div className="topbar-left">

        <button
          type="button"
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <button
          type="button"
          className="brand-button"
          onClick={() => navigate("/")}
          aria-label="Go to KrishiSphere home"
        >
          <span className="brand-name">
            <img
              src={krishiSphereLogo}
              alt="KrishiSphere"
              className="brand-logo"
            />
          </span>
        </button>

      </div>

     
      <div className="topbar-center">

        <button
          type="button"
          className="farm-selector"
          onClick={() => navigate("/fields")}
        >
          My Farm
        </button>

        <button
          type="button"
          className="farm-selector"
          onClick={() =>
            navigate("/government-schemes")
          }
        >
          Government Schemes
        </button>

        <button
          type="button"
          className="farm-selector"
          onClick={() => navigate("/guidance")}
          aria-label="Open KrishiSphere guidance"
        >
          Guidance
        </button>

      </div>

      <div className="topbar-right">


        <div
          className="language-switcher"
          aria-label="Language selection"
        >
          <button
            type="button"
            className={
              i18n.language === "en"
                ? "language-option active"
                : "language-option"
            }
            onClick={() => changeLanguage("en")}
          >
            EN
          </button>

          <button
            type="button"
            className={
              i18n.language === "hi"
                ? "language-option active"
                : "language-option"
            }
            onClick={() => changeLanguage("hi")}
          >
            हिंदी
          </button>
        </div>

        <div
          className="notification-icon-only"
          aria-label="Notifications"
        >
          <FarmAlerts size={20} />
        </div>

        <button
          type="button"
          className="farm-selector"
          onClick={() => navigate("/settings")}
          aria-label={`Open settings for ${farmerName}`}
        >

          <div className="user-avatar">
            {avatarLetter}
          </div>

          <div className="user-info">
            <span className="user-name">
              {farmerName}
            </span>

            <span className="user-role">
              Farmer
            </span>
          </div>

        </button>

      </div>

    </header>
  );
};

export default Header;
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  ChevronRight,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings as SettingsIcon,
  User,
} from "lucide-react";

import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";

import "./Settings.css";

const Settings = () => {
  const { t } = useTranslation();

  const {
    user,
    logout,
    refreshUser,
  } = useAuth();

  const [activeAction, setActiveAction] =
    useState(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    state: "",
    district: "",
  });

  const [currentPassword, setCurrentPassword] =  useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  useEffect(() => {
    if (!user) return;

    setProfile({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      state: user.location?.state || "",
      district: user.location?.district || "",
    });
  }, [user]);

  const toggleAction = (action) => {
    setMessage("");
    setError("");
    setPasswordMessage("");
    setPasswordError("");

    setActiveAction((current) =>
      current === action ? null : action
    );
  };

  const handleProfileChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setError("");

      await api.patch(
        "/auth/profile",
        {
          name: profile.name,
          phone: profile.phone,
          location: {
            state: profile.state,
            district: profile.district,
          },
        }
      );

      await refreshUser();

      setMessage(t("settings.profileUpdated"));
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(t("settings.profileUpdateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (
      !currentPassword ||
      !newPassword
    ) {
      setPasswordError(
        t("settings.fillBothPasswordFields")
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        t("settings.passwordTooShort")
      );
      return;
    }

    try {
      setPasswordLoading(true);

      await api.patch(
        "/auth/password",
        {
          currentPassword,
          newPassword,
        }
      );

      setCurrentPassword("");
      setNewPassword("");

      setPasswordMessage(
        t("settings.passwordChanged")
      );
    } catch (err) {
      console.error(
        t("settings.passwordChangeFailed"),
        err
      );

      setPasswordError(
        err.message ||
          "Unable to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const displayValue = (value) => {
    return value?.trim()
      ? value
      : t("settings.notAdded");
  };

  const initials =
    profile.name
      ?.trim()
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="settings-page">

      <section className="settings-header">
        <div>
          <div className="settings-eyebrow">
            <SettingsIcon size={15} />
            {t("settings.accountSettings")}
          </div>

          <h1>{t("settings.title")}</h1>

          <p>{t("settings.description")}</p>
        </div>

        <div className="settings-header-icon">
          <SettingsIcon size={28} />
        </div>
      </section>

      <section className="profile-summary-card">
        <div className="profile-avatar">
          {initials}
        </div>

        <div className="profile-summary-main">
          <h2>
            {displayValue(profile.name)}
          </h2>

          <div className="profile-summary-email">
            <Mail size={14} />
            <span>
              {displayValue(profile.email)}
            </span>
          </div>

          <div className="profile-summary-location">
            <MapPin size={14} />

            <span>
              {profile.district ||
              profile.state
                ? [
                    profile.district,
                    profile.state,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : t("settings.locationNotAdded")}
            </span>
          </div>
        </div>

        <div className="profile-summary-phone">
          <Phone size={14} />
          <span>
            {displayValue(profile.phone)}
          </span>
        </div>
      </section>

      <div className="settings-section-title">
         {t("settings.account")}
      </div>

      <section
        className={`settings-action-card ${
          activeAction === "profile"
            ? "active"
            : ""
        }`}
      >
        <button
          type="button"
          className="settings-action-row"
          onClick={() =>
            toggleAction("profile")
          }
        >
          <div className="settings-action-icon">
            <User size={19} />
          </div>

          <div className="settings-action-content">
            {t("settings.updateProfile")}

            <p>
              {t("settings.editProfileDescription")}
            </p>
          </div>

          <ChevronRight
            size={20}
            className={`settings-action-arrow ${
              activeAction === "profile"
                ? "rotated"
                : ""
            }`}
          />
        </button>

        {activeAction === "profile" && (
          <div className="settings-editor">
            <form
              className="settings-form"
              onSubmit={
                handleProfileSubmit
              }
            >
              <div className="settings-field">
                <label>{t("settings.fullName")}</label>

                <div className="settings-input">
                  <User size={17} />

                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={
                      handleProfileChange
                    }
                    placeholder={t("settings.namePlaceholder")}
                    required
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>{t("settings.email")}</label>

                <div className="settings-input disabled">
                  <Mail size={17} />

                  <input
                    type="email"
                    value={profile.email}
                    disabled
                  />
                </div>

                <small>
                  {t("settings.emailCannotChange")}
                </small>
              </div>

              <div className="settings-field">
                <label>{t("settings.phone")}</label>

                <div className="settings-input">
                  <Phone size={17} />

                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={
                      handleProfileChange
                    }
                    placeholder={t("settings.phonePlaceholder")}
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>{t("settings.state")}</label>

                <div className="settings-input">
                  <MapPin size={17} />

                  <input
                    type="text"
                    name="state"
                    value={profile.state}
                    onChange={
                      handleProfileChange
                    }
                    placeholder={t("settings.state")}
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>{t("settings.district")}</label>

                <div className="settings-input">
                  <MapPin size={17} />

                  <input
                    type="text"
                    name="district"
                    value={profile.district}
                    onChange={
                      handleProfileChange
                    }
                    placeholder={t("settings.district")}
                  />
                </div>
              </div>

              {message && (
                <div className="settings-success">
                  <Check size={16} />
                  {message}
                </div>
              )}

              {error && (
                <div className="settings-error">
                  {error}
                </div>
              )}

              <div className="settings-actions">
                <button
                  type="button"
                  className="settings-secondary-btn"
                  onClick={() =>
                    toggleAction("profile")
                  }
                >
                  {t("settings.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                >
                  <Save size={16} />

                  {loading
                    ? t("settings.saving")
                    : t("settings.saveChanges")}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <section
        className={`settings-action-card ${
          activeAction === "password"
            ? "active"
            : ""
        }`}
      >
        <button
          type="button"
          className="settings-action-row"
          onClick={() =>
            toggleAction("password")
          }
        >
          <div className="settings-action-icon">
            <KeyRound size={19} />
          </div>

          <div className="settings-action-content">
            {t("settings.changePassword")}

            <p>
              {t("settings.updatePasswordDescription")}
            </p>
          </div>

          <ChevronRight
            size={20}
            className={`settings-action-arrow ${
              activeAction === "password"
                ? "rotated"
                : ""
            }`}
          />
        </button>

        {activeAction === "password" && (
          <div className="settings-editor">
            <form
              className="settings-form"
              onSubmit={
                handlePasswordSubmit
              }
            >
              <div className="settings-field">
                <label>
                  {t("settings.currentPassword")}
                </label>

                <div className="settings-input">
                  <KeyRound size={17} />

                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value
                      )
                    }
                    placeholder={t("settings.currentPassword")}
                    required
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>
                  {t("settings.newPassword")}
                </label>

                <div className="settings-input">
                  <KeyRound size={17} />

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder={t("settings.newPassword")}
                    minLength={6}
                    required
                  />
                </div>

                <small>
                  {t("settings.minimumPasswordLength")}
                </small>
              </div>

              {passwordMessage && (
                <div className="settings-success">
                  <Check size={16} />
                  {passwordMessage}
                </div>
              )}

              {passwordError && (
                <div className="settings-error">
                  {passwordError}
                </div>
              )}

              <div className="settings-actions">
                <button
                  type="button"
                  className="settings-secondary-btn"
                  onClick={() =>
                    toggleAction("password")
                  }
                >
                  {t("settings.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={
                    passwordLoading
                  }
                >
                  <KeyRound size={16} />

                  {passwordLoading
                    ? t("settings.changing")
                    : t("settings.changePasswordButton")}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <section className="settings-action-card logout-card">
        <button
          type="button"
          className="settings-action-row"
          onClick={handleLogout}
        >
          <div className="settings-action-icon danger">
            <LogOut size={19} />
          </div>

          <div className="settings-action-content">
            <h2>{t("settings.logout")}</h2>

            <p>
              {t("settings.logoutDescription")}
            </p>
          </div>

          <ChevronRight
            size={20}
            className="settings-action-arrow"
          />
        </button>
      </section>
    </div>
  );
};

export default Settings;
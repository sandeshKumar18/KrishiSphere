import { useEffect, useState } from "react";

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

  const [currentPassword, setCurrentPassword] =
    useState("");

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

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err.message ||
          "Unable to update profile."
      );
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
        "Please fill both password fields."
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
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
        "Password changed successfully."
      );
    } catch (err) {
      console.error(
        "Password change error:",
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
      : "Not added";
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
            ACCOUNT SETTINGS
          </div>

          <h1>Settings</h1>

          <p>
            View and manage your KrishiSphere
            account.
          </p>
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
                : "Location not added"}
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
        Account
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
            <h2>Update Profile</h2>

            <p>
              Edit your personal information
              and location.
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
                <label>Full name</label>

                <div className="settings-input">
                  <User size={17} />

                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={
                      handleProfileChange
                    }
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>Email</label>

                <div className="settings-input disabled">
                  <Mail size={17} />

                  <input
                    type="email"
                    value={profile.email}
                    disabled
                  />
                </div>

                <small>
                  Email cannot be changed from
                  Settings.
                </small>
              </div>

              <div className="settings-field">
                <label>Phone</label>

                <div className="settings-input">
                  <Phone size={17} />

                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={
                      handleProfileChange
                    }
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>State</label>

                <div className="settings-input">
                  <MapPin size={17} />

                  <input
                    type="text"
                    name="state"
                    value={profile.state}
                    onChange={
                      handleProfileChange
                    }
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>District</label>

                <div className="settings-input">
                  <MapPin size={17} />

                  <input
                    type="text"
                    name="district"
                    value={profile.district}
                    onChange={
                      handleProfileChange
                    }
                    placeholder="District"
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
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                >
                  <Save size={16} />

                  {loading
                    ? "Saving..."
                    : "Save changes"}
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
            <h2>Change Password</h2>

            <p>
              Update your account password.
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
                  Current password
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
                    placeholder="Current password"
                    required
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>
                  New password
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
                    placeholder="New password"
                    minLength={6}
                    required
                  />
                </div>

                <small>
                  Minimum 6 characters.
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
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    passwordLoading
                  }
                >
                  <KeyRound size={16} />

                  {passwordLoading
                    ? "Changing..."
                    : "Change password"}
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
            <h2>Logout</h2>

            <p>
              Sign out from your KrishiSphere
              account.
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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const Signup = () => {
  const { t } = useTranslation();
  const {
    register,
    user,
    loading: authLoading,
  } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    state: "",
    district: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <p>{t("auth.loading")}</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const state = form.state.trim();
    const district = form.district.trim();

    if (!name || !email || !form.password) {
      setError(t("auth.signupRequiredFields"));
      return;
    }

    if (form.password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email,
        password: form.password,
        phone,
        location: {
          state,
          district,
        },
      });

      navigate("/", { replace: true });
    } catch (error) {
      setError(
        t(
          error?.message === "User already exists"
            ? "auth.userAlreadyExists"
            : "auth.signupFailed"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">

        <section className="auth-visual signup-visual">
          <div className="auth-brand">
            <div className="auth-brand-mark">
              KS
            </div>

            <div>
              <h1>KrishiSphere</h1>
              <span>{t("auth.tagline")}</span>
            </div>
          </div>

          <div className="auth-hero-content">
            <p className="auth-eyebrow">
              {t("auth.signupHeroEyebrow")}
            </p>

            <h2>
              {t("auth.signupHeroTitleLine1")}
              <br />
             {t("auth.signupHeroTitleLine2")}
            </h2>

            <p>{t("auth.signupHeroDescription")}</p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>{t("auth.signupFeatures.profile.title")}</strong>
                <p>{t("auth.signupFeatures.profile.description")}</p>
              </div>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>{t("auth.signupFeatures.workspace.title")}</strong>
                <p>{t("auth.signupFeatures.workspace.description")}</p>
              </div>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>{t("auth.signupFeatures.getStarted.title")}</strong>
                <p>{t("auth.signupFeatures.getStarted.description")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-wrapper signup-form-wrapper">

            <div className="auth-mobile-brand">
              <div className="auth-brand-mark">
                KS
              </div>

              <div>
                <h1>KrishiSphere</h1>
                <span>{t("auth.tagline")}</span>
              </div>
            </div>

            <div className="auth-heading">
              <p className="auth-eyebrow">
                {t("auth.signupWelcome")}
              </p>

              <h2>{t("auth.signupTitle")}</h2>

              <p>{t("auth.signupDescription")}</p>
            </div>

            {error && (
              <div className="auth-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <div className="auth-field">
                <label htmlFor="signup-name">
                  {t("auth.fullNameLabel")}
                </label>

                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder={t("auth.fullNamePlaceholder")}
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-form-grid">
                <div className="auth-field">
                  <label htmlFor="signup-email">
                    {t("auth.emailLabel")}
                  </label>

                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-phone">
                    {t("auth.phoneLabel")}
                  </label>

                  <input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    placeholder={t("auth.optionalPlaceholder")}
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="auth-form-grid">
                <div className="auth-field">
                  <label htmlFor="signup-state">
                    {t("auth.stateLabel")}
                  </label>

                  <input
                    id="signup-state"
                    name="state"
                    type="text"
                    placeholder={t("auth.optionalPlaceholder")}
                    value={form.state}
                    onChange={handleChange}
                    autoComplete="address-level1"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-district">
                    {t("auth.districtLabel")}
                  </label>

                  <input
                    id="signup-district"
                    name="district"
                    type="text"
                    placeholder={t("auth.optionalPlaceholder")}
                    value={form.district}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="auth-form-grid">
                <div className="auth-field">
                  <label htmlFor="signup-password">
                    {t("auth.passwordLabel")}
                  </label>

                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder={t("auth.passwordMinPlaceholder")}
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-confirm-password">
                    {t("auth.confirmPasswordLabel")}
                  </label>

                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner" />
                    {t("auth.creatingAccount")}
                  </>
                ) : (
                  t("auth.createAccount")
                )}
              </button>
            </form>

            <div className="auth-bottom-text">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link to="/login">
                {t("auth.signIn")}
              </Link>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

export default Signup;
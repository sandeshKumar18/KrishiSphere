import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const Login = () => {
  const { t } = useTranslation();
  const {
    login,
    user,
    loading: authLoading,
  } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError(t("auth.emailPasswordRequired"));
      return;
    }

    setLoading(true);

    try {
      await login(cleanEmail, password);
      navigate("/", { replace: true });
    } catch (error) {
      setError(
        error?.message ||
          t("auth.loginFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">

        <section className="auth-visual">
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
              {t("auth.heroEyebrow")}
            </p>

            <h2>
             {t("auth.heroTitleLine1")}
              <br />
              {t("auth.heroTitleLine2")}
            </h2>

            <p>
              <p>{t("auth.heroDescription")}</p>
            </p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>{t("auth.features.fields.title")}</strong>
                <p>{t("auth.features.fields.description")}</p>
              </div>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>{t("auth.features.cropCycles.title")}</strong>
                <p>{t("auth.features.cropCycles.description")}</p>
              </div>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>{t("auth.features.decisions.title")}</strong>
                <p>{t("auth.features.decisions.description")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-wrapper">

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
                {t("auth.welcomeBack")}
              </p>

              <h2>{t("auth.signInTitle")}</h2>

              <p>{t("auth.signInDescription")}</p>
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
                <label htmlFor="login-email">
                  {t("auth.emailLabel")}
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="login-password">
                    {t("auth.passwordLabel")}
                  </label>
                </div>

                <input
                  id="login-password"
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner" />
                    {t("auth.signingIn")}
                  </>
                ) : (
                  t("auth.signIn")
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>{t("auth.newToKrishiSphere")}</span>
            </div>

            <Link
              to="/signup"
              className="auth-secondary-button"
            >
               {t("auth.createAccount")}
            </Link>

          </div>
        </section>

      </div>
    </div>
  );
};

export default Login;
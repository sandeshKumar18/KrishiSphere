import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const Login = () => {
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
        <p>Loading KrishiSphere...</p>
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
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await login(cleanEmail, password);
      navigate("/", { replace: true });
    } catch (error) {
      setError(
        error?.message ||
          "Unable to login. Please try again."
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
              <span>Smart farming, simplified.</span>
            </div>
          </div>

          <div className="auth-hero-content">
            <p className="auth-eyebrow">
              YOUR DIGITAL FARM COMPANION
            </p>

            <h2>
              Manage your farm.
              <br />
              Grow with confidence.
            </h2>

            <p>
              Keep your fields, crop cycles, market
              information and farming decisions in one
              connected platform.
            </p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>Manage fields</strong>
                <p>Keep your farm records organized.</p>
              </div>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>Track crop cycles</strong>
                <p>Follow every crop from planning to harvest.</p>
              </div>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>Make better decisions</strong>
                <p>Bring your farming information together.</p>
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
                <span>Smart farming, simplified.</span>
              </div>
            </div>

            <div className="auth-heading">
              <p className="auth-eyebrow">
                WELCOME BACK
              </p>

              <h2>Sign in to your farm</h2>

              <p>
                Continue managing your farm with KrishiSphere.
              </p>
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
                  Email address
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
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
                    Password
                  </label>
                </div>

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
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
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>New to KrishiSphere?</span>
            </div>

            <Link
              to="/signup"
              className="auth-secondary-button"
            >
              Create your account
            </Link>

          </div>
        </section>

      </div>
    </div>
  );
};

export default Login;
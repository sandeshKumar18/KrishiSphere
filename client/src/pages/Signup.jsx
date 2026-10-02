import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const Signup = () => {
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
        <p>Loading KrishiSphere...</p>
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
      setError(
        "Name, email and password are required."
      );
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password should be at least 6 characters."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
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
        error?.message ||
          "Unable to create your account."
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
              <span>Smart farming, simplified.</span>
            </div>
          </div>

          <div className="auth-hero-content">
            <p className="auth-eyebrow">
              BUILD YOUR FARM PROFILE
            </p>

            <h2>
              Everything your farm
              <br />
              needs, in one place.
            </h2>

            <p>
              Create your account once and keep your
              fields, crops and farming activities organized
              from one dashboard.
            </p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>One farm profile</strong>
                <p>Keep your basic information together.</p>
              </div>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>Personalized workspace</strong>
                <p>Build your farm management system your way.</p>
              </div>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <div>
                <strong>Ready to get started</strong>
                <p>Register once and enter your dashboard.</p>
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
                <span>Smart farming, simplified.</span>
              </div>
            </div>

            <div className="auth-heading">
              <p className="auth-eyebrow">
                GET STARTED
              </p>

              <h2>Create your account</h2>

              <p>
                Set up your farmer profile to enter
                KrishiSphere.
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
                <label htmlFor="signup-name">
                  Full name
                </label>

                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-form-grid">
                <div className="auth-field">
                  <label htmlFor="signup-email">
                    Email address
                  </label>

                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-phone">
                    Phone
                  </label>

                  <input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    placeholder="Optional"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="auth-form-grid">
                <div className="auth-field">
                  <label htmlFor="signup-state">
                    State
                  </label>

                  <input
                    id="signup-state"
                    name="state"
                    type="text"
                    placeholder="Optional"
                    value={form.state}
                    onChange={handleChange}
                    autoComplete="address-level1"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-district">
                    District
                  </label>

                  <input
                    id="signup-district"
                    name="district"
                    type="text"
                    placeholder="Optional"
                    value={form.district}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="auth-form-grid">
                <div className="auth-field">
                  <label htmlFor="signup-password">
                    Password
                  </label>

                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-confirm-password">
                    Confirm password
                  </label>

                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
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
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <div className="auth-bottom-text">
              Already have an account?{" "}
              <Link to="/login">
                Sign in
              </Link>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

export default Signup;
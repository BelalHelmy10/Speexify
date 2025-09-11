// web/src/pages/Login.jsx

// ─────────────────────────────────────────────────────────────────────────────
// Imports: React hooks, axios for API calls, and react-router for navigation
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
axios.defaults.withCredentials = true;

function Login() {
  // ───────────────────────────────────────────────────────────────────────────
  // Local state
  // - form: holds email/password fields
  // - user: current authenticated user (if any)
  // - msg: error/success messages
  // - submitting: loading state for login button
  // ───────────────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({ email: "", password: "" });
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch current user (if session exists)
  // Calls /auth/me to check whether user is logged in via cookie session
  // ───────────────────────────────────────────────────────────────────────────
  const checkMe = async () => {
    try {
      const res = await axios.get("http://localhost:5050/api/auth/me");
      setUser(res.data.user || null);
    } catch {
      setUser(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Login handler
  // - Prevents default form submit
  // - Calls backend /auth/login
  // - On success → refresh user, redirect to dashboard
  // - On failure → show error message
  // ───────────────────────────────────────────────────────────────────────────
  const login = async (e) => {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);
    try {
      await axios.post("http://localhost:5050/api/auth/login", form);
      await checkMe();
      navigate("/dashboard");
    } catch (err) {
      setMsg(err.response?.data?.error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Logout handler
  // - Clears session on server
  // - Refreshes local user state
  // ───────────────────────────────────────────────────────────────────────────
  const logout = async () => {
    await axios.post("http://localhost:5050/api/auth/logout");
    await checkMe();
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Run once on mount
  // - Checks if the user is already logged in (existing session)
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    checkMe();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // - If not logged in: show styled login form
  // - If logged in: show status + logout option
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <main className="auth-page">
      <section className="auth-card">
        {/* Header */}
        <header className="auth-head">
          <h1>Login</h1>
          <p>Welcome back! Please enter your details to continue.</p>
        </header>

        {/* If user is not logged in → show login form */}
        {!user ? (
          <form className="auth-form" onSubmit={login}>
            {/* Email field */}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Password field */}
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {/* Error message */}
            {msg && <div className="auth-alert">{msg}</div>}

            {/* Submit button */}
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Login"}
            </button>

            {/* Helper footer */}
            <footer className="auth-foot">
              <span className="muted">Don’t have an account?</span>
              <a href="/register" className="link-strong">
                Create one
              </a>
            </footer>
          </form>
        ) : (
          // If user is logged in → show welcome + logout
          <div className="auth-logged">
            <p>
              Logged in as <strong>{user.email}</strong>{" "}
              {user.name ? `(${user.name})` : ""} — role: {user.role}
            </p>
            <button className="btn-primary" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
export default Login;

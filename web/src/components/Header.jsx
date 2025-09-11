// web/src/components/Header.jsx

// ─────────────────────────────────────────────────────────────────────────────
// Imports: routing, auth hook, HTTP client, and local state for the mobile menu
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import axios from "axios";
axios.defaults.withCredentials = true;

export default function Header() {
  // ───────────────────────────────────────────────────────────────────────────
  // Auth context: current user, loading flag, and setter to clear on logout
  // ───────────────────────────────────────────────────────────────────────────
  const { user, checking, setUser } = useAuth();

  // ───────────────────────────────────────────────────────────────────────────
  // Router helper: navigate after logout
  // ───────────────────────────────────────────────────────────────────────────
  const navigate = useNavigate();

  // ───────────────────────────────────────────────────────────────────────────
  // UI state: controls the hamburger / mobile drawer
  // ───────────────────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Logout action: end session on server, clear local auth, then redirect
  // ───────────────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await axios.post("http://localhost:5050/api/auth/logout");
    } catch {
      // ignore network errors; proceed to clear local state
    } finally {
      setUser(null);
      setOpen(false);
      navigate("/login");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Navigation models: public (logged out) and authenticated variants
  // - "learner" is the base for all signed-in users
  // - "adminExtra" is inserted after Dashboard/Calendar for admins
  // ───────────────────────────────────────────────────────────────────────────
  const loggedOut = [
    { to: "/", label: "Home" },
    { to: "/individual-training", label: "Individual" },
    { to: "/corporate-training", label: "Corporate" },
    { to: "/packages", label: "Packages" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  const learner = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/calendar", label: "Calendar" },
    { to: "/settings", label: "Settings" },
  ];

  const adminExtra = [{ to: "/admin", label: "Admin" }];

  // ───────────────────────────────────────────────────────────────────────────
  // Final link list:
  // - While checking auth: show public links (prevents flicker)
  // - If admin: insert Admin between Calendar and Settings
  // ───────────────────────────────────────────────────────────────────────────
  const links =
    checking || !user
      ? loggedOut
      : user.role === "admin"
      ? [...learner.slice(0, 2), ...adminExtra, ...learner.slice(2)]
      : learner;

  // ───────────────────────────────────────────────────────────────────────────
  // Right-side CTA:
  // - "Checking…" while verifying auth
  // - "Log in" when logged out
  // - "Logout" button when logged in
  // ───────────────────────────────────────────────────────────────────────────
  const RightCTA = () =>
    checking ? (
      <span className="nav-status">Checking…</span>
    ) : !user ? (
      <Link to="/login" className="nav-cta">
        Log in
      </Link>
    ) : (
      <button type="button" className="nav-cta" onClick={logout}>
        Logout
      </button>
    );

  return (
    // ─────────────────────────────────────────────────────────────────────────
    // Header wrapper: contains brand, desktop nav, right CTA, and hamburger
    // ─────────────────────────────────────────────────────────────────────────
    <header className="site-header-wrapper">
      <div className="site-header container">
        {/* ────────────────────────────────────────────────────────────────────
            Brand / Logo: link back to home
        ───────────────────────────────────────────────────────────────────── */}
        <Link to="/" className="brand" aria-label="Speexify">
          <span>Speexify</span>
        </Link>

        {/* ────────────────────────────────────────────────────────────────────
            Desktop navigation: primary links + Register (only when logged out)
        ───────────────────────────────────────────────────────────────────── */}
        <nav className="nav">
          <ul className="nav-list">
            {links.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " is-active" : "")
                  }
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {!checking && !user && (
              <li className="nav-item">
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " is-active" : "")
                  }
                  onClick={() => setOpen(false)}
                >
                  Register
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* ────────────────────────────────────────────────────────────────────
            Right-side CTA: login/logout/checking state indicator
        ───────────────────────────────────────────────────────────────────── */}
        <RightCTA />

        {/* ────────────────────────────────────────────────────────────────────
            Hamburger toggle: opens/closes the mobile drawer
        ───────────────────────────────────────────────────────────────────── */}
        <button
          className={"nav-toggle" + (open ? " is-open" : "")}
          aria-label="Toggle menu"
          aria-expanded={open ? "true" : "false"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          Mobile drawer: mirrors desktop nav; adds CTA row for login/logout
      ─────────────────────────────────────────────────────────────────────── */}
      <div className={"mobile-drawer" + (open ? " is-open" : "")}>
        <ul className="mobile-list">
          {links.map((item) => (
            <li key={item.to} className="mobile-item">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  "mobile-link" + (isActive ? " is-active" : "")
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            </li>
          ))}

          {/* Extra actions for logged-out users (only after checking) */}
          {!checking && !user && (
            <>
              <li className="mobile-item">
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    "mobile-link" + (isActive ? " is-active" : "")
                  }
                  onClick={() => setOpen(false)}
                >
                  Register
                </NavLink>
              </li>
              <li className="mobile-item">
                <Link
                  to="/login"
                  className="mobile-cta"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
              </li>
            </>
          )}

          {/* Logout action for authenticated users */}
          {!checking && user && (
            <li className="mobile-item">
              <button className="mobile-cta" onClick={logout} type="button">
                Logout
              </button>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}

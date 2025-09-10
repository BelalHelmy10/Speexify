// web/src/components/Header.jsx
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import axios from "axios";

axios.defaults.withCredentials = true;

export default function Header() {
  const { user, checking, setUser } = useAuth();
  const navigate = useNavigate();

  // Style helper for active/inactive links
  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#0070f3" : "#222",
    fontWeight: isActive ? 600 : 400,
  });

  const logout = async () => {
    try {
      await axios.post("http://localhost:5050/api/auth/logout");
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  // Base link sets
  const PUBLIC_LINKS = [
    { to: "/", label: "Home" },
    { to: "/individual-training", label: "Individual" },
    { to: "/corporate-training", label: "Corporate" },
    { to: "/packages", label: "Packages" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/register", label: "Register" },
    { to: "/login", label: "Login" },
  ];

  const AUTHTED_BASE = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/calendar", label: "Calendar" },
    { to: "/settings", label: "Settings" },
  ];

  const linksToShow = user
    ? [
        ...AUTHTED_BASE,
        ...(user.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
      ]
    : PUBLIC_LINKS;

  return (
    <header className="site-header">
      <div
        className="container header-row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 0",
        }}
      >
        {/* Brand */}
        <NavLink
          to="/"
          className="brand"
          style={{ fontWeight: 700, textDecoration: "none", color: "#111" }}
        >
          Speexify
        </NavLink>

        {/* Main Nav */}
        <nav
          className="nav"
          style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
        >
          {linksToShow.map((l) => (
            <NavLink key={l.to} to={l.to} style={linkStyle}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side: status / actions */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {checking ? (
            <span style={{ color: "#666" }}>Checking…</span>
          ) : user ? (
            <>
              <span style={{ color: "#666" }}>
                Hi, {user.name || user.email?.split("@")[0] || "User"}
              </span>
              <button
                onClick={logout}
                className="btn-link"
                style={{
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  color: "#0070f3",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <span style={{ color: "#666" }}>Guest</span>
          )}
        </div>
      </div>
    </header>
  );
}

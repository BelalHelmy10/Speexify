import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import axios from "axios";

axios.defaults.withCredentials = true;

function Header() {
  const { user, checking, setUser } = useAuth();
  const navigate = useNavigate();

  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#0070f3" : "#222",
    fontWeight: isActive ? 600 : 400,
  });

  const logout = async () => {
    await axios.post("http://localhost:5050/api/auth/logout");
    setUser(null); // update local state quickly
    navigate("/"); // optional: send back to home
  };

  return (
    <header className="site-header">
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", gap: 16 }}
      >
        <div className="brand">Speexify</div>

        <nav className="nav" style={{ display: "flex", gap: 12 }}>
          <NavLink to="/" style={linkStyle}>
            Home
          </NavLink>
          <NavLink to="/individual-training" style={linkStyle}>
            Individual
          </NavLink>
          <NavLink to="/corporate-training" style={linkStyle}>
            Corporate
          </NavLink>
          <NavLink to="/packages" style={linkStyle}>
            Packages
          </NavLink>
          <NavLink to="/about" style={linkStyle}>
            About
          </NavLink>
          <NavLink to="/contact" style={linkStyle}>
            Contact
          </NavLink>
          <NavLink to="/calendar" style={linkStyle}>
            Calendar
          </NavLink>
          <NavLink to="/settings" style={linkStyle}>
            Settings
          </NavLink>

          {/* When not logged in */}
          {!checking && !user && (
            <>
              <NavLink to="/register" style={linkStyle}>
                Register
              </NavLink>
              <NavLink to="/login" style={linkStyle}>
                Login
              </NavLink>
            </>
          )}

          {/* When logged in */}
          {!checking && user && (
            <>
              <NavLink to="/dashboard" style={linkStyle}>
                Dashboard
              </NavLink>
              {/* Show Admin link only for admins */}
              {user.role === "admin" && (
                <NavLink to="/admin" style={linkStyle}>
                  Admin
                </NavLink>
              )}
              <button onClick={logout} style={{ marginLeft: 8 }}>
                Logout
              </button>
            </>
          )}
        </nav>

        {/* Right side: small status */}
        <div style={{ marginLeft: "auto", fontSize: 14, color: "#555" }}>
          {checking
            ? "Checking…"
            : user
            ? `Hi, ${user.name || user.email}`
            : "Guest"}
        </div>
      </div>
    </header>
  );
}

export default Header;

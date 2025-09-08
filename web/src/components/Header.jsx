import { NavLink } from "react-router-dom";

function Header() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#0070f3" : "#222",
    fontWeight: isActive ? 600 : 400,
  });

  return (
    <header className="site-header">
      <div className="container">
        <div className="brand">Speexify</div>
        <nav className="nav">
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
          <NavLink to="/register" style={linkStyle}>
            Register
          </NavLink>
          <NavLink to="/login" style={linkStyle}>
            Login
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;

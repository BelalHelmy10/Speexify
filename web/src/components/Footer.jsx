// src/components/Footer.jsx
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer-wrapper">
      <div className="site-footer container">
        <div className="footer-top">
          <div className="brand">
            <Link to="/" className="brand-link">
              Speexify
            </Link>
            <p className="brand-tag">
              Language & communication coaching for teams that need results.
            </p>
          </div>

          <nav className="footer-cols">
            <div className="col">
              <div className="col-title">Product</div>
              <Link to="/individual-training" className="col-link">
                Individual
              </Link>
              <Link to="/corporate-training" className="col-link">
                Corporate
              </Link>
              <Link to="/packages" className="col-link">
                Packages
              </Link>
            </div>

            <div className="col">
              <div className="col-title">Company</div>
              <Link to="/about" className="col-link">
                About
              </Link>
              <Link to="/contact" className="col-link">
                Contact
              </Link>
              <a className="col-link" href="/Careers">
                Careers
              </a>
            </div>

            <div className="col">
              <div className="col-title">Resources</div>
              <a
                className="col-link"
                href="#blog"
                onClick={(e) => e.preventDefault()}
              >
                Blog
              </a>
              <a
                className="col-link"
                href="#guides"
                onClick={(e) => e.preventDefault()}
              >
                Guides
              </a>
              <a
                className="col-link"
                href="#help"
                onClick={(e) => e.preventDefault()}
              >
                Help Center
              </a>
            </div>

            <div className="col">
              <div className="col-title">Legal</div>
              <a
                className="col-link"
                href="#privacy"
                onClick={(e) => e.preventDefault()}
              >
                Privacy
              </a>
              <a
                className="col-link"
                href="#terms"
                onClick={(e) => e.preventDefault()}
              >
                Terms
              </a>
              <a
                className="col-link"
                href="#cookies"
                onClick={(e) => e.preventDefault()}
              >
                Cookies
              </a>
            </div>
          </nav>
        </div>

        <div className="footer-bottom">
          <div className="copy">
            © {new Date().getFullYear()} Speexify. All rights reserved.
          </div>
          <div className="social">
            {/* placeholders; swap for real icons when ready */}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="LinkedIn"
              className="social-btn"
            >
              in
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="Twitter"
              className="social-btn"
            >
              𝕏
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="YouTube"
              className="social-btn"
            >
              ▶
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;

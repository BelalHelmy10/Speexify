// src/layout/Layout.jsx

// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Shared page chrome (Header + main content + optional Footer)
// - Renders the site header once
// - Uses <Outlet /> to render the current page inside a consistent frame
// - Optional footer (on by default)
// ─────────────────────────────────────────────────────────────────────────────
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Layout({ withFooter = true }) {
  return (
    <>
      {/* ──────────────────────────────────────────────────────────────────────
          Global Header (brand + navigation + auth-aware CTA)
      ─────────────────────────────────────────────────────────────────────── */}
      <Header />

      {/* ──────────────────────────────────────────────────────────────────────
          Main content area (your pages render here via <Outlet />)
          - Keep className to benefit from your existing spacing styles
      ─────────────────────────────────────────────────────────────────────── */}
      <main className="site-main">
        <Outlet />
      </main>

      {/* ──────────────────────────────────────────────────────────────────────
          Optional Footer (legal/links/copyright, etc.)
      ─────────────────────────────────────────────────────────────────────── */}
      {withFooter && <Footer />}
    </>
  );
}

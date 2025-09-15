import { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import "../styles/contact.scss";

axios.defaults.withCredentials = true;

function Contact() {
  const { user } = useAuth();

  // ── form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    role: "Individual",
    topic: "General question",
    budget: "",
    message: "",
    agree: false,
  });

  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  // Prefill from logged-in user
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || user.name || "",
      email: f.email || user.email || "",
    }));
  }, [user]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!form.name || !form.email || !form.message || !form.agree) {
      setStatus("Please fill required fields.");
      return;
    }

    setSending(true);
    try {
      // Try API first
      await axios.post("http://localhost:5050/api/contact", form);
      setStatus("Sent ✓ Thanks — we’ll get back to you shortly.");
      setForm((f) => ({ ...f, message: "" }));
    } catch (err) {
      // Fallback: open email client with prefilled content
      const subject = encodeURIComponent(
        `[Contact] ${form.topic} — ${form.name}`
      );
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\nPhone: ${form.phone}\nRole: ${form.role}\nBudget: ${form.budget}\n\nMessage:\n${form.message}`
      );
      window.location.href = `mailto:hello@speexify.com?subject=${subject}&body=${body}`;
      setStatus(
        "Opened your email client. If that didn’t work, email hello@speexify.com."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact">
      {/* HERO */}
      <section className="contact-hero">
        <div className="contact-hero__content container">
          <h1 className="contact-hero__title">Talk to Speexify</h1>
          <p className="contact-hero__subtitle">
            Language & communication coaching that drives results. Tell us what
            you need — we’ll tailor a plan.
          </p>
          <div className="contact-hero__actions">
            <a href="/register" className="btn btn--primary">
              Book a call
            </a>
            <a href="mailto:hello@speexify.com" className="btn btn--ghost">
              Email us
            </a>
          </div>
        </div>
      </section>

      {/* GRID: Form + Sidebar */}
      <section className="container contact-grid">
        {/* LEFT: Form */}
        <div className="card contact-form">
          <div className="card__header">
            <h2 className="card__title">Contact us</h2>
            <p className="card__subtitle">
              We usually reply within one business day.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="field">
                <label className="label" htmlFor="name">
                  Full name*
                </label>
                <input
                  id="name"
                  name="name"
                  className="input"
                  value={form.name}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="email">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="input"
                  value={form.email}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="label" htmlFor="company">
                  Company
                </label>
                <input
                  id="company"
                  name="company"
                  className="input"
                  value={form.company}
                  onChange={onChange}
                  placeholder="(optional)"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  className="input"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="(optional)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="label" htmlFor="role">
                  I’m a…
                </label>
                <select
                  id="role"
                  name="role"
                  className="select"
                  value={form.role}
                  onChange={onChange}
                >
                  <option>Individual</option>
                  <option>Teacher</option>
                  <option>Company</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="topic">
                  Topic
                </label>
                <select
                  id="topic"
                  name="topic"
                  className="select"
                  value={form.topic}
                  onChange={onChange}
                >
                  <option>General question</option>
                  <option>Sales / Team training</option>
                  <option>Support</option>
                  <option>Partnerships</option>
                  <option>Media</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="budget">
                  Budget
                </label>
                <select
                  id="budget"
                  name="budget"
                  className="select"
                  value={form.budget}
                  onChange={onChange}
                >
                  <option value="">Not sure yet</option>
                  <option>Under $1,000</option>
                  <option>$1,000 – $5,000</option>
                  <option>$5,000 – $15,000</option>
                  <option>$15,000+</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="message">
                How can we help?*
              </label>
              <textarea
                id="message"
                name="message"
                className="textarea"
                rows={6}
                value={form.message}
                onChange={onChange}
                required
              />
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={onChange}
              />
              <span>
                I agree to the processing of my info per the{" "}
                <a href="/privacy" className="link">
                  privacy policy
                </a>
                .
              </span>
            </label>

            <div className="actions">
              <button
                className="btn btn--primary"
                type="submit"
                disabled={sending}
              >
                {sending ? "Sending…" : "Send message"}
              </button>
              {status && (
                <span className="form-status" role="status" aria-live="polite">
                  {status}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT: Sidebar cards */}
        <aside className="contact-sidebar">
          {/* Contact channels */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Talk to a human</h3>
            </div>
            <ul className="list">
              <li>
                <div className="list__title">Sales (teams & companies)</div>
                <a className="link" href="mailto:sales@speexify.com">
                  sales@speexify.com
                </a>
              </li>
              <li>
                <div className="list__title">Support (learners & teachers)</div>
                <a className="link" href="mailto:support@speexify.com">
                  support@speexify.com
                </a>
              </li>
              <li>
                <div className="list__title">Partnerships</div>
                <a className="link" href="mailto:partners@speexify.com">
                  partners@speexify.com
                </a>
              </li>
            </ul>
            <div className="pill">Avg. response: &lt; 24h (Mon–Fri)</div>
          </div>

          {/* Office / Hours (placeholder) */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Office & hours</h3>
            </div>
            <div className="kvs">
              <div>
                <span>HQ</span>
                <strong>London, UK</strong>
              </div>
              <div>
                <span>Support</span>
                <strong>Mon–Fri, 9–6 (UTC)</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>+44 20 0000 0000</strong>
              </div>
            </div>
          </div>

          {/* Social (placeholder) */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Follow us</h3>
            </div>
            <div className="social">
              <a
                className="btn btn--ghost"
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
              <a
                className="btn btn--ghost"
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
              >
                X
              </a>
              <a
                className="btn btn--ghost"
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
              >
                YouTube
              </a>
            </div>
          </div>
        </aside>
      </section>

      {/* Solutions lanes (placeholders) */}
      <section className="container lanes">
        <div className="lane">
          <h3>For individuals</h3>
          <p>
            Improve speaking, listening, and confidence with tailored sessions.
          </p>
          <a className="btn btn--ghost" href="/individual">
            Learn more
          </a>
        </div>
        <div className="lane">
          <h3>For teams</h3>
          <p>
            Onboarding, meetings, and presentations — programs that fit your
            culture.
          </p>
          <a className="btn btn--ghost" href="/corporate">
            Learn more
          </a>
        </div>
        <div className="lane">
          <h3>Packages</h3>
          <p>Transparent pricing for individuals and companies.</p>
          <a className="btn btn--ghost" href="/packages">
            See packages
          </a>
        </div>
      </section>

      {/* Locations / map placeholder */}
      <section className="contact-map">
        <div className="container contact-map__inner">
          <div className="contact-map__panel card">
            <h3 className="card__title">Where we operate</h3>
            <p>
              Remote-first across EMEA & North America. In-person options on
              request.
            </p>
            <ul className="bullets">
              <li>🇬🇧 London (HQ)</li>
              <li>🇪🇺 EU time zones covered</li>
              <li>🇺🇸 East & Pacific time</li>
            </ul>
          </div>
          <div className="contact-map__canvas">
            {/* Replace with an actual map embed later */}
            <div className="map-placeholder">Map placeholder</div>
          </div>
        </div>
      </section>

      {/* FAQ (simple accordion, placeholder) */}
      <section className="container faq">
        <h2 className="faq__title">Frequently asked questions</h2>
        <Accordion
          items={[
            {
              q: "How fast can we start?",
              a: "Most individuals start within 48 hours. Teams: 1–2 weeks depending on scope.",
            },
            {
              q: "Do you offer corporate invoicing?",
              a: "Yes. We support invoicing & purchase orders for approved accounts.",
            },
            {
              q: "What languages do you coach?",
              a: "English-focused today, with custom programs available on request.",
            },
          ]}
        />
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Small accordion component (no external lib)
 * ──────────────────────────────────────────────────────────────────────────── */
function Accordion({ items = [] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="accordion">
      {items.map((it, idx) => (
        <div
          key={idx}
          className={`accordion__item ${open === idx ? "is-open" : ""}`}
        >
          <button
            className="accordion__q"
            onClick={() => setOpen(open === idx ? -1 : idx)}
            aria-expanded={open === idx}
          >
            {it.q}
          </button>
          <div className="accordion__a">
            <p>{it.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Contact;

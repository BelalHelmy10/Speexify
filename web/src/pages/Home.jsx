import { Link } from "react-router-dom";
import "../styles/home.scss";

function Home() {
  return (
    <div className="home">
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero__grid container">
          <div className="hero__copy">
            <p className="eyebrow">Language & communication coaching</p>
            <h1 className="hero__title">
              Empower your team to speak with confidence
            </h1>
            <p className="hero__sub">
              Speexify delivers personalized English coaching and applied
              learning programs that drive measurable performance at work.
            </p>

            <div className="hero__cta">
              <Link className="btn btn--primary" to="/register">
                Get started
              </Link>
              <Link className="btn btn--ghost" to="/packages">
                Explore packages
              </Link>
            </div>

            <ul className="hero__bullets">
              <li>1:1 coaching with expert trainers</li>
              <li>Flexible scheduling that fits your life</li>
              <li>Practical, job-ready communication skills</li>
            </ul>
          </div>

          <div className="hero__media">
            {/* Replace the placeholder with a real image/video when you’re ready */}
            <div className="media-card">
              <div className="media-card__img" aria-hidden="true" />
              <div className="media-card__note">
                Placeholder — add your hero image here
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF (logos / short line) ===== */}
      <section className="proof">
        <div className="container">
          <p className="proof__title">Trusted by learners and teams</p>
          <div className="proof__logos">
            {/* Swap these with real client logos when you have them */}
            <span className="logo-chip">Logo 1</span>
            <span className="logo-chip">Logo 2</span>
            <span className="logo-chip">Logo 3</span>
            <span className="logo-chip">Logo 4</span>
            <span className="logo-chip">Logo 5</span>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Speexify</h2>

          <div className="features__grid">
            <Feature
              title="Personalized coaching"
              text="A tailored plan built around your role, goals, and level. Learn what actually helps you succeed at work."
            />
            <Feature
              title="Top-tier coaches"
              text="Hand-picked, experienced trainers with business expertise — not just grammar."
            />
            <Feature
              title="Flexible & measurable"
              text="Book sessions around your schedule and track progress with clear milestones and reports."
            />
            <Feature
              title="For individuals & teams"
              text="From solo learners to company programs — Speexify scales with your needs."
            />
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS (simple, swappable) ===== */}
      <section className="testimonials">
        <div className="container">
          <div className="testimonials__grid">
            <Quote
              quote="My coach helped me nail tough client calls. I feel confident and clear."
              author="Sara M., Customer Success"
            />
            <Quote
              quote="Our team’s communication improved in weeks — meetings are faster and decisions clearer."
              author="Ahmed K., Team Lead"
            />
            <Quote
              quote="The sessions are practical and fun. I can see progress after every call."
              author="Javier R., Product Manager"
            />
          </div>
        </div>
      </section>

      {/* ===== CTA BAND ===== */}
      <section className="cta">
        <div className="container cta__inner">
          <div>
            <h3 className="cta__title">Ready to accelerate your English?</h3>
            <p className="cta__sub">
              Join Speexify today — start with a personalized plan in minutes.
            </p>
          </div>
          <div className="cta__actions">
            <Link className="btn btn--primary btn--lg" to="/register">
              Create your account
            </Link>
            <Link className="btn btn--ghost btn--lg" to="/contact">
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, text }) {
  return (
    <div className="feature">
      <div className="feature__icon" aria-hidden="true">
        {/* You can replace with an SVG later */}
        <span>★</span>
      </div>
      <h3 className="feature__title">{title}</h3>
      <p className="feature__text">{text}</p>
    </div>
  );
}

function Quote({ quote, author }) {
  return (
    <figure className="quote">
      <blockquote>“{quote}”</blockquote>
      <figcaption>— {author}</figcaption>
    </figure>
  );
}

export default Home;

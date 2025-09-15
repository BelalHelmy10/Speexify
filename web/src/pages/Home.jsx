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
              <img
                src="./images/Hero First.avif"
                alt="Hero"
                className="media-card__img"
              />{" "}
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
            <img src="/images/logo-amazon.svg" alt="Logo 1" className="logo" />
            <img
              src="/images/logo-cocacola.svg"
              alt="Logo 2"
              className="logo"
            />
            <img src="/images/logo-tesla.svg" alt="Logo 3" className="logo" />
            <img src="/images/logo-allianz.svg" alt="Logo 4" className="logo" />
            <img src="/images/logo-indeed.svg" alt="Logo 5" className="logo" />
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

      {/* ─────────────────────────────────────────
          NEW: STATS STRIP (lightweight social proof)
      ───────────────────────────────────────── */}
      <section className="spx-home-stats">
        <div className="container spx-home-stats__grid">
          <div className="spx-home-stats__item">
            <div className="spx-home-stats__num">98%</div>
            <div className="spx-home-stats__label">report higher clarity</div>
          </div>
          <div className="spx-home-stats__item">
            <div className="spx-home-stats__num">2.4×</div>
            <div className="spx-home-stats__label">faster meeting outcomes</div>
          </div>
          <div className="spx-home-stats__item">
            <div className="spx-home-stats__num">50k+</div>
            <div className="spx-home-stats__label">
              coaching hours delivered
            </div>
          </div>
          <div className="spx-home-stats__item">
            <div className="spx-home-stats__num">35+</div>
            <div className="spx-home-stats__label">industry-aligned tracks</div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          NEW: HOW IT WORKS (3-step)
      ───────────────────────────────────────── */}
      <section className="spx-home-how">
        <div className="container">
          <h2 className="spx-home-how__title">How it works</h2>
          <div className="spx-home-how__grid">
            <HowStep
              step="01"
              title="Assess"
              text="Complete a quick skills & goals survey to personalize your plan."
              img="/images/placeholder-assess.jpg"
            />
            <HowStep
              step="02"
              title="Coach"
              text="Meet 1:1 with a coach matched to your role & industry."
              img="/images/placeholder-coach.jpg"
            />
            <HowStep
              step="03"
              title="Apply"
              text="Practice with real work scenarios and measure improvement."
              img="/images/placeholder-apply.jpg"
            />
          </div>
          <div className="spx-home-how__cta">
            <Link className="btn btn--primary" to="/register">
              Start your assessment
            </Link>
            <Link className="btn btn--ghost" to="/contact">
              Ask a question
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          NEW: CURRICULUM PREVIEW (cards)
      ───────────────────────────────────────── */}
      <section className="spx-home-curriculum">
        <div className="container">
          <div className="spx-home-curriculum__head">
            <h2>What you’ll learn</h2>
            <p className="spx-home-curriculum__sub">
              Practical, job-ready modules you can apply the same day.
            </p>
          </div>

          <div className="spx-home-curriculum__grid">
            <CurriculumCard
              title="Client communication"
              desc="Run structured calls, handle objections, and summarize clearly."
              img="/images/placeholder-client.jpg"
            />
            <CurriculumCard
              title="Presentations"
              desc="Build confident narratives with visuals and engaging delivery."
              img="/images/placeholder-present.jpg"
            />
            <CurriculumCard
              title="Email & async"
              desc="Write crisp, professional messages that get quick responses."
              img="/images/placeholder-email.jpg"
            />
            <CurriculumCard
              title="Leadership"
              desc="Drive decisions, give feedback, and influence across teams."
              img="/images/placeholder-leadership.jpg"
            />
          </div>

          <div className="spx-home-curriculum__more">
            <Link className="btn btn--ghost" to="/packages">
              See full track list
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          NEW: COACHES SPOTLIGHT
      ───────────────────────────────────────── */}
      <section className="spx-home-coaches">
        <div className="container">
          <h2 className="spx-home-coaches__title">Meet a few of our coaches</h2>
          <div className="spx-home-coaches__grid">
            <CoachCard
              name="Adriana K."
              role="Senior Communication Coach"
              bio="Former enterprise trainer; specializes in client-facing roles."
              img="/images/placeholder-coach-1.jpg"
            />
            <CoachCard
              name="Samir B."
              role="Presentation & Storytelling"
              bio="Ex-consultant; helps craft persuasive narratives for execs."
              img="/images/placeholder-coach-2.jpg"
            />
            <CoachCard
              name="Lina T."
              role="Leadership Communication"
              bio="Led global teams; mentors managers on clarity and influence."
              img="/images/placeholder-coach-3.jpg"
            />
          </div>
          <p className="spx-home-coaches__note">
            Coaches shown are examples. We’ll match you with the best fit for
            your goals.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          NEW: CASE STUDIES / MINI STORIES
      ───────────────────────────────────────── */}
      <section className="spx-home-cases">
        <div className="container">
          <h2 className="spx-home-cases__title">Real outcomes</h2>
          <div className="spx-home-cases__grid">
            <CaseCard
              logo="/images/logo-indeed.svg"
              title="Onboarding made faster"
              text="A support team reduced average handle time by 22% with clearer call structures."
            />
            <CaseCard
              logo="/images/logo-amazon.svg"
              title="Meetings that decide"
              text="A product trio cut weekly syncs by 30% using agenda-first updates."
            />
            <CaseCard
              logo="/images/logo-allianz.svg"
              title="Sales confidence"
              text="Reps improved objection handling and boosted close rates in Q2."
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

      {/* ─────────────────────────────────────────
          NEW: FAQ (no JS, accessible)
      ───────────────────────────────────────── */}
      <section className="spx-home-faq">
        <div className="container">
          <h2 className="spx-home-faq__title">Frequently asked questions</h2>
          <div className="spx-home-faq__grid">
            <details className="spx-home-faq__item">
              <summary>How do you match me with a coach?</summary>
              <p>
                We consider your goals, current level, industry, and schedule to
                suggest the best coach profiles for you or your team.
              </p>
            </details>
            <details className="spx-home-faq__item">
              <summary>Can I switch coaches later?</summary>
              <p>
                Absolutely. If the fit isn’t right, you can switch anytime
                without losing progress.
              </p>
            </details>
            <details className="spx-home-faq__item">
              <summary>Do you offer corporate packages?</summary>
              <p>
                Yes — we support budget controls, reporting, and manager
                dashboards for teams.
              </p>
            </details>
            <details className="spx-home-faq__item">
              <summary>What’s the time commitment?</summary>
              <p>
                Most learners do 1–2 sessions per week plus short, role-based
                practice.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          NEW: NEWSLETTER / SECONDARY CTA
      ───────────────────────────────────────── */}
      <section className="spx-home-newsletter">
        <div className="container spx-home-newsletter__inner">
          <div className="spx-home-newsletter__copy">
            <h3>Get actionable communication tips</h3>
            <p>Monthly insights from coaches — no spam.</p>
          </div>
          <form
            className="spx-home-newsletter__form"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email"
              aria-label="Email"
              className="spx-home-newsletter__input"
            />
            <button className="btn btn--primary" type="submit">
              Subscribe
            </button>
          </form>
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

/* ========== Existing components ========== */
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

/* ========== New local components (scoped to this file) ========== */
function HowStep({ step, title, text, img }) {
  return (
    <div className="spx-home-how__card">
      <div className="spx-home-how__media">
        <img src={img} alt="" />
        <span className="spx-home-how__badge">{step}</span>
      </div>
      <div className="spx-home-how__body">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function CurriculumCard({ title, desc, img }) {
  return (
    <article className="spx-home-curriculum__card">
      <div className="spx-home-curriculum__thumb">
        <img src={img} alt="" />
      </div>
      <div className="spx-home-curriculum__content">
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </article>
  );
}

function CoachCard({ name, role, bio, img }) {
  return (
    <div className="spx-home-coaches__card">
      <img className="spx-home-coaches__avatar" src={img} alt={name} />
      <div className="spx-home-coaches__info">
        <h3>{name}</h3>
        <p className="spx-home-coaches__role">{role}</p>
        <p className="spx-home-coaches__bio">{bio}</p>
      </div>
    </div>
  );
}

function CaseCard({ logo, title, text }) {
  return (
    <div className="spx-home-cases__card">
      <div className="spx-home-cases__logo">
        <img src={logo} alt="" />
      </div>
      <div className="spx-home-cases__content">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default Home;

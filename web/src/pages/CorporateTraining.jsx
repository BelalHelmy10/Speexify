import { useRef, useState } from "react";
import axios from "axios";
import "../styles/corporate.scss";

axios.defaults.withCredentials = true;

function Corporate() {
  const formRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    company: "",
    contactName: "",
    email: "",
    size: "10–50",
    timeframe: "This month",
    goals: "",
    message: "",
    agree: false,
  });

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!form.company || !form.email || !form.agree) {
      setStatus("Please fill required fields.");
      return;
    }
    setSending(true);
    try {
      await axios.post("http://localhost:5050/api/contact", {
        name: `${form.contactName || "(no name)"} @ ${form.company}`,
        email: form.email,
        role: "Corporate",
        topic: "Corporate RFP",
        budget: "",
        message: `Company: ${form.company}\nTeam size: ${
          form.size
        }\nTimeframe: ${form.timeframe}\nGoals: ${form.goals}\n\n${
          form.message || ""
        }`,
      });
      setStatus("Thanks! We'll get back to you shortly.");
      formRef.current?.reset();
      setForm((f) => ({ ...f, message: "", agree: false }));
    } catch (_err) {
      const subject = encodeURIComponent(`[Corporate RFP] ${form.company}`);
      const body = encodeURIComponent(
        `Company: ${form.company}\nContact: ${form.contactName}\nEmail: ${form.email}\nTeam size: ${form.size}\nTimeframe: ${form.timeframe}\nGoals: ${form.goals}\n\n${form.message}`
      );
      window.location.href = `mailto:hello@speexify.com?subject=${subject}&body=${body}`;
      setStatus(
        "Opened your email client. If that didn't work, email hello@speexify.com."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="spx-corp">
      {/* HERO */}
      <section className="spx-corp__section spx-corp-hero">
        <div className="spx-corp-hero__background">
          <div className="spx-corp-hero__gradient"></div>
          <div className="spx-corp-hero__pattern"></div>
        </div>

        <div className="spx-corp__container spx-corp-hero__inner">
          <div className="spx-corp-hero__copy">
            <div className="spx-corp-hero__badge">
              <span className="spx-corp-hero__badge-icon">🏢</span>
              <span>Enterprise communication training</span>
            </div>

            <h1 className="spx-corp-hero__title">
              English that moves
              <span className="spx-corp-hero__title-accent"> the business</span>
            </h1>

            <p className="spx-corp-hero__subtitle">
              Tailored programs for teams and companies: 1:1 coaching,
              small-group practice, and workshops. Clear outcomes, flexible
              scheduling, and reporting for managers.
            </p>

            <div className="spx-corp-hero__actions">
              <a
                href="#rfp"
                className="spx-corp-btn spx-corp-btn--primary spx-corp-btn--shine"
              >
                <span>Request proposal</span>
                <svg
                  className="spx-corp-btn__arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M6 3L11 8L6 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href="/packages?tab=corporate"
                className="spx-corp-btn spx-corp-btn--ghost"
              >
                See plans
              </a>
            </div>

            <div className="spx-corp-hero__features">
              <div className="spx-corp-hero__feature">
                <svg
                  className="spx-corp-hero__feature-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M7 10L9 12L13 8M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Coach-matched</span>
              </div>
              <div className="spx-corp-hero__feature">
                <svg
                  className="spx-corp-hero__feature-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M7 10L9 12L13 8M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Flexible scheduling</span>
              </div>
              <div className="spx-corp-hero__feature">
                <svg
                  className="spx-corp-hero__feature-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M7 10L9 12L13 8M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Full reporting</span>
              </div>
            </div>
          </div>

          <figure className="spx-corp-media spx-corp-hero__media">
            <div className="spx-corp-hero__media-glow"></div>
            <img
              src="/images/team-practicing-communication.jpg"
              alt="Team practicing communication"
              loading="eager"
            />
            <div className="spx-corp-hero__media-badge">
              <span className="spx-corp-hero__media-badge-icon">👥</span>
              <span>Team training programs</span>
            </div>
          </figure>
        </div>
      </section>

      {/* LOGOS */}
      <section className="spx-corp__section spx-corp-logos">
        <div className="spx-corp__container">
          <p className="spx-corp-logos__title">Trusted by leading teams</p>
          <div className="spx-corp-logos__row">
            <div className="spx-corp-logos__item">
              <img src="/logos/slack.svg" alt="Slack" />
            </div>
            <div className="spx-corp-logos__item">
              <img src="/logos/notion.svg" alt="Notion" />
            </div>
            <div className="spx-corp-logos__item">
              <img src="/logos/zoom.svg" alt="Zoom" />
            </div>
            <div className="spx-corp-logos__item">
              <img src="/logos/hubspot.svg" alt="HubSpot" />
            </div>
            <div className="spx-corp-logos__item">
              <img src="/logos/ibm.svg" alt="IBM" />
            </div>
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="spx-corp__section spx-corp-outcomes">
        <div className="spx-corp__container spx-corp-grid--3">
          <Metric
            value="92%"
            label="report improved confidence in meetings"
            icon="📊"
          />
          <Metric value="4.9/5" label="average coach rating" icon="⭐" />
          <Metric
            value="6–8 wks"
            label="visible communication gains"
            icon="🎯"
          />
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="spx-corp__section spx-corp-programs">
        <div className="spx-corp__container">
          <div className="spx-corp-section-head">
            <h2 className="spx-corp-section-title">
              Programs that fit your team
            </h2>
            <p className="spx-corp-section-sub">
              Mix and match formats for maximum impact
            </p>
          </div>

          <div className="spx-corp-grid--3">
            <Program
              img="/images/one-on-one-coaching.jpg"
              title="1:1 Coaching"
              points={[
                "Personalized plan per learner",
                "Pronunciation & speaking drills",
                "Real work scenarios",
              ]}
            />
            <Program
              img="/images/small-group-practice.jpg"
              title="Small-Group Practice"
              points={[
                "3–6 learners per group",
                "Guided speaking time",
                "Peer feedback",
              ]}
            />
            <Program
              img="/images/workshops.jpg"
              title="Workshops"
              points={[
                "Presentations & storytelling",
                "Meetings & facilitation",
                "Email & tone for business",
              ]}
            />
          </div>
        </div>
      </section>

      {/* PLANS PREVIEW */}
      <section className="spx-corp__section spx-corp-plans">
        <div className="spx-corp__container">
          <div className="spx-corp-section-head">
            <h2 className="spx-corp-section-title">Pilot · Team · Company</h2>
            <p className="spx-corp-section-sub">
              Start small, scale with results
            </p>
          </div>

          <div className="spx-corp-grid--3">
            <Plan
              img="/images/pilot.jpg"
              title="Pilot (5–10)"
              desc="Validate impact with a small cohort and clear report."
              bullets={[
                "1:1 + group mix",
                "Kickoff & goals",
                "End-of-pilot report",
              ]}
            />
            <Plan
              img="/images/team.jpg"
              title="Team (10–50)"
              desc="Blend formats; add workshops; monthly reporting."
              bullets={["Coach matching", "Workshops", "Manager updates"]}
              popular
            />
            <Plan
              img="/images/company.jpg"
              title="Company (50+)"
              desc="Scaled rollout with CSM and quarterly exec reports."
              bullets={[
                "Scheduling at scale",
                "Dedicated CSM",
                "Security review support",
              ]}
            />
          </div>

          <div className="spx-corp-center">
            <a
              href="/packages?tab=corporate"
              className="spx-corp-btn spx-corp-btn--primary"
            >
              View corporate plans
            </a>
          </div>
        </div>
      </section>

      {/* REPORTING */}
      <section className="spx-corp__section spx-corp-reporting">
        <div className="spx-corp__container">
          <div className="spx-corp-reporting__inner">
            <div className="spx-corp-reporting__copy">
              <h2 className="spx-corp-section-title">
                Manager visibility & reporting
              </h2>
              <p className="spx-corp-section-sub">
                Monthly summaries, attendance, and learning milestones. Optional
                roster and SSO.
              </p>
              <ul className="spx-corp-bullets">
                <li>Progress & participation tracking</li>
                <li>Team trends & risk identification</li>
                <li>Quarterly business reviews</li>
              </ul>
            </div>
            <figure className="spx-corp-media spx-corp-reporting__media">
              <img
                src="/images/reporting-preview.jpg"
                alt="Reporting preview"
                loading="lazy"
              />
              <div className="spx-corp-reporting__overlay"></div>
            </figure>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="spx-corp__section spx-corp-testis">
        <div className="spx-corp__container">
          <div className="spx-corp-section-head">
            <h2 className="spx-corp-section-title">What leaders say</h2>
            <p className="spx-corp-section-sub">Real results from real teams</p>
          </div>

          <div className="spx-corp-grid--3">
            <Testi
              quote="Our team now leads client calls with confidence. Practical and fast."
              by="Sarah K."
              role="Head of CS, SaaS"
              avatar="/images/head-of-cs.jpg"
              rating={5}
            />
            <Testi
              quote="Workshops were a hit. The follow-up 1:1s sealed the gains."
              by="Marcus T."
              role="L&D Manager, Fintech"
              avatar="/images/l&d-manager.jpg"
              rating={5}
            />
            <Testi
              quote="Clear reporting helped us expand from pilot to company-wide."
              by="Priya M."
              role="HRBP, Global Ops"
              avatar="/images/global-ops.jpg"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* RFP FORM */}
      <section id="rfp" className="spx-corp__section spx-corp-rfp">
        <div className="spx-corp__container">
          <div className="spx-corp-rfp__card">
            <div className="spx-corp-section-head">
              <h2 className="spx-corp-section-title">Request a proposal</h2>
              <p className="spx-corp-section-sub">
                Tell us about your team and goals
              </p>
            </div>

            <form ref={formRef} onSubmit={submit} className="spx-corp-form">
              <div className="spx-corp-form__row spx-corp-form__row--2">
                <Field label="Company *">
                  <input
                    className="spx-corp-input"
                    name="company"
                    value={form.company}
                    onChange={onChange}
                    required
                  />
                </Field>
                <Field label="Contact name">
                  <input
                    className="spx-corp-input"
                    name="contactName"
                    value={form.contactName}
                    onChange={onChange}
                  />
                </Field>
              </div>

              <div className="spx-corp-form__row spx-corp-form__row--3">
                <Field label="Email *">
                  <input
                    className="spx-corp-input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    required
                  />
                </Field>
                <Field label="Team size">
                  <select
                    className="spx-corp-select"
                    name="size"
                    value={form.size}
                    onChange={onChange}
                  >
                    <option>5–10</option>
                    <option>10–50</option>
                    <option>50–200</option>
                    <option>200+</option>
                  </select>
                </Field>
                <Field label="Timeframe">
                  <select
                    className="spx-corp-select"
                    name="timeframe"
                    value={form.timeframe}
                    onChange={onChange}
                  >
                    <option>This month</option>
                    <option>Next 2–3 months</option>
                    <option>This quarter</option>
                  </select>
                </Field>
              </div>

              <div className="spx-corp-form__row spx-corp-form__row--2">
                <Field label="Goals">
                  <input
                    className="spx-corp-input"
                    name="goals"
                    placeholder="e.g., client calls, presentations, internal collaboration"
                    value={form.goals}
                    onChange={onChange}
                  />
                </Field>
                <Field label="Notes">
                  <input
                    className="spx-corp-input"
                    name="message"
                    placeholder="Optional"
                    value={form.message}
                    onChange={onChange}
                  />
                </Field>
              </div>

              <label className="spx-corp-check">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={onChange}
                />
                <span>
                  I agree to the{" "}
                  <a href="/privacy" className="spx-corp-link">
                    privacy policy
                  </a>
                  .
                </span>
              </label>

              <div className="spx-corp-actions">
                <button
                  className="spx-corp-btn spx-corp-btn--primary spx-corp-btn--shine"
                  type="submit"
                  disabled={sending}
                >
                  {sending ? "Sending…" : "Request proposal"}
                </button>
                {status && <span className="spx-corp-status">{status}</span>}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="spx-corp__section spx-corp-cta">
        <div className="spx-corp-cta__background">
          <div className="spx-corp-cta__gradient"></div>
          <div className="spx-corp-cta__shapes">
            <div className="spx-corp-cta__shape spx-corp-cta__shape--1"></div>
            <div className="spx-corp-cta__shape spx-corp-cta__shape--2"></div>
          </div>
        </div>

        <div className="spx-corp__container spx-corp-cta__inner">
          <div className="spx-corp-cta__content">
            <h2 className="spx-corp-cta__title">Ready to roll out training?</h2>
            <p className="spx-corp-cta__subtitle">
              Transform your team's communication starting today
            </p>
          </div>
          <div className="spx-corp-cta__actions">
            <a
              href="#rfp"
              className="spx-corp-btn spx-corp-btn--primary spx-corp-btn--lg"
            >
              Request proposal
            </a>
            <a
              href="/packages?tab=corporate"
              className="spx-corp-btn spx-corp-btn--ghost spx-corp-btn--lg"
            >
              See plans
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/* helpers */
function Field({ label, children }) {
  return (
    <div className="spx-corp-field">
      <label className="spx-corp-label">{label}</label>
      {children}
    </div>
  );
}

function Metric({ value, label, icon }) {
  return (
    <div className="spx-corp-card spx-corp-metric">
      <div className="spx-corp-metric__icon">{icon}</div>
      <div className="spx-corp-metric__value">{value}</div>
      <div className="spx-corp-metric__label">{label}</div>
    </div>
  );
}

function Program({ img, title, points = [] }) {
  return (
    <div className="spx-corp-card spx-corp-program">
      <figure className="spx-corp-media spx-corp-program__media">
        <img src={img} alt="" loading="lazy" />
        <div className="spx-corp-program__overlay"></div>
      </figure>
      <div className="spx-corp-program__body">
        <div className="spx-corp-program__title">{title}</div>
        <ul className="spx-corp-bullets">
          {points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Plan({ img, title, desc, bullets = [], popular = false }) {
  return (
    <div
      className={`spx-corp-card spx-corp-plan ${popular ? "is-popular" : ""}`}
    >
      {popular && <span className="spx-corp-badge">Most popular</span>}
      <figure className="spx-corp-media spx-corp-plan__media">
        <img src={img} alt="" loading="lazy" />
      </figure>
      <div className="spx-corp-plan__head">
        <div className="spx-corp-plan__title">{title}</div>
      </div>
      <p className="spx-corp-plan__desc">{desc}</p>
      <ul className="spx-corp-bullets">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <div className="spx-corp-plan__actions">
        <a href="#rfp" className="spx-corp-btn spx-corp-btn--primary">
          Request proposal
        </a>
        <a
          href="/packages?tab=corporate"
          className="spx-corp-btn spx-corp-btn--ghost"
        >
          Learn more
        </a>
      </div>
    </div>
  );
}

function Testi({ quote, by, role, avatar, rating }) {
  return (
    <div className="spx-corp-card spx-corp-testi">
      <div className="spx-corp-testi__header">
        <img
          className="spx-corp-testi__avatar"
          src={avatar}
          alt=""
          loading="lazy"
        />
        <div className="spx-corp-testi__stars">
          {[...Array(rating)].map((_, i) => (
            <span key={i} className="spx-corp-testi__star">
              ★
            </span>
          ))}
        </div>
      </div>
      <blockquote className="spx-corp-testi__quote">"{quote}"</blockquote>
      <div className="spx-corp-testi__author">
        <cite className="spx-corp-testi__by">{by}</cite>
        <span className="spx-corp-testi__role">{role}</span>
      </div>
    </div>
  );
}

export default Corporate;

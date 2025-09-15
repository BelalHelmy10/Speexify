import { useRef, useState } from "react";
import axios from "axios";
import "../styles/corporate.scss";

axios.defaults.withCredentials = true;

function Corporate() {
  // RFP / contact form state
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
      setStatus("Thanks! We’ll get back to you shortly.");
      formRef.current?.reset();
      setForm((f) => ({ ...f, message: "", agree: false }));
    } catch (_err) {
      const subject = encodeURIComponent(`[Corporate RFP] ${form.company}`);
      const body = encodeURIComponent(
        `Company: ${form.company}\nContact: ${form.contactName}\nEmail: ${form.email}\nTeam size: ${form.size}\nTimeframe: ${form.timeframe}\nGoals: ${form.goals}\n\n${form.message}`
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
    <div className="spx-corp">
      {/* HERO */}
      <section className="spx-corp__section spx-corp-hero">
        <div className="spx-corp__container spx-corp-hero__inner spx-corp-card">
          <div className="spx-corp-hero__copy">
            <h1 className="spx-corp-hero__title">
              English that moves the business.
            </h1>
            <p className="spx-corp-hero__subtitle">
              Tailored programs for teams and companies: 1:1 coaching,
              small-group practice, and workshops. Clear outcomes, flexible
              scheduling, and reporting for managers.
            </p>
            <div className="spx-corp-hero__actions">
              <a href="#rfp" className="spx-corp-btn spx-corp-btn--primary">
                Request proposal
              </a>
              <a
                href="/packages?tab=corporate"
                className="spx-corp-btn spx-corp-btn--ghost"
              >
                See plans
              </a>
            </div>
            <ul className="spx-corp-hero__bullets">
              <li>✓ Coach-matched</li>
              <li>✓ Flexible</li>
              <li>✓ Reported</li>
            </ul>
          </div>

          {/* Image placeholder */}
          <figure className="spx-corp-media spx-corp-hero__media">
            <img
              src="/images/team-practicing-communication.jpg"
              alt="Team practicing communication"
              loading="eager"
            />
          </figure>
        </div>
      </section>

      {/* LOGOS */}
      <section className="spx-corp__section spx-corp-logos">
        <div className="spx-corp__container spx-corp-logos__row spx-corp-card">
          <img src="/logos/slack.svg" alt="Logo 1" />
          <img src="/logos/notion.svg" alt="Logo 2" />
          <img src="/logos/zoom.svg" alt="Logo 3" />
          <img src="/logos/hubspot.svg" alt="Logo 4" />
          <img src="/logos/ibm.svg" alt="Logo 5" />
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="spx-corp__section spx-corp-outcomes">
        <div className="spx-corp__container spx-corp-grid--3">
          <Metric value="92%" label="report improved confidence in meetings" />
          <Metric value="4.9/5" label="average coach rating" />
          <Metric value="6–8 wks" label="visible communication gains" />
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
              Mix and match formats for impact.
            </p>
          </div>

          <div className="spx-corp-grid--3">
            <Program
              img="/assets/corporate-v2/program-11.jpg"
              title="1:1 Coaching"
              points={[
                "Personalized plan per learner",
                "Pronunciation & speaking drills",
                "Real work scenarios",
              ]}
            />
            <Program
              img="/assets/corporate-v2/program-group.jpg"
              title="Small-Group Practice"
              points={[
                "3–6 learners per group",
                "Guided speaking time",
                "Peer feedback",
              ]}
            />
            <Program
              img="/images/workshop.jpg"
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
              Start small, scale with results.
            </p>
          </div>

          <div className="spx-corp-grid--3">
            <Plan
              img="/assets/corporate-v2/plan-pilot.jpg"
              title="Pilot (5–10)"
              desc="Validate impact with a small cohort and clear report."
              bullets={[
                "1:1 + group mix",
                "Kickoff & goals",
                "End-of-pilot report",
              ]}
            />
            <Plan
              img="/assets/corporate-v2/plan-team.jpg"
              title="Team (10–50)"
              desc="Blend formats; add workshops; monthly reporting."
              bullets={["Coach matching", "Workshops", "Manager updates"]}
              popular
            />
            <Plan
              img="/assets/corporate-v2/plan-company.jpg"
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
        <div className="spx-corp__container spx-corp-card spx-corp-reporting__inner">
          <div className="spx-corp-reporting__copy">
            <h2 className="spx-corp-section-title">
              Manager visibility & reporting
            </h2>
            <p className="spx-corp-section-sub">
              Monthly summaries, attendance, and learning milestones. Optional
              roster and SSO.
            </p>
            <ul className="spx-corp-bullets">
              <li>Progress & participation</li>
              <li>Team trends & risks</li>
              <li>Quarterly reviews</li>
            </ul>
          </div>
          <figure className="spx-corp-media spx-corp-reporting__media">
            <img
              src="/assets/corporate-v2/reporting.jpg"
              alt="Reporting preview"
              loading="lazy"
            />
          </figure>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="spx-corp__section spx-corp-testis">
        <div className="spx-corp__container spx-corp-grid--3">
          <Testi
            quote="Our team now leads client calls with confidence. Practical and fast."
            by="Head of CS, SaaS"
            avatar="/assets/corporate-v2/ava-1.jpg"
          />
          <Testi
            quote="Workshops were a hit. The follow-up 1:1s sealed the gains."
            by="L&D Manager, Fintech"
            avatar="/assets/corporate-v2/ava-2.jpg"
          />
          <Testi
            quote="Clear reporting helped us expand from pilot to company-wide."
            by="HRBP, Global Ops"
            avatar="/assets/corporate-v2/ava-3.jpg"
          />
        </div>
      </section>

      {/* RFP FORM */}
      <section id="rfp" className="spx-corp__section spx-corp-rfp">
        <div className="spx-corp__container spx-corp-card">
          <div className="spx-corp-section-head">
            <h2 className="spx-corp-section-title">Request a proposal</h2>
            <p className="spx-corp-section-sub">
              Tell us about your team and goals.
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
                I agree to the <a href="/privacy">privacy policy</a>.
              </span>
            </label>

            <div className="spx-corp-actions">
              <button
                className="spx-corp-btn spx-corp-btn--primary"
                type="submit"
                disabled={sending}
              >
                {sending ? "Sending…" : "Request proposal"}
              </button>
              {status && <span className="spx-corp-status">{status}</span>}
            </div>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="spx-corp__section spx-corp-cta">
        <div className="spx-corp__container spx-corp-cta__inner">
          <h2>Ready to roll out training?</h2>
          <div className="spx-corp-cta__actions">
            <a href="#rfp" className="spx-corp-btn spx-corp-btn--primary">
              Request proposal
            </a>
            <a
              href="/packages?tab=corporate"
              className="spx-corp-btn spx-corp-btn--ghost"
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
function Metric({ value, label }) {
  return (
    <div className="spx-corp-card spx-corp-metric">
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
      <figure className="spx-corp-media spx-corp-plan__media">
        <img src={img} alt="" loading="lazy" />
      </figure>
      <div className="spx-corp-plan__head">
        <div className="spx-corp-plan__title">{title}</div>
        {popular && <span className="spx-corp-badge">Most popular</span>}
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
function Testi({ quote, by, avatar }) {
  return (
    <div className="spx-corp-card spx-corp-testi">
      <img
        className="spx-corp-testi__avatar"
        src={avatar}
        alt=""
        loading="lazy"
      />
      <blockquote className="spx-corp-testi__quote">“{quote}”</blockquote>
      <cite className="spx-corp-testi__by">— {by}</cite>
    </div>
  );
}

export default Corporate;

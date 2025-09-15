import { useEffect, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import axios from "axios";
import "../styles/individual.scss";

axios.defaults.withCredentials = true;

function Individual() {
  const { user } = useAuth();
  const formRef = useRef(null);

  // Trial / consult form state
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    timezone: "",
    level: "A2 (Elementary)",
    goal: "Speak more confidently",
    availability: "Weekdays",
    message: "",
    agree: false,
  });

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

  const submit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!form.name || !form.email || !form.agree) {
      setStatus("Please fill the required fields.");
      return;
    }
    setSending(true);
    try {
      await axios.post("http://localhost:5050/api/contact", {
        name: form.name,
        email: form.email,
        role: "Individual",
        topic: "Trial / Consult",
        budget: "",
        message: `Level: ${form.level}\nGoal: ${form.goal}\nTimezone: ${
          form.timezone
        }\nAvailability: ${form.availability}\n\n${form.message || ""}`,
      });
      setStatus("Thanks! We’ll email you to schedule a quick consult.");
      formRef.current?.reset();
      setForm((f) => ({ ...f, message: "", agree: false }));
    } catch (_err) {
      const subject = encodeURIComponent(`[Individual] ${form.goal}`);
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nLevel: ${form.level}\nGoal: ${form.goal}\nTimezone: ${form.timezone}\nAvailability: ${form.availability}\n\n${form.message}`
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
    <div className="ind">
      {/* HERO */}
      <section className="ind-hero">
        <div className="container ind-hero__inner card">
          <div className="ind-hero__copy">
            <h1 className="ind-hero__title">Speak English with confidence.</h1>
            <p className="ind-hero__subtitle">
              1:1 coaching focused on your real life — interviews, meetings,
              travel, or exams. Improve fast with clear goals, practical
              language, and coach feedback.
            </p>
            <div className="ind-hero__actions">
              <a href="#trial" className="btn btn--primary">
                Book a free consult
              </a>
              <a href="/packages" className="btn btn--ghost">
                See packages
              </a>
            </div>
            <ul className="ind-hero__bullets">
              <li>✅ Personalized 1:1 lessons</li>
              <li>✅ Flexible scheduling</li>
              <li>✅ Real-world results</li>
            </ul>
          </div>

          {/* Image placeholder (replace src later) */}
          <figure className="ind-hero__media">
            <img
              src="/images/learner-practicing-with-a-coach.jpg"
              alt="Learner practicing with a coach"
              loading="eager"
            />
          </figure>
        </div>
      </section>

      {/* METRICS */}
      <section className="container ind-metrics">
        <div className="grid-3">
          <MetricCard
            metric="+3×"
            label="more speaking time than group classes"
          />
          <MetricCard metric="4.9/5" label="average coach rating" />
          <MetricCard metric="6–8 wks" label="visible confidence gains" />
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="container ind-goals">
        <div className="card">
          <div className="card__header card__header--row">
            <h2 className="card__title">Built for your goals</h2>
            <a href="#trial" className="btn btn--ghost">
              Talk to a coach
            </a>
          </div>

          <div className="ind-goals__grid">
            <Goal
              title="Work & interviews"
              p="Practice interviews, meetings, and presentations. Get language you can use tomorrow."
              img="/images/interviews.jpg"
            />
            <Goal
              title="Fluency & conversation"
              p="Sound natural in daily life. Build vocabulary and confidence with guided speaking."
              img="/images/speaking.jpg"
            />
            <Goal
              title="Exams & study"
              p="Prepare for IELTS/TOEFL or university speaking tasks with targeted feedback."
              img="/images/exams.jpg"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container ind-how">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">How it works</h2>
            <p className="card__subtitle">
              Simple steps to get started and keep improving.
            </p>
          </div>
          <div className="ind-steps">
            <Step n="1" title="Quick consult">
              Share goals and schedule. We match you with the right coach.
            </Step>
            <Step n="2" title="Personal plan">
              Weekly 1:1 sessions with practice between lessons.
            </Step>
            <Step n="3" title="Real progress">
              Regular feedback, pronunciation tune-ups, and clear milestones.
            </Step>
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL LEARN */}
      <section className="container ind-learn">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">What you’ll learn</h2>
            <p className="card__subtitle">
              Practical modules customized to your level (A2–C2).
            </p>
          </div>
          <ul className="chips">
            <li>Everyday conversation</li>
            <li>Work meetings</li>
            <li>Interview prep</li>
            <li>Presentation skills</li>
            <li>Pronunciation & stress</li>
            <li>Email & chat tone</li>
            <li>Vocabulary building</li>
            <li>Listening strategies</li>
          </ul>
        </div>
      </section>

      {/* PRICING / PACKAGES */}
      <section className="pricing">
        <div className="pricing__wrap">
          {/* Card 1 */}
          <article className="card">
            <div className="card__media" aria-hidden />
            <div className="card__body">
              <h3 className="card__title">Starter</h3>
              <div className="card__price" aria-label="Price tier: $">
                $
              </div>
              <ul className="card__list">
                <li>30–min sessions</li>
                <li>Focus on one goal</li>
                <li>Coach feedback</li>
              </ul>
            </div>
          </article>

          {/* Card 2 */}
          <article className="card">
            <div className="card__media" aria-hidden />
            <div className="card__body">
              <h3 className="card__title">Standard</h3>
              <div className="card__price" aria-label="Price tier: $$">
                $$
              </div>
              <ul className="card__list">
                <li>45–60 min sessions</li>
                <li>Balanced progress</li>
                <li>Practice between lessons</li>
              </ul>
            </div>
          </article>

          {/* Card 3 */}
          <article className="card">
            <div className="card__media" aria-hidden />
            <div className="card__body">
              <h3 className="card__title">Intensive</h3>
              <div className="card__price" aria-label="Price tier: $$$">
                $$$
              </div>
              <ul className="card__list">
                <li>2× weekly sessions</li>
                <li>Fast improvement</li>
                <li>Detailed feedback</li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container ind-testimonials">
        <div className="grid-3">
          <Testimonial
            quote="I finally feel comfortable leading meetings. My coach made it practical and fun."
            by="Sara, Software Engineer"
            avatar="/images/sara.jpg"
          />
          <Testimonial
            quote="Two months with Speexify did more than a year of classes."
            by="Ali, MSc Student"
            avatar="/images/ali.jpg"
          />
          <Testimonial
            quote="The interview practice helped me get an offer. Totally worth it."
            by="Marta, Product Designer"
            avatar="/images/marta.jpg"
          />
        </div>
      </section>

      {/* TRIAL / CONSULT FORM */}
      <section id="trial" className="container ind-trial">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Book a free consult</h2>
            <p className="card__subtitle">
              Tell us a bit about you — we’ll match a coach and set up a call.
            </p>
          </div>

          <form ref={formRef} onSubmit={submit} className="rfp">
            <div className="rfp__row">
              <Field label="Full name*" name="name">
                <input
                  className="input"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                />
              </Field>
              <Field label="Email*" name="email">
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                />
              </Field>
            </div>

            <div className="rfp__row rfp__row--3">
              <Field label="Timezone" name="timezone">
                <input
                  className="input"
                  name="timezone"
                  placeholder="e.g., Europe/London"
                  value={form.timezone}
                  onChange={onChange}
                />
              </Field>
              <Field label="Level" name="level">
                <select
                  className="select"
                  name="level"
                  value={form.level}
                  onChange={onChange}
                >
                  <option>A2 (Elementary)</option>
                  <option>B1 (Intermediate)</option>
                  <option>B2 (Upper-Intermediate)</option>
                  <option>C1 (Advanced)</option>
                  <option>C2 (Proficient)</option>
                </select>
              </Field>
              <Field label="Availability" name="availability">
                <select
                  className="select"
                  name="availability"
                  value={form.availability}
                  onChange={onChange}
                >
                  <option>Weekdays</option>
                  <option>Weeknights</option>
                  <option>Weekends</option>
                </select>
              </Field>
            </div>

            <div className="rfp__row">
              <Field label="Main goal" name="goal">
                <select
                  className="select"
                  name="goal"
                  value={form.goal}
                  onChange={onChange}
                >
                  <option>Speak more confidently</option>
                  <option>Interview preparation</option>
                  <option>Improve pronunciation</option>
                  <option>Emails & writing</option>
                  <option>Exam preparation (IELTS/TOEFL)</option>
                </select>
              </Field>
              <Field label="Anything else?" name="message">
                <input
                  className="input"
                  name="message"
                  placeholder="Optional note"
                  value={form.message}
                  onChange={onChange}
                />
              </Field>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={onChange}
              />
              <span>
                I agree to the{" "}
                <a className="link" href="/privacy">
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
                {sending ? "Sending…" : "Request consult"}
              </button>
              {status && (
                <span className="form-status" role="status" aria-live="polite">
                  {status}
                </span>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="ind-cta">
        <div className="container ind-cta__inner">
          <h2>Ready to get started?</h2>
          <div className="ind-cta__actions">
            <a href="#trial" className="btn btn--primary">
              Book consult
            </a>
            <a href="/packages" className="btn btn--ghost">
              View packages
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ——— Reusable bits ——— */
function Field({ label, name, children }) {
  return (
    <div className="field" data-name={name}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function MetricCard({ metric, label }) {
  return (
    <div className="card metric">
      <div className="metric__value">{metric}</div>
      <div className="metric__label">{label}</div>
    </div>
  );
}

function Goal({ title, p, img }) {
  return (
    <div className="card goal">
      <figure className="goal__media">
        <img src={img} alt="" loading="lazy" />
      </figure>
      <div className="goal__body">
        <h3 className="goal__title">{title}</h3>
        <p className="goal__p">{p}</p>
      </div>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="step">
      <div className="step__n">{n}</div>
      <div className="step__body">
        <div className="step__title">{title}</div>
        <p className="step__p">{children}</p>
      </div>
    </div>
  );
}

function PriceCard({ title, price, bullets = [], img }) {
  return (
    <div className="card price">
      <figure className="price__media">
        <img src={img} alt="" loading="lazy" />
      </figure>
      <div className="price__title">{title}</div>
      <div className="price__value">{price}</div>
      <ul className="bullets">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

function Testimonial({ quote, by, avatar }) {
  return (
    <div className="card testi">
      <img className="testi__avatar" src={avatar} alt="" loading="lazy" />
      <blockquote className="testi__quote">“{quote}”</blockquote>
      <cite className="testi__by">— {by}</cite>
    </div>
  );
}

export default Individual;

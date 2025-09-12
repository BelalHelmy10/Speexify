import React from "react";
import "../styles/about.scss";

// If you keep images in the public folder, just use /images/... paths.
// Swap these filenames for your real assets anytime.
const heroImg = "/images/about_hero.jpg";
const historyImg = "/images/about_history.jpg";
const lifeImgA = "/images/about_life_a.jpg";
const lifeImgB = "/images/about_life_b.jpg";
const valuesIconA = "/logos/icon_empathy.svg";
const valuesIconB = "/logos/icon_empower.svg";
const valuesIconC = "/logos/icon_ownership.svg";
const valuesIconD = "/logos/icon_inclusive.svg";
const leadJan = "/images/Billy.jpeg";
const leadEliane = "/images/leader_eliane.jpg";
const leadChris = "/images/leader_chris.jpg";

const stats = [
  { value: "6", label: "languages" },
  { value: "150+", label: "countries" },
  { value: "100+", label: "industry-focused courses" },
  { value: "24/7", label: "live instruction" },
];

const values = [
  {
    icon: valuesIconA,
    title: "We take action with empathy",
    desc: "Impact starts with understanding. We balance compassion with pragmatic thinking to make decisions that align with our mission.",
  },
  {
    icon: valuesIconB,
    title: "We communicate to drive impact",
    desc: "We foster transparency, ask the right questions, and embrace constructive dialogue to deliver outcomes that matter.",
  },
  {
    icon: valuesIconC,
    title: "We own our outcomes",
    desc: "Everyone holds the wheel. We approach obstacles with purpose, hold ourselves accountable, and focus on results.",
  },
  {
    icon: valuesIconD,
    title: "We embrace diverse perspectives",
    desc: "Different viewpoints lead to better solutions. We break down barriers so learners and teams can achieve their goals.",
  },
];

const timeline = [
  {
    year: "2018",
    text: "Speexify starts as a small tutoring collective focused on real-world English.",
  },
  {
    year: "2020",
    text: "Launched 24/7 scheduling and a global tutor network.",
  },
  {
    year: "2023",
    text: "Expanded corporate programs with role-specific learning paths.",
  },
  {
    year: "2025",
    text: "Introduced AI-assisted practice to personalize every session.",
  },
];

const leaders = [
  { img: leadJan, name: "Belal Helmy", role: "CEO" },
  { img: leadEliane, name: "Eliane Yumi Iwasaki", role: "Sales & Marketing" },
  { img: leadChris, name: "Christopher Osborn", role: "Engineering" },
];

const testimonials = [
  {
    quote:
      "Speexify sharpened our team’s business English and saved hours each week. Practical, flexible, and effective.",
    name: "John Guthrie",
    company: "Hilton International",
  },
  {
    quote:
      "We saw remarkable improvement within weeks. The blend of live coaching and targeted content exceeded expectations.",
    name: "Donatella De Vita",
    company: "Pirelli",
  },
  {
    quote:
      "Speexify’s structure makes it easy to satisfy different learning styles across our organization.",
    name: "Bogdan Dumitrascu",
    company: "Forvia",
  },
  {
    quote:
      "Adoption was smooth and impact was fast. Highly recommended for business communication.",
    name: "Meredith Taghi",
    company: "DHL Group",
  },
];

export default function About() {
  return (
    <main className="about">
      {/* HERO */}
      <section className="about__hero">
        <div className="about__hero-left">
          <span className="about__badge">Meet Speexify</span>
          <h1 className="about__headline">
            Where language training meets business needs
          </h1>
          <p className="about__sub">
            We deliver job-specific programs that increase productivity, foster
            collaboration, and unlock people’s potential with real conversations
            and measurable progress.
          </p>
          <div className="about-cta-row">
            <a
              href="/demo"
              className="about-btn about-btn--primary about-btn--lg"
            >
              Request a demo <span className="about-btn__icon">→</span>
            </a>
            <a
              href="/packages"
              className="about-btn about-btn--outline about-btn--lg"
            >
              See packages
            </a>
          </div>
        </div>
        <div className="about__hero-right">
          <img src={heroImg} alt="Learner using Speexify" />
        </div>
      </section>

      {/* HISTORY */}
      <section className="about__history container">
        <div className="about__history-media">
          <img src={historyImg} alt="Speexify team" />
        </div>
        <div className="about__history-copy">
          <h2>Our history</h2>
          <p>
            Since our early days, we’ve supported learners in more than 150
            countries with live coaching from certified teachers and
            role-specific courses. Our approach bridges soft and technical skill
            gaps so teams can communicate, collaborate, and thrive.
          </p>
          <p>
            Today we’re remote-first and globally distributed. We keep improving
            the craft—refining our curriculum, growing our community of tutors,
            and building tools that make progress inevitable.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="about__stats">
        <div className="container about__stats-grid">
          {stats.map((s) => (
            <div className="about__stat" key={s.label}>
              <div className="about__stat-value">{s.value}</div>
              <div className="about__stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* LIFE @ SPEEXIFY */}
      <section className="about__life">
        <div className="container about__life-grid">
          <div className="about__life-copy">
            <h2>Life@Speexify</h2>
            <p>
              We’re a remote dream team across multiple time zones. Despite the
              distance, we stay closely connected, collaborate effectively, and
              show up for each other and our learners.
            </p>
            <p>
              Diversity is our strength—we bring different perspectives to the
              table and stay united in the mission to break down language
              barriers.
            </p>
          </div>
          <div className="about__life-media">
            <img
              className="about__life-img about__life-img--top"
              src={lifeImgA}
              alt="Team event"
            />
            <img
              className="about__life-img about__life-img--bottom"
              src={lifeImgB}
              alt="Learning in action"
            />
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="about__values container">
        {values.map((v) => (
          <article className="about__value" key={v.title}>
            <img className="about__value-icon" src={v.icon} alt="" />
            <h3>{v.title}</h3>
            <p>{v.desc}</p>
          </article>
        ))}
      </section>

      {/* TIMELINE */}
      <section className="about__timeline container">
        <h2>Timeline</h2>
        <div className="about__timeline-grid">
          {timeline.map((t) => (
            <div className="about__timeline-card" key={t.year}>
              <div className="about__timeline-year">{t.year}</div>
              <p>{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LEADERSHIP */}
      <section className="about__leaders container">
        <h2>Meet our executive leadership</h2>
        <div className="about__leader-grid">
          {leaders.map((l) => (
            <div className="about__leader" key={l.name}>
              <img src={l.img} alt={l.name} />
              <div className="about__leader-card">
                <h4>{l.name}</h4>
                <span>{l.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="about__testimonials container">
        <h2>Hear it from our clients</h2>
        <div className="about__quote-grid">
          {testimonials.map((q, i) => (
            <blockquote className="about__quote" key={i}>
              <p>“{q.quote}”</p>
              <footer>
                <strong>{q.name}</strong>
                <span>{q.company}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about__cta">
        <div className="container about__cta-inner">
          <h2>Join the Speexify team</h2>
          <p>
            Help us build the most effective, human-centered language learning
            platform in the world.
          </p>
          <div className="about-cta-row">
            <a
              href="/careers"
              className="about-btn about-btn--secondary about-btn--lg"
            >
              See open roles <span className="about-btn__icon">→</span>
            </a>
            <a
              href="/contact"
              className="about-btn about-btn--ghost about-btn--lg"
            >
              Connect with us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

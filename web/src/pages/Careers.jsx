import { useEffect, useMemo, useState } from "react";
import "../styles/careers.scss";

/**
 * Careers page for Speexify
 * - Loads jobs from /data/jobs.json (put this file in /public/data)
 * - Search by title/keywords
 * - Filter by department, location, and type
 * - Save roles (localStorage)
 * - Modal job details
 * - "Apply" via applyUrl (fallback to mailto)
 */
export default function Careers() {
  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({
    department: "All",
    location: "All",
    type: "All",
  });
  const [activeJob, setActiveJob] = useState(null);
  const [saved, setSaved] = useState(() => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem("speexify_saved_jobs") || "[]")
      );
    } catch {
      return new Set();
    }
  });

  // Load jobs JSON from /public
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/data/jobs.json", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setJobs(data.jobs || []);
        setDepartments(["All", ...(data.departments || [])]);
      } catch (e) {
        console.error("Failed to load jobs.json", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Persist saved roles
  useEffect(() => {
    localStorage.setItem(
      "speexify_saved_jobs",
      JSON.stringify(Array.from(saved))
    );
  }, [saved]);

  const locations = useMemo(() => {
    const set = new Set(jobs.map((j) => j.location));
    return ["All", ...Array.from(set)];
  }, [jobs]);

  const types = useMemo(() => {
    const set = new Set(jobs.map((j) => j.type));
    return ["All", ...Array.from(set)];
  }, [jobs]);

  // Filtered / searched list
  const filtered = useMemo(() => {
    const qNorm = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (filters.department !== "All" && j.department !== filters.department)
        return false;
      if (filters.location !== "All" && j.location !== filters.location)
        return false;
      if (filters.type !== "All" && j.type !== filters.type) return false;

      if (!qNorm) return true;
      const hay = [
        j.title,
        j.department,
        j.location,
        j.type,
        ...(j.tags || []),
        ...(j.keywords || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(qNorm);
    });
  }, [jobs, q, filters]);

  function toggleSave(id) {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function apply(job) {
    if (job.applyUrl) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const mail = "careers@speexify.com";
    const subject = encodeURIComponent(
      `Application — ${job.title} (ID: ${job.id})`
    );
    const body = encodeURIComponent(
      `Hi Speexify team,

I'd like to apply for ${job.title} (ID: ${job.id}).

Name:
Location:
LinkedIn / Portfolio:
Notes:

Thanks!`
    );
    window.location.href = `mailto:${mail}?subject=${subject}&body=${body}`;
  }

  return (
    <main className="careers">
      {/* Hero */}
      <section className="careers__hero">
        <div className="careers__hero-inner">
          <div className="careers__hero-copy">
            <span className="careers__eyebrow">Careers at Speexify</span>
            <h1>Help people speak with confidence, everywhere</h1>
            <p>
              We’re a remote-first team building language & communication
              training that actually works—for learners and for the businesses
              that rely on them. Join us to ship impact, not just features.
            </p>
            <div className="careers-cta-row">
              <a
                href="#open-roles"
                className="careers-btn careers-btn--primary careers-btn--lg"
              >
                See open roles <span className="careers-btn__icon">→</span>
              </a>
              <a
                href="/about"
                className="careers-btn careers-btn--outline careers-btn--lg"
              >
                Learn about Speexify
              </a>
            </div>
          </div>
          <div className="careers__hero-art" aria-hidden="true" />
        </div>
      </section>

      {/* Perks / values quick band */}
      <section className="careers__values">
        <div className="careers__values-grid">
          <div className="careers__value">
            <h3>Remote-first</h3>
            <p>Work from anywhere. Async-friendly culture across time zones.</p>
          </div>
          <div className="careers__value">
            <h3>Learning stipend</h3>
            <p>
              Each teammate gets a budget for courses, books, and conferences.
            </p>
          </div>
          <div className="careers__value">
            <h3>Wellbeing & PTO</h3>
            <p>
              Flexible time off, local holidays, and generous parental leave.
            </p>
          </div>
          <div className="careers__value">
            <h3>Inclusive culture</h3>
            <p>We embrace diverse perspectives to create better solutions.</p>
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section id="open-roles" className="careers__roles">
        <div className="careers__roles-head">
          <div>
            <h2>Open roles</h2>
            <p className="careers__roles-sub">
              {loading
                ? "Loading roles…"
                : `${filtered.length} role${
                    filtered.length === 1 ? "" : "s"
                  } available`}
            </p>
          </div>

          {/* Saved roles */}
          <div className="careers__saved">
            <span>Saved:</span>
            <span className="careers__saved-count">{saved.size}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="careers__controls">
          <input
            type="search"
            placeholder="Search by title, keyword, tech…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="careers__search"
            aria-label="Search jobs"
          />
          <div className="careers__filters">
            <select
              value={filters.department}
              onChange={(e) =>
                setFilters((f) => ({ ...f, department: e.target.value }))
              }
              aria-label="Filter by department"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={filters.location}
              onChange={(e) =>
                setFilters((f) => ({ ...f, location: e.target.value }))
              }
              aria-label="Filter by location"
            >
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: e.target.value }))
              }
              aria-label="Filter by type"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Role list */}
        <div className="careers__list" role="list">
          {!loading && filtered.length === 0 && (
            <div className="careers__empty">
              <p>
                No matches. Try clearing filters or searching for fewer words.
              </p>
            </div>
          )}

          {filtered.map((job) => {
            const isSaved = saved.has(job.id);
            return (
              <article key={job.id} className="careers-card" role="listitem">
                <div className="careers-card__meta">
                  <span className="careers-pill">{job.department}</span>
                  <span className="careers-dot">•</span>
                  <span>{job.location}</span>
                  <span className="careers-dot">•</span>
                  <span>{job.type}</span>
                </div>
                <h3 className="careers-card__title">{job.title}</h3>
                {job.summary && (
                  <p className="careers-card__summary">{job.summary}</p>
                )}

                <div className="careers-card__actions">
                  <button
                    className="careers-btn careers-btn--secondary careers-btn--md"
                    onClick={() => setActiveJob(job)}
                  >
                    View details
                  </button>
                  <button
                    className="careers-btn careers-btn--primary careers-btn--md"
                    onClick={() => apply(job)}
                  >
                    Apply <span className="careers-btn__icon">↗</span>
                  </button>
                  <button
                    className={"careers-save" + (isSaved ? " is-saved" : "")}
                    aria-pressed={isSaved}
                    onClick={() => toggleSave(job.id)}
                    title={isSaved ? "Remove from saved" : "Save this role"}
                  >
                    {isSaved ? "★ Saved" : "☆ Save"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Connect band */}
      <section className="careers__connect">
        <div className="careers__connect-inner">
          <div>
            <h2>Don’t see the right role?</h2>
            <p>
              We love meeting curious, kind builders. Tell us how you can help
              our mission.
            </p>
          </div>
          <a
            href="mailto:careers@speexify.com"
            className="careers-btn careers-btn--outline careers-btn--lg"
          >
            Connect with us
          </a>
        </div>
      </section>

      {/* Modal */}
      {activeJob && (
        <JobModal
          job={activeJob}
          onClose={() => setActiveJob(null)}
          onApply={apply}
        />
      )}
    </main>
  );
}

function JobModal({ job, onClose, onApply }) {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div
      className="careers-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-title"
    >
      <div className="careers-modal__backdrop" onClick={onClose} />
      <div className="careers-modal__panel" role="document">
        <header className="careers-modal__header">
          <div className="careers-modal__kicker">
            <span className="careers-pill">{job.department}</span>
            <span className="careers-dot">•</span>
            <span>{job.location}</span>
            <span className="careers-dot">•</span>
            <span>{job.type}</span>
          </div>
          <h3 id="job-title" className="careers-modal__title">
            {job.title}
          </h3>
        </header>

        <div className="careers-modal__content">
          {job.description && (
            <>
              <h4>What you’ll do</h4>
              <ul>
                {job.description.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </>
          )}

          {job.requirements && (
            <>
              <h4>What you’ll bring</h4>
              <ul>
                {job.requirements.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </>
          )}

          {job.benefits && (
            <>
              <h4>Benefits</h4>
              <ul>
                {job.benefits.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <footer className="careers-modal__footer">
          <button
            className="careers-btn careers-btn--secondary careers-btn--md"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="careers-btn careers-btn--primary careers-btn--md"
            onClick={() => onApply(job)}
          >
            Apply <span className="careers-btn__icon">↗</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

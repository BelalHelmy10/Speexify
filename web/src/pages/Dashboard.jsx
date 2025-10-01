// web/src/pages/Dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard:
// - KPI cards (upcoming/completed/total)
// - Next session card (learner + teacher version)
// - Upcoming sessions list (join with countdown, reschedule, cancel)
// - Past sessions list (status + feedback)
// - Reschedule modal
// Styling lives in web/src/styles/Dashboard.scss (imported via global.scss)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import axios from "axios";
import { fmtInTz } from "../utils/date";
import { getSafeExternalUrl } from "../utils/url";

axios.defaults.withCredentials = true;

/* ────────────────────────────────────────────────────────────────────────────
   Utilities
   ──────────────────────────────────────────────────────────────────────────── */

// Pretty datetime (browser locale; fallback for endAt)
const fmt = (d) =>
  new Date(d).toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Rule: user can join X minutes before start until end
const canJoin = (startAt, endAt, windowMins = 15) => {
  const now = new Date();
  const start = new Date(startAt);
  const end = endAt
    ? new Date(endAt)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const early = new Date(start.getTime() - windowMins * 60 * 1000);
  return now >= early && now <= end;
};

// Countdown (“Starts in 09m 13s” / “Live” / “Ended”)
// ── UI helper: countdown text (“Starts in 3d 4h 12m 05s” / “Live” / “Ended”)
const useCountdown = (startAt, endAt) => {
  const [now, setNow] = useState(Date.now());
  const timer = useRef(null);

  useEffect(() => {
    // tick every second
    timer.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer.current);
  }, []);

  if (!startAt) return "";

  const start = new Date(startAt).getTime();
  const end = endAt ? new Date(endAt).getTime() : start + 60 * 60 * 1000;

  // before start → show D/H/M/S
  if (now < start) {
    let remaining = Math.max(0, Math.floor((start - now) / 1000)); // seconds
    const days = Math.floor(remaining / 86400);
    remaining %= 86400;
    const hours = Math.floor(remaining / 3600);
    remaining %= 3600;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;

    // Build compact, left-to-right string (omit zero leading units)
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
    parts.push(`${String(secs).padStart(2, "0")}s`);

    return `Starts in ${parts.join(" ")}`;
  }

  // during session window
  if (now >= start && now <= end) return "Live";

  // after end
  return "Ended";
};

/* ────────────────────────────────────────────────────────────────────────────
   Session row (one item in upcoming/past lists)
   ──────────────────────────────────────────────────────────────────────────── */

function SessionRow({
  s,
  timezone,
  onCancel,
  onRescheduleClick,
  isUpcoming = true,
}) {
  const countdown = useCountdown(s.startAt, s.endAt);
  const joinable = canJoin(s.startAt, s.endAt);

  return (
    <div className="session-item">
      <div className="session-item__main">
        <div className="session-item__title">{s.title || "Session"}</div>
        <div className="session-item__meta">
          <span>
            {fmtInTz(s.startAt, timezone)}
            {s.endAt ? ` — ${fmt(s.endAt)}` : ""}
          </span>
          {s.status && (
            <span className={`badge badge--${s.status}`}>{s.status}</span>
          )}
          {!isUpcoming && typeof s.feedbackScore === "number" && (
            <span className="badge badge--muted">
              Feedback: {s.feedbackScore}/5
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="session-item__actions">
        {isUpcoming ? (
          <>
            {s.meetingUrl && (
              <a
                href={getSafeExternalUrl(s.meetingUrl)}
                target="_blank"
                rel="noreferrer"
                className={`btn ${joinable ? "btn--primary" : "btn--ghost"}`}
                title={joinable ? "Join now" : "Join becomes active near start"}
              >
                {joinable ? "Join session" : countdown || "Join soon"}
              </a>
            )}

            <button
              className="btn btn--ghost"
              onClick={() => onRescheduleClick(s)}
            >
              Reschedule
            </button>

            <button
              className="btn btn--ghost btn--danger"
              onClick={() => onCancel(s)}
            >
              Cancel
            </button>
          </>
        ) : (
          <a href={`/sessions/${s.id}`} className="btn btn--ghost">
            Details
          </a>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Minimal modal (inline, no deps)
   ──────────────────────────────────────────────────────────────────────────── */

function Modal({ title, children, onClose }) {
  return (
    <div className="modal">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__dialog">
        <div className="modal__head">
          <h4>{title}</h4>
          <button className="modal__close btn btn--ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  // Core status + summary
  const [status, setStatus] = useState("Loading...");
  const [summary, setSummary] = useState(null);

  // Auth + teacher summary
  const { user } = useAuth();
  const [teachSummary, setTeachSummary] = useState({
    nextTeach: null,
    upcomingTeachCount: 0,
    taughtCount: 0,
  });

  // Upcoming / Past lists
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);

  // Reschedule modal
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedSession, setReschedSession] = useState(null);
  const [newStart, setNewStart] = useState(""); // yyyy-mm-ddThh:mm (local)
  const [newEnd, setNewEnd] = useState("");

  /* ── Summary fetch (refactored so we can reuse after actions) */
  const fetchSummary = async () => {
    try {
      const res = await axios.get("http://localhost:5050/api/me/summary");
      setSummary(res.data);
      setStatus("");
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to load dashboard");
    }
  };
  useEffect(() => {
    fetchSummary();
  }, []);

  /* ── Teacher-only summary */
  useEffect(() => {
    if (!user || user.role !== "teacher") return;
    (async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:5050/api/teacher/summary"
        );
        setTeachSummary({
          nextTeach: data?.nextTeach || null,
          upcomingTeachCount: data?.upcomingTeachCount || 0,
          taughtCount: data?.taughtCount || 0,
        });
      } catch (e) {
        console.warn(
          "teacher summary failed",
          e?.response?.data || e?.message || e
        );
        setTeachSummary({
          nextTeach: null,
          upcomingTeachCount: 0,
          taughtCount: 0,
        });
      }
    })();
  }, [user]);

  /* ── Sessions fetch (defensive against different JSON shapes) */
  const fetchSessions = async () => {
    try {
      const [u, p] = await Promise.all([
        axios.get("http://localhost:5050/api/me/sessions", {
          params: { range: "upcoming", limit: 10 },
        }),
        axios.get("http://localhost:5050/api/me/sessions", {
          params: { range: "past", limit: 10 },
        }),
      ]);

      const pickList = (payload, preferredKey) => {
        const d = payload?.data;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.[preferredKey])) return d[preferredKey];
        if (Array.isArray(d?.sessions)) return d.sessions;
        if (Array.isArray(d?.data)) return d.data;
        return [];
      };

      setUpcoming(pickList(u, "upcoming"));
      setPast(pickList(p, "past"));
    } catch (e) {
      console.warn(
        "sessions fetch failed",
        e?.response?.data || e?.message || e
      );
    }
  };
  useEffect(() => {
    fetchSessions();
  }, []);

  /* ── Cancel */
  const handleCancel = async (s) => {
    if (!window.confirm("Cancel this session?")) return;
    try {
      await axios.post(`http://localhost:5050/api/sessions/${s.id}/cancel`);
      await Promise.all([fetchSessions(), fetchSummary()]); // refresh lists + next card
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to cancel");
    }
  };

  /* ── Open reschedule modal (prefill existing times) */
  const openReschedule = (s) => {
    setReschedSession(s);
    const toLocalInput = (iso) => new Date(iso).toISOString().slice(0, 16);
    setNewStart(toLocalInput(s.startAt));
    setNewEnd(s.endAt ? toLocalInput(s.endAt) : "");
    setReschedOpen(true);
  };

  /* ── Confirm reschedule */
  const submitReschedule = async () => {
    if (!reschedSession) return;
    try {
      await axios.post(
        `http://localhost:5050/api/sessions/${reschedSession.id}/reschedule`,
        {
          startAt: new Date(newStart).toISOString(),
          endAt: newEnd ? new Date(newEnd).toISOString() : null,
        }
      );
      setReschedOpen(false);
      setReschedSession(null);
      await Promise.all([fetchSessions(), fetchSummary()]); // refresh lists + next card
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to reschedule");
    }
  };

  /* ── Loading state */
  if (status) return <p>{status}</p>;
  if (!summary) return null;

  // Guard: do not show canceled as "next"
  const visibleNext =
    summary?.nextSession?.status === "canceled" ? null : summary?.nextSession;

  const { upcomingCount, completedCount } = summary;

  return (
    <div className="container-narrow dashboard">
      {/* Title */}
      <h2>Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid-3">
        <Card title="Upcoming" value={upcomingCount} />
        <Card title="Completed" value={completedCount} />
        <Card title="Total" value={upcomingCount + completedCount} />
      </div>

      {/* Teacher: Next to teach */}
      {user?.role === "teacher" && (
        <div className="panel">
          <h3>Next session to teach</h3>
          {!teachSummary.nextTeach ? (
            <p>No upcoming teaching sessions.</p>
          ) : (
            <>
              <p className="muted-gap">
                <strong>{teachSummary.nextTeach.title}</strong>
              </p>
              <p className="muted-gap">
                {fmtInTz(teachSummary.nextTeach.startAt, summary?.timezone)}
                {teachSummary.nextTeach.endAt
                  ? ` — ${fmt(teachSummary.nextTeach.endAt)}`
                  : ""}
              </p>
              <p className="muted-text">
                Learner:&nbsp;
                {teachSummary.nextTeach.user?.name
                  ? `${teachSummary.nextTeach.user.name} — ${teachSummary.nextTeach.user.email}`
                  : teachSummary.nextTeach.user?.email || "—"}
              </p>
              <div className="button-row">
                {teachSummary.nextTeach.meetingUrl &&
                canJoin(
                  teachSummary.nextTeach.startAt,
                  teachSummary.nextTeach.endAt
                ) ? (
                  <a
                    href={teachSummary.nextTeach.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--primary"
                  >
                    Join session
                  </a>
                ) : (
                  <a href="/calendar" className="btn btn--ghost">
                    View calendar
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Learner/Admin: Next session */}
      <div className="panel">
        <h3>Next session</h3>
        {!visibleNext ? (
          <p>No upcoming sessions yet.</p>
        ) : (
          <>
            <p className="muted-gap">
              <strong>{visibleNext.title}</strong>
            </p>
            <p className="muted-gap">
              {fmtInTz(visibleNext.startAt, summary?.timezone)}
              {visibleNext.endAt ? ` — ${fmt(visibleNext.endAt)}` : ""}
            </p>
            <div className="button-row">
              {visibleNext.meetingUrl &&
              canJoin(visibleNext.startAt, visibleNext.endAt) ? (
                <a
                  href={visibleNext.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--primary"
                >
                  Join session
                </a>
              ) : (
                <a href="/calendar" className="btn btn--ghost">
                  View calendar
                </a>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="panel">
        <div className="panel__head">
          <h3>Upcoming sessions</h3>
          <a href="/calendar" className="btn btn--ghost">
            Open calendar
          </a>
        </div>
        {upcoming.length === 0 ? (
          <p>No upcoming sessions.</p>
        ) : (
          <div className="session-list">
            {upcoming.map((s) => (
              <SessionRow
                key={s.id}
                s={s}
                timezone={summary?.timezone}
                isUpcoming
                onCancel={handleCancel}
                onRescheduleClick={openReschedule}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      <div className="panel">
        <div className="panel__head">
          <h3>Past sessions</h3>
          <a href="/calendar" className="btn btn--ghost">
            View all
          </a>
        </div>
        {past.length === 0 ? (
          <p>No past sessions.</p>
        ) : (
          <div className="session-list">
            {past.map((s) => (
              <SessionRow
                key={s.id}
                s={s}
                timezone={summary?.timezone}
                isUpcoming={false}
                onCancel={() => {}}
                onRescheduleClick={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reschedule modal */}
      {reschedOpen && (
        <Modal title="Reschedule session" onClose={() => setReschedOpen(false)}>
          <div className="form-grid">
            <label>
              <span>Start (local)</span>
              <input
                type="datetime-local"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
              />
            </label>
            <label>
              <span>End (local)</span>
              <input
                type="datetime-local"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
              />
            </label>
          </div>
          <div className="button-row">
            <button
              className="btn btn--ghost"
              onClick={() => setReschedOpen(false)}
            >
              Cancel
            </button>
            <button className="btn btn--primary" onClick={submitReschedule}>
              Save changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   KPI card
   ──────────────────────────────────────────────────────────────────────────── */
function Card({ title, value }) {
  return (
    <div className="card card--kpi">
      <div className="card__title">{title}</div>
      <div className="card__value">{value}</div>
    </div>
  );
}

import { useEffect, useState } from "react";
import axios from "axios";
import { fmtInTz } from "../utils/date";
axios.defaults.withCredentials = true;

const fmt = (d) =>
  new Date(d).toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const canJoin = (startAt, endAt, windowMins = 15) => {
  const now = new Date();
  const start = new Date(startAt);
  const end = endAt
    ? new Date(endAt)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const early = new Date(start.getTime() - windowMins * 60 * 1000);
  return now >= early && now <= end;
};

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:5050/api/me/summary");
        setSummary(res.data);
        setStatus("");
      } catch (e) {
        setStatus(e.response?.data?.error || "Failed to load dashboard");
      }
    })();
  }, []);

  if (status) return <p>{status}</p>;
  if (!summary) return null;

  const { nextSession, upcomingCount, completedCount } = summary;

  return (
    <div className="container-narrow">
      <h2>Dashboard</h2>

      {/* Stats cards */}
      <div className="grid-3">
        <Card title="Upcoming" value={upcomingCount} />
        <Card title="Completed" value={completedCount} />
        <Card title="Total" value={upcomingCount + completedCount} />
      </div>

      {/* Next session */}
      <div className="panel">
        <h3>Next session</h3>
        {!nextSession ? (
          <p>No upcoming sessions yet.</p>
        ) : (
          <>
            <p style={{ margin: "4px 0" }}>
              <strong>{nextSession.title}</strong>
            </p>
            <p style={{ margin: "4px 0" }}>
              {fmtInTz(nextSession.startAt, summary?.timezone)}
              {nextSession.endAt ? ` — ${fmt(nextSession.endAt)}` : ""}
            </p>
            <div className="button-row">
              {nextSession.meetingUrl &&
              canJoin(nextSession.startAt, nextSession.endAt) ? (
                <a
                  href={nextSession.meetingUrl}
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
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="card">
      <div className="card__title">{title}</div>
      <div className="card__value">{value}</div>
    </div>
  );
}

export default Dashboard;

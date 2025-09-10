import { useEffect, useState } from "react";
import axios from "axios";
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

// show "Join" if within X minutes of start (or already started but not ended)
const canJoin = (startAt, endAt, windowMins = 15) => {
  const now = new Date();
  const start = new Date(startAt);
  const end = endAt
    ? new Date(endAt)
    : new Date(start.getTime() + 60 * 60 * 1000); // default 1h
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
    <div style={{ maxWidth: 760 }}>
      <h2>Dashboard</h2>

      {/* Stats cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Card title="Upcoming" value={upcomingCount} />
        <Card title="Completed" value={completedCount} />
        <Card title="Total" value={upcomingCount + completedCount} />
      </div>

      {/* Next session */}
      <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Next session</h3>
        {!nextSession ? (
          <p>No upcoming sessions yet.</p>
        ) : (
          <>
            <p style={{ margin: "4px 0" }}>
              <strong>{nextSession.title}</strong>
            </p>
            <p style={{ margin: "4px 0" }}>
              {fmt(nextSession.startAt)}
              {nextSession.endAt ? ` — ${fmt(nextSession.endAt)}` : ""}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {nextSession.meetingUrl &&
              canJoin(nextSession.startAt, nextSession.endAt) ? (
                <a
                  href={nextSession.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={btnStyle}
                >
                  Join session
                </a>
              ) : (
                <a href="/calendar" style={btnGhost}>
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
    <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const btnStyle = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 8,
  background: "#0ea5e9",
  color: "white",
  textDecoration: "none",
  fontWeight: 600,
};

const btnGhost = {
  ...btnStyle,
  background: "transparent",
  color: "#0ea5e9",
  border: "1px solid #0ea5e9",
};

export default Dashboard;

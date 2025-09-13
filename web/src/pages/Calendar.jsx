import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import { fmtInTz } from "../utils/date";

axios.defaults.withCredentials = true;

// timezone-safe day compare
const sameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

export default function CalendarPage() {
  const [value, setValue] = useState(new Date()); // selected day
  const [events, setEvents] = useState([]); // all sessions
  const [dayEvents, setDayEvents] = useState([]); // sessions for selected day
  const [error, setError] = useState("");
  // who am I? (role-aware)
  const { user } = useAuth();
  // separate store for teacher-assigned sessions
  const [teachEvents, setTeachEvents] = useState([]);
  // which tab to show (if teacher): 'learn' | 'teach'
  const [tab, setTab] = useState("learn");

  // load sessions from API
  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await axios.get("http://localhost:5050/api/sessions");
        const mapped = res.data.map((s) => ({
          ...s,
          startAt: new Date(s.startAt),
          endAt: s.endAt ? new Date(s.endAt) : null,
        }));
        setEvents(mapped);
      } catch (e) {
        setError(e.response?.data?.error || "Failed to load sessions");
      }
    })();
  }, []);

  // load teacher-assigned sessions only if I'm a teacher
  useEffect(() => {
    if (!user || user.role !== "teacher") {
      setTeachEvents([]);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(
          "http://localhost:5050/api/teacher/sessions"
        );
        const mapped = res.data.map((s) => ({
          ...s,
          startAt: new Date(s.startAt),
          endAt: s.endAt ? new Date(s.endAt) : null,
        }));
        setTeachEvents(mapped);
      } catch (e) {
        // do not clobber learner errors; just show nothing on teacher tab
        console.warn("Failed to load teacher sessions", e?.response?.data || e);
        setTeachEvents([]);
      }
    })();
  }, [user]);

  // recompute selected-day events based on current tab
  useEffect(() => {
    const source =
      user?.role === "teacher" && tab === "teach" ? teachEvents : events;
    setDayEvents(source.filter((e) => sameDay(e.startAt, value)));
  }, [events, teachEvents, value, user, tab]);

  return (
    <div className="container-narrow">
      <h2>Calendar</h2>
      {error && (
        <p className="badge" style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      {/* Teacher/Learner toggle (only for teacher role) */}
      {user?.role === "teacher" && (
        <div className="button-row" style={{ margin: "8px 0 16px" }}>
          <button
            type="button"
            className={`btn ${tab === "learn" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setTab("learn")}
          >
            As learner
          </button>
          <button
            type="button"
            className={`btn ${tab === "teach" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setTab("teach")}
            style={{ marginLeft: 8 }}
          >
            As teacher
          </button>
        </div>
      )}

      <div className="calendar-wrap">
        {/* Left: month calendar with dots on days that have sessions */}
        <Calendar
          value={value}
          onChange={setValue}
          showNeighboringMonth={false} // cleaner look (optional)
          tileContent={({ date }) => {
            const source =
              user?.role === "teacher" && tab === "teach"
                ? teachEvents
                : events;
            const has = source.some((e) => sameDay(e.startAt, date));
            return has ? <span className="cal-dot" /> : null;
          }}
        />

        {/* Right: selected-day details */}
        <div className="day-panel">
          <div className="day-title">
            <div className="date">{format(value, "EEEE, MMM d")}</div>
            <span className="count">
              {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
            </span>
          </div>

          {dayEvents.length === 0 ? (
            <p>No sessions for this day.</p>
          ) : (
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {dayEvents.map((e) => (
                <li key={e.id} className="event">
                  <div className="title">{e.title}</div>
                  <div className="time">
                    {format(e.startAt, "p")}
                    {e.endAt ? ` – ${format(e.endAt, "p")}` : ""}
                  </div>
                  {/* extra context line */}
                  {user?.role === "teacher" && tab === "teach" ? (
                    // I'm looking at my teaching assignments → show learner
                    <div className="meta">
                      Learner:{" "}
                      {e.user?.name
                        ? `${e.user.name} — ${e.user.email}`
                        : e.user?.email || "—"}
                    </div>
                  ) : (
                    // learner view → show teacher if any
                    e.teacher && (
                      <div className="meta">
                        Teacher:{" "}
                        {e.teacher.name
                          ? `${e.teacher.name} — ${e.teacher.email}`
                          : e.teacher.email}
                      </div>
                    )
                  )}

                  {e.meetingUrl && (
                    <a
                      href={e.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn--primary"
                      style={{ marginTop: 6 }}
                    >
                      Join
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

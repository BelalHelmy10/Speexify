import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import axios from "axios";
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

  // recompute selected-day events
  useEffect(() => {
    setDayEvents(events.filter((e) => sameDay(e.startAt, value)));
  }, [events, value]);

  return (
    <div className="container-narrow">
      <h2>Calendar</h2>
      {error && (
        <p className="badge" style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      <div className="calendar-wrap">
        {/* Left: month calendar with dots on days that have sessions */}
        <Calendar
          value={value}
          onChange={setValue}
          showNeighboringMonth={false} // cleaner look (optional)
          tileContent={({ date }) => {
            const has = events.some((e) => sameDay(e.startAt, date));
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

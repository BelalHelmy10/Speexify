import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format, isSameDay } from "date-fns";
import axios from "axios";
axios.defaults.withCredentials = true;

function CalendarPage() {
  const [value, setValue] = useState(new Date());
  const [events, setEvents] = useState([]); // will load from API in step 3
  const [dayEvents, setDayEvents] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await axios.get("http://localhost:5050/api/sessions");
      setEvents(
        res.data.map((s) => ({
          ...s,
          startAt: new Date(s.startAt),
          endAt: s.endAt ? new Date(s.endAt) : null,
        }))
      );
    })();
  }, []);

  useEffect(() => {
    setDayEvents(events.filter((e) => isSameDay(new Date(e.startAt), value)));
  }, [events, value]);

  return (
    <div>
      <h2>Calendar</h2>

      <div
        style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }}
      >
        <Calendar
          value={value}
          onChange={setValue}
          tileContent={({ date }) => {
            const has = events.some((e) =>
              isSameDay(new Date(e.startAt), date)
            );
            return has ? <span style={{ color: "#0070f3" }}> •</span> : null;
          }}
        />

        <div>
          <h3>{format(value, "EEEE, MMM d")}</h3>
          {dayEvents.length === 0 ? (
            <p>No sessions for this day.</p>
          ) : (
            <ul>
              {dayEvents.map((e) => (
                <li key={e.id} style={{ marginBottom: 8 }}>
                  <strong>{e.title}</strong>
                  <div>{format(new Date(e.startAt), "p")}</div>
                  {e.meetingUrl && (
                    <a href={e.meetingUrl} target="_blank" rel="noreferrer">
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

export default CalendarPage;

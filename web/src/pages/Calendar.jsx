// web/src/pages/Calendar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Left: mini month (react-calendar) for quick navigation.
// Right: React Big Calendar (Month/Week/Day/Agenda)
// - Fetches /api/me/sessions-between?start&end&includeCanceled=true
// - Blue = scheduled, Red = canceled
// - Click event → "join" meeting link
// - Clean, centered Week/Day headers via formats.dayFormat
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import axios from "axios";
import MiniCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import {
  parse,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  getDay,
  format,
} from "date-fns";

import { getSafeExternalUrl } from "../utils/url";

axios.defaults.withCredentials = true;

// date-fns localizer for RBC
const locales = {};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
});

// Map backend sessions → RBC events
const toRbcEvents = (arr = []) =>
  arr.map((s) => ({
    id: String(s.id),
    title: s.title || "Session",
    start: new Date(s.startAt),
    end: s.endAt ? new Date(s.endAt) : new Date(s.startAt),
    status: s.status, // "scheduled" | "canceled"
    meetingUrl: s.meetingUrl || "",
  }));

// Compute visible range for a given date + view
function getVisibleRange(date, view) {
  if (view === "week") {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }),
      end: endOfWeek(date, { weekStartsOn: 1 }),
    };
  }
  if (view === "day") {
    return { start: startOfDay(date), end: endOfDay(date) };
  }
  // month (include leading/trailing days that show in the grid)
  return {
    start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
  };
}

export default function CalendarPage() {
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // control view to refetch on change
  const calRef = useRef(null);

  // Fetch sessions for a range
  const fetchEvents = useCallback(async (startISO, endISO) => {
    setError("");
    const { data } = await axios.get(
      "http://localhost:5050/api/me/sessions-between",
      { params: { start: startISO, end: endISO, includeCanceled: true } }
    );
    return Array.isArray(data) ? data : data?.sessions || [];
  }, []);

  // Load events whenever date or view changes
  useEffect(() => {
    const { start, end } = getVisibleRange(currentDate, view);
    (async () => {
      try {
        const sessions = await fetchEvents(
          start.toISOString(),
          end.toISOString()
        );
        setEvents(toRbcEvents(sessions));
      } catch (e) {
        setError(e?.response?.data?.error || "Failed to load sessions");
      }
    })();
  }, [currentDate, view, fetchEvents]);

  // Also handle RBC's range notifications (toolbar navigation)
  const handleRangeChange = useCallback(
    async (range) => {
      try {
        let start, end;
        if (Array.isArray(range)) {
          start = range[0];
          end = range[range.length - 1];
        } else if (range?.start && range?.end) {
          start = range.start;
          end = range.end;
        } else {
          const r = getVisibleRange(currentDate, view);
          start = r.start;
          end = r.end;
        }
        const sessions = await fetchEvents(
          start.toISOString(),
          end.toISOString()
        );
        setEvents(toRbcEvents(sessions));
      } catch (e) {
        setError(e?.response?.data?.error || "Failed to load sessions");
      }
    },
    [currentDate, view, fetchEvents]
  );

  // Event style: blue for scheduled, red & line-through for canceled
  const eventPropGetter = useCallback((event) => {
    const isCanceled = event.status === "canceled";
    const style = {
      backgroundColor: isCanceled ? "#ef4444" : "#0ea5e9",
      border: "none",
      color: "#fff",
      borderRadius: "10px",
      padding: "2px 8px",
      opacity: isCanceled ? 0.95 : 1,
      textDecoration: isCanceled ? "line-through" : "none",
    };
    return { style, className: isCanceled ? "ev--canceled" : "ev--scheduled" };
  }, []);

  // Custom event component: dot + title
  const EventComp = useCallback(({ event }) => {
    return (
      <div className="ev-pill">
        <span className="ev-dot" />
        <span className="ev-title">{event.title}</span>
      </div>
    );
  }, []);

  // Click → join link
  const onSelectEvent = useCallback((event) => {
    const choice = window.prompt(
      `${event.title}\nStatus: ${event.status}\n\nType: "join" to open link, anything else to close.`,
      "join"
    );
    if (choice && choice.toLowerCase().startsWith("join")) {
      const url = getSafeExternalUrl(event.meetingUrl);
      if (!url) return alert("No valid meeting link.");
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  // Mini calendar → jump date
  const onMiniChange = (date) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  // Components (no custom header now)
  const components = useMemo(() => ({ event: EventComp }), [EventComp]);

  return (
    <div className="container-wide calendar-two-pane">
      {error && (
        <p className="badge" style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      <div className="calendar-two-pane__wrap">
        {/* Left: mini navigator */}
        <div className="calendar-two-pane__left">
          <MiniCalendar
            value={selectedDate}
            onChange={onMiniChange}
            showNeighboringMonth={false}
            next2Label={null}
            prev2Label={null}
            className="mini-cal"
          />
          <p className="mini-legend">
            <span className="dot dot--blue" /> scheduled
            <span className="dot dot--red" /> canceled
          </p>
        </div>

        {/* Right: RBC */}
        <div className="calendar-two-pane__right">
          <BigCalendar
            ref={calRef}
            localizer={localizer}
            date={currentDate}
            view={view}
            onView={(v) => setView(v)}
            onNavigate={(d) => setCurrentDate(d)}
            onRangeChange={handleRangeChange}
            events={events}
            startAccessor="start"
            endAccessor="end"
            components={components}
            eventPropGetter={eventPropGetter}
            views={["month", "week", "day", "agenda"]}
            defaultView="month"
            drilldownView="day"
            popup
            step={30}
            timeslots={2}
            min={new Date(1970, 1, 1, 0, 0, 0)}
            max={new Date(1970, 1, 1, 23, 59, 59)}
            scrollToTime={new Date(1970, 1, 1, 8, 0, 0)}
            // Clean header text like "Mon 23"
            formats={{
              dayFormat: (date, culture, lzr) => lzr.format(date, "EEE d"),
            }}
            style={{ height: 760 }}
            toolbar
          />
        </div>
      </div>
    </div>
  );
}

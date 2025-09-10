import { useEffect, useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    userId: "",
    title: "",
    date: "",
    startTime: "",
    duration: "60", // default 60 minutes
    endTime: "", // optional alternative to duration
    meetingUrl: "",
    notes: "",
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          "http://localhost:5050/api/users?role=learner"
        );
        setUsers(res.data);
      } catch (e) {
        setStatus(e.response?.data?.error || "Failed to load users");
      }
    })();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("Saving...");

    try {
      const payload = {
        userId: Number(form.userId),
        title: form.title.trim(),
        date: form.date, // "YYYY-MM-DD"
        startTime: form.startTime, // "HH:MM"
        duration: form.endTime ? undefined : Number(form.duration),
        endTime: form.endTime || undefined, // "HH:MM" or undefined
        meetingUrl: form.meetingUrl || undefined,
        notes: form.notes || undefined,
      };

      const res = await axios.post(
        "http://localhost:5050/api/sessions",
        payload
      );
      setStatus("Created ✓");

      // reset (keep date to add more quickly)
      setForm((f) => ({
        ...f,
        title: "",
        startTime: "",
        meetingUrl: "",
        notes: "",
      }));
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to create session");
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <h2>Admin — Create Session</h2>
      {status && <p>{status}</p>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Learner *
          <select
            name="userId"
            value={form.userId}
            onChange={onChange}
            required
          >
            <option value="">Select a learner…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ? `${u.name} — ${u.email}` : u.email}
              </option>
            ))}
          </select>
        </label>

        <label>
          Title *
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="Speaking A2 — Intro"
            required
          />
        </label>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <label>
            Date *
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={onChange}
              required
            />
          </label>
          <label>
            Start time *
            <input
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={onChange}
              required
            />
          </label>
        </div>

        <fieldset style={{ border: "1px solid #eee", padding: 12 }}>
          <legend>End time or duration</legend>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <label>
              End time
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={(e) => {
                  // if you set endTime, clear duration (optional behavior)
                  setForm((f) => ({ ...f, endTime: e.target.value }));
                }}
              />
            </label>
            <label>
              Duration (mins)
              <input
                type="number"
                name="duration"
                min="15"
                step="15"
                value={form.duration}
                onChange={onChange}
                disabled={!!form.endTime}
              />
            </label>
          </div>
        </fieldset>

        <label>
          Meeting link
          <input
            name="meetingUrl"
            value={form.meetingUrl}
            onChange={onChange}
            placeholder="https://zoom.us/..."
          />
        </label>

        <label>
          Notes
          <textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            rows={3}
            placeholder="Anything the learner should prepare…"
          />
        </label>

        <button type="submit">Create session</button>
      </form>
    </div>
  );
}

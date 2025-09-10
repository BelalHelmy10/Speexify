import { useEffect, useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;

function Admin() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("");

  // ----- create form state -----
  const [form, setForm] = useState({
    userId: "",
    title: "",
    date: "",
    startTime: "",
    duration: "60",
    endTime: "",
    meetingUrl: "",
    notes: "",
  });

  // ----- sessions table state -----
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    duration: "60",
    meetingUrl: "",
    notes: "",
    userId: "",
  });

  // Load learners + sessions
  useEffect(() => {
    (async () => {
      try {
        const [u, s] = await Promise.all([
          axios.get("http://localhost:5050/api/users?role=learner"),
          axios.get("http://localhost:5050/api/admin/sessions"),
        ]);
        setUsers(u.data);
        setSessions(s.data);
      } catch (e) {
        setStatus(e.response?.data?.error || "Failed to load admin data");
      }
    })();
  }, []);

  // ------------- helpers -------------
  const toDateInput = (iso) => {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const toTimeInput = (iso) => {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mi}`;
  };

  const fmt = (iso) =>
    new Date(iso).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ------------- create handlers -------------
  const onCreateChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const createSession = async (e) => {
    e.preventDefault();
    setStatus("Saving...");
    try {
      const payload = {
        userId: Number(form.userId),
        title: form.title.trim(),
        date: form.date,
        startTime: form.startTime,
        duration: form.endTime ? undefined : Number(form.duration),
        endTime: form.endTime || undefined,
        meetingUrl: form.meetingUrl || undefined,
        notes: form.notes || undefined,
      };
      await axios.post("http://localhost:5050/api/sessions", payload);
      setStatus("Created ✓");
      // reload sessions
      const s = await axios.get("http://localhost:5050/api/admin/sessions");
      setSessions(s.data);

      // reset minimal
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

  // ------------- edit handlers -------------
  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({
      title: row.title || "",
      date: toDateInput(row.startAt),
      startTime: toTimeInput(row.startAt),
      endTime: row.endAt ? toTimeInput(row.endAt) : "",
      duration: row.endAt ? "" : "60",
      meetingUrl: row.meetingUrl || "",
      notes: row.notes || "",
      userId: String(row.user?.id || ""),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  const saveEdit = async (id) => {
    setStatus("Saving...");
    try {
      const payload = {
        title: editForm.title.trim(),
        date: editForm.date,
        startTime: editForm.startTime,
        endTime: editForm.endTime || undefined,
        duration: editForm.endTime
          ? undefined
          : Number(editForm.duration || 60),
        meetingUrl: editForm.meetingUrl || null,
        notes: editForm.notes || null,
        userId: editForm.userId ? Number(editForm.userId) : undefined,
      };
      await axios.patch(`http://localhost:5050/api/sessions/${id}`, payload);
      setStatus("Updated ✓");
      setEditingId(null);
      const s = await axios.get("http://localhost:5050/api/admin/sessions");
      setSessions(s.data);
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to update session");
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    setStatus("Deleting...");
    try {
      await axios.delete(`http://localhost:5050/api/sessions/${id}`);
      setStatus("Deleted ✓");
      setSessions((rows) => rows.filter((r) => r.id !== id));
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to delete session");
    }
  };

  // ------------- UI -------------
  return (
    <div className="container-narrow">
      <h2>Admin</h2>
      {status && <p className="badge">{status}</p>}

      {/* CREATE FORM */}
      <section className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Create session</h3>
        <form
          onSubmit={createSession}
          className="form"
          style={{ maxWidth: 560 }}
        >
          <div>
            <label htmlFor="userId">Learner *</label>
            <select
              id="userId"
              name="userId"
              value={form.userId}
              onChange={onCreateChange}
              required
            >
              <option value="">Select a learner…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ? `${u.name} — ${u.email}` : u.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={onCreateChange}
              required
            />
          </div>

          <div className="form form--2col">
            <div>
              <label htmlFor="date">Date *</label>
              <input
                id="date"
                type="date"
                name="date"
                value={form.date}
                onChange={onCreateChange}
                required
              />
            </div>
            <div>
              <label htmlFor="startTime">Start time *</label>
              <input
                id="startTime"
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={onCreateChange}
                required
              />
            </div>
          </div>

          <div className="panel" style={{ padding: 12 }}>
            <div className="form form--2col">
              <div>
                <label htmlFor="endTime">End time</label>
                <input
                  id="endTime"
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={onCreateChange}
                />
              </div>
              <div>
                <label htmlFor="duration">Duration (mins)</label>
                <input
                  id="duration"
                  type="number"
                  name="duration"
                  min="15"
                  step="15"
                  value={form.duration}
                  onChange={onCreateChange}
                  disabled={!!form.endTime}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="meetingUrl">Meeting link</label>
            <input
              id="meetingUrl"
              name="meetingUrl"
              value={form.meetingUrl}
              onChange={onCreateChange}
              placeholder="https://…"
            />
          </div>

          <div>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={onCreateChange}
              rows={3}
            />
          </div>

          <div className="actions">
            <button type="submit" className="btn btn--primary">
              Create session
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  title: "",
                  startTime: "",
                  meetingUrl: "",
                  notes: "",
                }))
              }
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {/* SESSIONS TABLE */}
      <section className="panel">
        <h3 style={{ marginTop: 0 }}>All sessions</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Learner</th>
                <th>Title</th>
                <th>Start</th>
                <th>End</th>
                <th>Meeting</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) =>
                editingId === s.id ? (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>
                      <select
                        name="userId"
                        value={editForm.userId}
                        onChange={onEditChange}
                      >
                        <option value="">(keep current)</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name ? `${u.name} — ${u.email}` : u.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        name="title"
                        value={editForm.title}
                        onChange={onEditChange}
                      />
                    </td>
                    <td>
                      <div className="form form--2col">
                        <input
                          type="date"
                          name="date"
                          value={editForm.date}
                          onChange={onEditChange}
                        />
                        <input
                          type="time"
                          name="startTime"
                          value={editForm.startTime}
                          onChange={onEditChange}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="form form--2col">
                        <input
                          type="time"
                          name="endTime"
                          value={editForm.endTime}
                          onChange={onEditChange}
                        />
                        <input
                          type="number"
                          name="duration"
                          min="15"
                          step="15"
                          value={editForm.duration}
                          onChange={onEditChange}
                          disabled={!!editForm.endTime}
                          placeholder="mins"
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        name="meetingUrl"
                        value={editForm.meetingUrl}
                        onChange={onEditChange}
                      />
                    </td>
                    <td>
                      <div className="button-row">
                        <button
                          className="btn btn--primary"
                          onClick={() => saveEdit(s.id)}
                        >
                          Save
                        </button>
                        <button className="btn btn--ghost" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>
                      {s.user?.name
                        ? `${s.user.name} — ${s.user.email}`
                        : s.user?.email}
                    </td>
                    <td>{s.title}</td>
                    <td>{fmt(s.startAt)}</td>
                    <td>{s.endAt ? fmt(s.endAt) : "-"}</td>
                    <td>
                      {s.meetingUrl ? (
                        <a href={s.meetingUrl} target="_blank" rel="noreferrer">
                          Link
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <div className="button-row">
                        <button
                          className="btn btn--ghost"
                          onClick={() => startEdit(s)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--primary"
                          onClick={() => deleteSession(s.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 12, color: "#777" }}>
                    No sessions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Admin;

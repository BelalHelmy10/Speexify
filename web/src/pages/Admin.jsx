import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "../styles/admin.scss";

axios.defaults.withCredentials = true;

function Admin() {
  const [status, setStatus] = useState("");

  // Data
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Create form
  const [form, setForm] = useState({
    userId: "",
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    duration: "60",
    meetingUrl: "",
    notes: "",
  });

  // Edit form
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    userId: "",
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    duration: "60",
    meetingUrl: "",
    notes: "",
  });

  // ---------- helpers ----------
  const toDateInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const toTimeInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
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

  // ---------- load users once ----------
  useEffect(() => {
    (async () => {
      try {
        const u = await axios.get(
          "http://localhost:5050/api/users?role=learner"
        );
        setUsers(u.data || []);
      } catch (e) {
        setStatus(e.response?.data?.error || "Failed to load learners");
      }
    })();
  }, []);

  // ---------- debounce search ----------
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // ---------- sessions fetching with filters ----------
  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (qDebounced.trim()) p.set("q", qDebounced.trim());
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("limit", "50");
    p.set("offset", "0");
    return p.toString();
  }, [qDebounced, from, to]);

  const normalizeSessionsResponse = (data) => {
    if (Array.isArray(data)) return { items: data, total: data.length };
    return {
      items: data?.items || [],
      total:
        typeof data?.total === "number"
          ? data.total
          : data?.items
          ? data.items.length
          : 0,
    };
  };

  const reloadSessions = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `http://localhost:5050/api/admin/sessions?${params}`
      );
      const { items, total } = normalizeSessionsResponse(data);
      setSessions(items);
      setTotal(total);
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // ---------- create ----------
  const onCreateChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const createSession = async (e) => {
    e.preventDefault();
    setStatus("Saving…");
    try {
      const payload = {
        userId: Number(form.userId),
        title: form.title.trim(),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime || undefined,
        duration: form.endTime ? undefined : Number(form.duration || 60),
        meetingUrl: form.meetingUrl || undefined,
        notes: form.notes || undefined,
      };
      await axios.post("http://localhost:5050/api/sessions", payload);
      setStatus("Created ✓");
      await reloadSessions();
      setForm((f) => ({
        ...f,
        title: "",
        startTime: "",
        endTime: "",
        duration: "60",
        meetingUrl: "",
        notes: "",
      }));
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to create session");
    }
  };

  // ---------- edit ----------
  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({
      userId: String(row.user?.id || ""),
      title: row.title || "",
      date: toDateInput(row.startAt),
      startTime: toTimeInput(row.startAt),
      endTime: row.endAt ? toTimeInput(row.endAt) : "",
      duration: row.endAt ? "" : "60",
      meetingUrl: row.meetingUrl || "",
      notes: row.notes || "",
    });
  };

  const cancelEdit = () => setEditingId(null);

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  const updateSession = async (id) => {
    setStatus("Updating…");
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
      await reloadSessions();
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to update session");
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    setStatus("Deleting…");
    try {
      await axios.delete(`http://localhost:5050/api/sessions/${id}`);
      setStatus("Deleted ✓");
      setSessions((rows) => rows.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to delete session");
    }
  };

  return (
    <div className="admin">
      <header className="admin__header">
        <h1 className="admin__title">Admin</h1>
        {status && <span className="admin__status">{status}</span>}
      </header>

      {/* Create */}
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Create session</h2>
        </div>

        <form onSubmit={createSession} className="form form--grid">
          <div className="field">
            <label className="label" htmlFor="userId">
              Learner *
            </label>
            <select
              id="userId"
              name="userId"
              className="select"
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

          <div className="field">
            <label className="label" htmlFor="title">
              Title *
            </label>
            <input
              id="title"
              name="title"
              className="input"
              value={form.title}
              onChange={onCreateChange}
              required
            />
          </div>

          <div className="field">
            <label className="label">Date & start</label>
            <div className="form--row2">
              <input
                type="date"
                name="date"
                className="input"
                value={form.date}
                onChange={onCreateChange}
                required
              />
              <input
                type="time"
                name="startTime"
                className="input"
                value={form.startTime}
                onChange={onCreateChange}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">End time OR duration (mins)</label>
            <div className="form--row2">
              <input
                type="time"
                name="endTime"
                className="input"
                value={form.endTime}
                onChange={onCreateChange}
              />
              <input
                type="number"
                name="duration"
                min="15"
                step="15"
                className="input"
                value={form.duration}
                onChange={onCreateChange}
                disabled={!!form.endTime}
                placeholder="mins"
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="meetingUrl">
              Meeting link
            </label>
            <input
              id="meetingUrl"
              name="meetingUrl"
              className="input"
              value={form.meetingUrl}
              onChange={onCreateChange}
              placeholder="https://…"
            />
          </div>

          <div className="field field--notes">
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              className="textarea"
              value={form.notes}
              onChange={onCreateChange}
              rows={3}
            />
          </div>

          <div className="actions actions--right">
            <button className="btn btn--primary" type="submit">
              Create
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  title: "",
                  startTime: "",
                  endTime: "",
                  duration: "60",
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

      {/* List */}
      <section className="card">
        <div className="card__header card__header--row">
          <h2 className="card__title">All sessions</h2>
          <div className="filters">
            <input
              type="text"
              className="input input--search"
              placeholder="Search by user email/name or title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search"
            />
            <input
              type="date"
              className="input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="From date"
            />
            <input
              type="date"
              className="input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To date"
            />
          </div>
        </div>

        <div className="meta">
          {loading ? "Loading…" : `Showing ${sessions.length} of ${total}`}
        </div>

        <div className="table">
          <div className="table__scroll">
            <table>
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
                    <tr key={s.id} className="is-editing">
                      <td>{s.id}</td>
                      <td>
                        <select
                          name="userId"
                          className="select"
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
                          className="input"
                          value={editForm.title}
                          onChange={onEditChange}
                        />
                      </td>
                      <td className="table__cell--2">
                        <div className="form--row2">
                          <input
                            type="date"
                            name="date"
                            className="input"
                            value={editForm.date}
                            onChange={onEditChange}
                          />
                          <input
                            type="time"
                            name="startTime"
                            className="input"
                            value={editForm.startTime}
                            onChange={onEditChange}
                          />
                        </div>
                      </td>
                      <td className="table__cell--2">
                        <div className="form--row2">
                          <input
                            type="time"
                            name="endTime"
                            className="input"
                            value={editForm.endTime}
                            onChange={onEditChange}
                          />
                          <input
                            type="number"
                            name="duration"
                            min="15"
                            step="15"
                            className="input"
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
                          className="input"
                          value={editForm.meetingUrl}
                          onChange={onEditChange}
                        />
                      </td>
                      <td>
                        <div className="btn-row">
                          <button className="btn" onClick={cancelEdit}>
                            Cancel
                          </button>
                          <button
                            className="btn btn--primary"
                            onClick={() => updateSession(s.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn--danger"
                            onClick={() => deleteSession(s.id)}
                          >
                            Delete
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
                      <td>{s.endAt ? fmt(s.endAt) : "—"}</td>
                      <td>
                        {s.meetingUrl ? (
                          <a
                            className="link"
                            href={s.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div className="btn-row">
                          <button className="btn" onClick={() => startEdit(s)}>
                            Edit
                          </button>
                          <button
                            className="btn btn--danger"
                            onClick={() => deleteSession(s.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
                {!loading && sessions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty">
                      No sessions match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Admin;

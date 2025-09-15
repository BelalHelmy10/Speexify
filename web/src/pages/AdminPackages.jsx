import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/admin-packages.scss";

axios.defaults.withCredentials = true;

const AUD = ["INDIVIDUAL", "CORPORATE"];
const PRICE_TYPES = ["PER_SESSION", "BUNDLE", "CUSTOM"];

function AdminPackages() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // filters
  const [audience, setAudience] = useState("");
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");

  // create form
  const [form, setForm] = useState({
    title: "",
    description: "",
    audience: "INDIVIDUAL",
    priceType: "BUNDLE",
    priceUSD: "",
    startingAtUSD: "",
    sessionsPerPack: "",
    durationMin: "",
    isPopular: false,
    active: true,
    sortOrder: "0",
    image: "",
    features: "",
  });

  // edit row state
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({});

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (audience) p.set("audience", audience);
    if (q.trim()) p.set("q", q.trim());
    if (active) p.set("active", active);
    return p.toString();
  }, [audience, q, active]);

  const load = async () => {
    setLoading(true);
    setStatus("");
    try {
      const { data } = await axios.get(
        `http://localhost:5050/api/admin/packages?${params}`
      );
      setItems(data || []);
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const onCreate = async (e) => {
    e.preventDefault();
    setStatus("Saving…");
    try {
      const payload = normalizePayload(form);
      await axios.post("http://localhost:5050/api/admin/packages", payload);
      setStatus("Created ✓");
      await load();
      setForm((f) => ({
        ...f,
        title: "",
        description: "",
        priceUSD: "",
        startingAtUSD: "",
        sessionsPerPack: "",
        durationMin: "",
        isPopular: false,
        active: true,
        sortOrder: "0",
        image: "",
        features: "",
      }));
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to create");
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEdit({
      ...row,
      priceUSD: row.priceUSD ?? "",
      startingAtUSD: row.startingAtUSD ?? "",
      sessionsPerPack: row.sessionsPerPack ?? "",
      durationMin: row.durationMin ?? "",
      sortOrder: String(row.sortOrder ?? 0),
      features: row.features ?? "",
      image: row.image ?? "",
    });
  };

  const saveEdit = async () => {
    setStatus("Updating…");
    try {
      const payload = normalizePayload(edit);
      await axios.patch(
        `http://localhost:5050/api/admin/packages/${editingId}`,
        payload
      );
      setStatus("Updated ✓");
      setEditingId(null);
      await load();
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to update");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this package?")) return;
    setStatus("Deleting…");
    try {
      await axios.delete(`http://localhost:5050/api/admin/packages/${id}`);
      setStatus("Deleted ✓");
      setItems((rows) => rows.filter((r) => r.id !== id));
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to delete");
    }
  };

  return (
    <div className="admin admin-packages">
      <header className="admin__header">
        <h1 className="admin__title">Admin · Packages</h1>
        {status && <span className="admin__status">{status}</span>}
      </header>

      {/* Filters */}
      <section className="card">
        <div className="card__header card__header--row">
          <h2 className="card__title">All packages</h2>
          <div className="filters">
            <select
              className="select"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              <option value="">All audiences</option>
              {AUD.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={active}
              onChange={(e) => setActive(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <input
              type="text"
              className="input input--search"
              placeholder="Search title/description/features…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="table">
          <div className="table__scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Audience</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Sessions</th>
                  <th>Duration</th>
                  <th>Popular</th>
                  <th>Active</th>
                  <th>Sort</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) =>
                  editingId === row.id ? (
                    <tr key={row.id} className="is-editing">
                      <td>{row.id}</td>
                      <td>
                        <select
                          className="select"
                          value={edit.audience}
                          onChange={(e) =>
                            setEdit({ ...edit, audience: e.target.value })
                          }
                        >
                          {AUD.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="input"
                          value={edit.title}
                          onChange={(e) =>
                            setEdit({ ...edit, title: e.target.value })
                          }
                        />
                        <input
                          className="input mt4"
                          placeholder="image url"
                          value={edit.image}
                          onChange={(e) =>
                            setEdit({ ...edit, image: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="select"
                          value={edit.priceType}
                          onChange={(e) =>
                            setEdit({ ...edit, priceType: e.target.value })
                          }
                        >
                          {PRICE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="table__cell--2">
                        <div className="form--row2">
                          <input
                            className="input"
                            type="number"
                            placeholder="priceUSD"
                            value={edit.priceUSD}
                            onChange={(e) =>
                              setEdit({ ...edit, priceUSD: e.target.value })
                            }
                          />
                          <input
                            className="input"
                            type="number"
                            placeholder="startingAtUSD"
                            value={edit.startingAtUSD}
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                startingAtUSD: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          placeholder="sessions"
                          value={edit.sessionsPerPack}
                          onChange={(e) =>
                            setEdit({
                              ...edit,
                              sessionsPerPack: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          placeholder="mins"
                          value={edit.durationMin}
                          onChange={(e) =>
                            setEdit({ ...edit, durationMin: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!edit.isPopular}
                          onChange={(e) =>
                            setEdit({ ...edit, isPopular: e.target.checked })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!edit.active}
                          onChange={(e) =>
                            setEdit({ ...edit, active: e.target.checked })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          value={edit.sortOrder}
                          onChange={(e) =>
                            setEdit({ ...edit, sortOrder: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <div className="btn-row">
                          <button
                            className="btn"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn--primary"
                            onClick={saveEdit}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn--danger"
                            onClick={() => remove(row.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.audience}</td>
                      <td>
                        <div className="t-bold">{row.title}</div>
                        <div className="muted small">{row.image || "—"}</div>
                      </td>
                      <td>{row.priceType}</td>
                      <td>
                        {row.priceUSD != null
                          ? `$${row.priceUSD}`
                          : row.startingAtUSD != null
                          ? `From $${row.startingAtUSD}`
                          : "Custom"}
                      </td>
                      <td>{row.sessionsPerPack ?? "—"}</td>
                      <td>{row.durationMin ? `${row.durationMin}m` : "—"}</td>
                      <td>{row.isPopular ? "✓" : "—"}</td>
                      <td>{row.active ? "✓" : "—"}</td>
                      <td>{row.sortOrder}</td>
                      <td>
                        <div className="btn-row">
                          <button
                            className="btn"
                            onClick={() => startEdit(row)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn--danger"
                            onClick={() => remove(row.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={11} className="empty">
                      No packages match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Create */}
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Create package</h2>
        </div>
        <form onSubmit={onCreate} className="form form--grid">
          <div className="field">
            <label className="label">Audience *</label>
            <select
              className="select"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            >
              {AUD.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="label">Price type *</label>
            <select
              className="select"
              value={form.priceType}
              onChange={(e) => setForm({ ...form, priceType: e.target.value })}
            >
              {PRICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Price (USD)</label>
            <input
              className="input"
              type="number"
              value={form.priceUSD}
              onChange={(e) => setForm({ ...form, priceUSD: e.target.value })}
              placeholder="e.g., 40"
            />
          </div>
          <div className="field">
            <label className="label">Starting at (USD)</label>
            <input
              className="input"
              type="number"
              value={form.startingAtUSD}
              onChange={(e) =>
                setForm({ ...form, startingAtUSD: e.target.value })
              }
              placeholder="for corporate 'From $X'"
            />
          </div>
          <div className="field">
            <label className="label">Sessions per pack</label>
            <input
              className="input"
              type="number"
              value={form.sessionsPerPack}
              onChange={(e) =>
                setForm({ ...form, sessionsPerPack: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label className="label">Duration (mins)</label>
            <input
              className="input"
              type="number"
              value={form.durationMin}
              onChange={(e) =>
                setForm({ ...form, durationMin: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label className="label">Sort order</label>
            <input
              className="input"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Image URL</label>
            <input
              className="input"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="/assets/packages/…"
            />
          </div>
          <div className="field field--notes">
            <label className="label">Description</label>
            <textarea
              className="textarea"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="field field--notes">
            <label className="label">Features (one per line)</label>
            <textarea
              className="textarea"
              rows={4}
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder={"Coach-matched 1:1\nWeekly plan\nProgress reviews"}
            />
          </div>
          <div className="field">
            <label className="label">Popular</label>
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) =>
                setForm({ ...form, isPopular: e.target.checked })
              }
            />
          </div>
          <div className="field">
            <label className="label">Active</label>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
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
                setForm({
                  title: "",
                  description: "",
                  audience: "INDIVIDUAL",
                  priceType: "BUNDLE",
                  priceUSD: "",
                  startingAtUSD: "",
                  sessionsPerPack: "",
                  durationMin: "",
                  isPopular: false,
                  active: true,
                  sortOrder: "0",
                  image: "",
                  features: "",
                })
              }
            >
              Clear
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function normalizePayload(x) {
  // convert empty strings to null for numeric fields
  const n = (v) =>
    v === "" || v === null || v === undefined ? null : Number(v);
  return {
    title: x.title?.trim(),
    description: x.description?.trim() || null,
    audience: x.audience,
    priceType: x.priceType,
    priceUSD: n(x.priceUSD),
    startingAtUSD: n(x.startingAtUSD),
    sessionsPerPack: n(x.sessionsPerPack),
    durationMin: n(x.durationMin),
    isPopular: !!x.isPopular,
    active: !!x.active,
    sortOrder: Number(x.sortOrder || 0),
    image: x.image?.trim() || null,
    features: x.features ?? "",
  };
}

export default AdminPackages;

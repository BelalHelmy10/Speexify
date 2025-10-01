import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/settings.scss";
axios.defaults.withCredentials = true;

const timezones = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "America/New_York",
  "America/Los_Angeles",
];

export default function Settings() {
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState("");

  // password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:5050/api/me");
        setMe(res.data);
      } catch (e) {
        setStatus(e.response?.data?.error || "Failed to load profile");
      }
    })();
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setStatus("Saving...");
    try {
      const payload = { name: me.name || "", timezone: me.timezone || "" };
      const res = await axios.patch("http://localhost:5050/api/me", payload);
      setMe(res.data);
      setStatus("Saved ✓");
      setTimeout(() => setStatus(""), 1500);
    } catch (e) {
      setStatus(e.response?.data?.error || "Failed to save");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwStatus("Saving...");
    try {
      await axios.post("http://localhost:5050/api/me/password", {
        currentPassword,
        newPassword,
      });
      setPwStatus("Password changed ✓");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPwStatus(""), 2000);
    } catch (err) {
      setPwStatus(err.response?.data?.error || "Failed to change password");
    }
  };

  if (!me) return <p className="spx-status">{status || "Loading..."}</p>;

  return (
    <div className="spx-settings">
      <div className="spx-container">
        <h2 className="spx-title">Settings</h2>
        {status && <p className="spx-status">{status}</p>}

        {/* Profile + timezone form */}
        <form onSubmit={onSave} className="spx-card spx-form">
          <div className="spx-form__row">
            <label className="spx-label">
              Name
              <input
                className="spx-input"
                value={me.name || ""}
                onChange={(e) => setMe((m) => ({ ...m, name: e.target.value }))}
                placeholder="Your name"
                type="text"
              />
            </label>
          </div>

          <div className="spx-form__row">
            <label className="spx-label">
              Time zone
              <select
                className="spx-select"
                value={me.timezone || ""}
                onChange={(e) =>
                  setMe((m) => ({ ...m, timezone: e.target.value }))
                }
              >
                <option value="">(Use browser default)</option>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="spx-actions">
            <button type="submit" className="spx-btn spx-btn--primary">
              Save
            </button>
          </div>
        </form>

        {/* Change password */}
        <section className="spx-card spx-divider">
          <div className="spx-card__header">
            <h3>Change password</h3>
          </div>

          <form onSubmit={changePassword} className="spx-form">
            <label className="spx-label">
              Current password
              <input
                className="spx-input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </label>

            <label className="spx-label">
              New password (min 8 chars)
              <input
                className="spx-input"
                type="password"
                value={newPassword}
                minLength={8}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </label>

            <div className="spx-actions">
              <button type="submit" className="spx-btn spx-btn--primary">
                Update password
              </button>
              {pwStatus && <p className="spx-status">{pwStatus}</p>}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

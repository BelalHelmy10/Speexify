import { useEffect, useState } from "react";
import axios from "axios";
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

  if (!me) return <p>{status || "Loading..."}</p>;

  return (
    <div style={{ maxWidth: 520 }}>
      <h2>Settings</h2>
      {status && <p>{status}</p>}

      {/* Profile + timezone form */}
      <form onSubmit={onSave} style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666" }}>
            Name
          </label>
          <input
            value={me.name || ""}
            onChange={(e) => setMe((m) => ({ ...m, name: e.target.value }))}
            placeholder="Your name"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666" }}>
            Time zone
          </label>
          <select
            value={me.timezone || ""}
            onChange={(e) => setMe((m) => ({ ...m, timezone: e.target.value }))}
          >
            <option value="">(Use browser default)</option>
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button type="submit">Save</button>
        </div>
      </form>

      {/* Change password */}
      <section
        style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #eee" }}
      >
        <h3>Change password</h3>
        <form onSubmit={changePassword} style={{ display: "grid", gap: 12 }}>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label>
            New password (min 8 chars)
            <input
              type="password"
              value={newPassword}
              minLength={8}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit">Update password</button>
          {pwStatus && <p>{pwStatus}</p>}
        </form>
      </section>
    </div>
  );
}

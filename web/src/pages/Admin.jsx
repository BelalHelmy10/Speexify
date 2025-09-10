import { useEffect, useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await axios.get("http://localhost:5050/api/admin/users");
      setUsers(res.data);
    } catch (e) {
      setErr(e.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p>Loading users…</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;

  return (
    <div>
      <h2>Admin • Users</h2>
      <button onClick={load} style={{ marginBottom: 12 }}>
        Refresh
      </button>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td>{u.id}</Td>
                <Td>{u.email}</Td>
                <Td>{u.name || "—"}</Td>
                <Td>
                  <RoleBadge role={u.role} />
                </Td>
                <Td>{new Date(u.createdAt).toLocaleString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// tiny styled helpers
function Th({ children }) {
  return (
    <th
      style={{
        textAlign: "left",
        borderBottom: "1px solid #eee",
        padding: "8px 6px",
      }}
    >
      {children}
    </th>
  );
}
function Td({ children }) {
  return (
    <td style={{ borderBottom: "1px solid #f3f3f3", padding: "8px 6px" }}>
      {children}
    </td>
  );
}
function RoleBadge({ role }) {
  const bg = role === "admin" ? "#ffe9e6" : "#e6f3ff";
  const color = role === "admin" ? "#b02a1a" : "#0b5ed7";
  return (
    <span
      style={{
        background: bg,
        color,
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 12,
      }}
    >
      {role}
    </span>
  );
}

export default Admin;

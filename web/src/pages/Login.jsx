import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
axios.defaults.withCredentials = true;

// ensure cookies are sent with every request
axios.defaults.withCredentials = true;

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const checkMe = async () => {
    const res = await axios.get("http://localhost:5050/api/auth/me");
    setUser(res.data.user);
  };

  const login = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await axios.post("http://localhost:5050/api/auth/login", form);
      await checkMe();
      navigate("/dashboard"); // <-- go to dashboard after logging in
    } catch (e) {
      setMsg(e.response?.data?.error || "Login failed");
    }
  };

  const logout = async () => {
    await axios.post("http://localhost:5050/api/auth/logout");
    await checkMe();
  };

  useEffect(() => {
    checkMe();
  }, []);

  return (
    <div>
      <h2>Login</h2>

      {!user ? (
        <form onSubmit={login}>
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <br />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <br />
          <button type="submit">Login</button>
          {msg && <p>{msg}</p>}
        </form>
      ) : (
        <>
          <p>
            Logged in as {user.email} {user.name ? `(${user.name})` : ""} —
            role: {user.role}
          </p>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  );
}

export default Login;

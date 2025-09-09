import { useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;

function Register() {
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await axios.post(
        "http://localhost:5050/api/auth/register",
        form
      );
      setMsg(`Registered as ${res.data.user.email}`);
    } catch (e) {
      setMsg(e.response?.data?.error || "Register failed");
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input
          placeholder="Name (optional)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <br />
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
        <button type="submit">Create account</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}

export default Register;

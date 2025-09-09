import axios from "axios";
import { useEffect, useState } from "react";

// ensure cookies are sent with every request
axios.defaults.withCredentials = true;

function Login() {
  const [user, setUser] = useState(null);

  const checkMe = async () => {
    const res = await axios.get("http://localhost:5050/api/auth/me");
    setUser(res.data.user);
  };

  const fakeLogin = async () => {
    await axios.post("http://localhost:5050/api/auth/test-login");
    await checkMe();
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
      <h2>Login (session test)</h2>
      <p>
        Status:{" "}
        {user ? `Logged in as ${user.name} (${user.role})` : "Logged out"}
      </p>
      <button onClick={fakeLogin} style={{ marginRight: 8 }}>
        Fake Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Login;

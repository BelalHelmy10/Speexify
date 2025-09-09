import { useEffect, useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;

function useAuth() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("http://localhost:5050/api/auth/me");
        if (mounted) setUser(res.data.user || null);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { user, checking, setUser };
}

export default useAuth;

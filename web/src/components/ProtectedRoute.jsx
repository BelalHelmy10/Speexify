import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import axios from "axios";

export default function ProtectedRoute({ role }) {
  const [me, setMe] = useState(undefined); // undefined = loading; null = not authed; object = authed

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get("http://localhost:5050/api/auth/me");
        if (mounted) setMe(data.user || null);
      } catch {
        if (mounted) setMe(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // still loading: render nothing (prevents flicker)
  if (me === undefined) return null;

  // not logged in -> login
  if (!me) return <Navigate to="/login" replace />;

  // role-gated
  if (role && me.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children, role }) {
  const { user, checking } = useAuth();

  if (checking) return <p>Checking session…</p>;
  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) return <p>Forbidden (requires {role})</p>;

  return children;
}

export default ProtectedRoute;

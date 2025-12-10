import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";

export default function RequireAdmin() {
  const { token } = useAdminAuth();
  const loc = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: loc }} replace />;
  }

  return <Outlet />;
}

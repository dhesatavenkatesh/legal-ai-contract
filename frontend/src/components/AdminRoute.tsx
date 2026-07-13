import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function AdminRoute() {
  const {
    user,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user || user.role !== "admin") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}

export default AdminRoute;
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useGetProfileQuery } from "../authApiSlice";

interface ProtectedRouteProps {
  allowedRoles?: Array<"Customer" | "Cashier" | "Admin">;
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const { data: user, isLoading, isError } = useGetProfileQuery();

  // 1️⃣ Loading state while checking authentication session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  // 2️⃣ Unauthenticated user -> Redirect to /login
  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3️⃣ Unauthorized Role -> Redirect to /unauthorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4️⃣ Authorized -> Render nested route components
  return <Outlet />;
};

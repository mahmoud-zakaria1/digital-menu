import { Navigate } from "react-router-dom";
import { useGetProfileQuery } from "../authApiSlice";
import { getRoleHomePath } from "../utils/getRoleHomePath";

// Handles the "/" route: if there's a valid session, skip /login
// entirely and drop the user straight into their role's dashboard.
export const RootRedirect = () => {
  const { data: user, isLoading, isError } = useGetProfileQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRoleHomePath(user.role)} replace />;
};

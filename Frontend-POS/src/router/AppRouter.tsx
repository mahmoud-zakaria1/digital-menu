import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { RootRedirect } from "../features/auth/components/RootRedirect";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";

const router = createBrowserRouter([
  // Public Routes
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },

  // Protected Customer / Public Menu Routes
  {
    element: <ProtectedRoute allowedRoles={["Customer", "Cashier", "Admin"]} />,
    children: [
      {
        path: "/menu",
        element: (
          <div className="p-8 text-2xl font-bold">
            Menu Page (Coming in Phase 3)
          </div>
        ),
      },
    ],
  },

  // Protected Cashier Routes
  {
    element: <ProtectedRoute allowedRoles={["Cashier", "Admin"]} />,
    children: [
      {
        path: "/cashier",
        element: (
          <div className="p-8 text-2xl font-bold">
            Cashier Dashboard (Phase 4)
          </div>
        ),
      },
    ],
  },

  // Protected Admin Routes
  {
    element: <ProtectedRoute allowedRoles={["Admin"]} />,
    children: [
      {
        path: "/admin",
        element: (
          <div className="p-8 text-2xl font-bold">
            Admin Dashboard (Phase 5)
          </div>
        ),
      },
    ],
  },

  // Fallback Route
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

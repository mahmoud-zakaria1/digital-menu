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
import { MenuPage } from "../features/menu/pages/MenuPage";
import { CartPage } from "../features/cart/pages/CartPage";

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
        element: <MenuPage />,
      },
      {
        path: "/cart",
        element: <CartPage />,
      },
      {
        path: "/checkout",
        element: (
          <div className="min-h-screen bg-brand-cream flex items-center justify-center p-8">
            <p className="text-2xl font-bold text-brand-charcoal">
              Checkout Page (Coming Next)
            </p>
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

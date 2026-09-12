import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";

// 1️⃣ Define Application Route Structure
const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
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
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

// 2️⃣ AppRouter Component Wrapper
export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

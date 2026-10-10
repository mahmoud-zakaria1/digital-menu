import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../../app/hooks";
import { apiSlice } from "../../../api/apiSlice";
import { useLogoutMutation } from "../authApiSlice";

export const LogoutButton = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // If the server call failed the cookie is still there, so the user
      // is still logged in - navigating away as if they weren't would be
      // a lie. Stay put and say so.
      toast.error("Couldn't log out. Please try again.");
      return;
    }

    // Navigate first, then reset: both updates are batched into one
    // render, so the page we're leaving unmounts before it could re-fire
    // its (now cookie-less, 401-bound) queries off the reset cache.
    navigate("/login", { replace: true });

    // Wipe every cached response. Without this, an Admin's orders and
    // revenue figures would stay in memory for whoever logs in next on
    // the same device.
    dispatch(apiSlice.util.resetApiState());
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="px-3 py-1.5 rounded-lg text-sm font-medium text-brand-charcoal/70 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
};

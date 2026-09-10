import { Toaster } from "react-hot-toast";

// 1️⃣ Global Toast Notification Configuration
export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#333",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
        success: {
          style: {
            background: "#10B981",
          },
        },
        error: {
          style: {
            background: "#EF4444",
          },
        },
      }}
    />
  );
};

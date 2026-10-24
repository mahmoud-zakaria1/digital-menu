import { io, type Socket } from "socket.io-client";

// 1️⃣ The API base URL is configured in exactly one place (VITE_API_BASE_URL)
// and the socket derives its address from it, so the backend URL is never
// repeated. It comes in two shapes:
//   - a full URL in development (http://localhost:8000/api), where the
//     frontend (Vite, :5173) and the backend (:8000) are different origins
//   - a relative path in production (/api), where Express serves the React
//     build itself and everything shares ONE origin
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

// 2️⃣ withCredentials sends the httpOnly auth cookie with the handshake, which
// is what the server's socket auth middleware reads.
export const createSocket = (): Socket | null => {
  // Not configured at all - nothing to connect to
  if (!API_BASE_URL) return null;

  // 3️⃣ Relative base ("/api"): connect to the page's own origin. This is
  // the case the old code broke on - stripping "/api" from "/api" leaves an
  // empty string, which looked like "not configured" and silently disabled
  // every real-time feature (live board, tracking page, admin refresh).
  // Calling io() with no URL tells Socket.IO to use window.location.
  if (API_BASE_URL.startsWith("/")) {
    return io({ withCredentials: true });
  }

  // 4️⃣ Full URL: Socket.IO connects to the backend's ROOT, not the
  // /api-prefixed REST base URL axios uses, so strip the "/api" suffix.
  return io(API_BASE_URL.replace(/\/api\/?$/, ""), { withCredentials: true });
};

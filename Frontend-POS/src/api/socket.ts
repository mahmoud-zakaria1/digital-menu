import { io, type Socket } from "socket.io-client";

// Socket.IO connects to the backend's ROOT, not the /api-prefixed REST base
// URL axios uses - derive it from the same env var so the backend URL is
// configured in exactly one place.
const SOCKET_URL = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.replace(/\/api\/?$/, "");

// withCredentials sends the httpOnly auth cookie with the handshake, which
// is what the server's socket auth middleware reads.
export const createSocket = (): Socket | null => {
  if (!SOCKET_URL) return null;
  return io(SOCKET_URL, { withCredentials: true });
};

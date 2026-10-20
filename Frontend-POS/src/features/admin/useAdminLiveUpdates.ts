import { useEffect } from "react";
import { useAppDispatch } from "../../app/hooks";
import { apiSlice } from "../../api/apiSlice";
import { createSocket } from "../../api/socket";

// Keeps the Admin dashboard's server-derived views (the tables' status and
// the analytics cards) fresh while it is open.
//
// An order going live, advancing or ending changes things the Admin is
// looking at: a table becomes Occupied / Available, "Active Orders" moves,
// the best sellers change. Those orders come from other devices (the
// customer's phone, the Cashier's board), so without this the page shows
// whatever it loaded at mount time until someone reloads it.
//
// Events are only a TRIGGER here, never the data: each one just marks the
// affected queries stale and RTK Query re-fetches them over REST - the same
// "events are a freshness optimisation, REST is the source of truth" rule
// as the Cashier board and the tracking page.
export const useAdminLiveUpdates = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const socket = createSocket();
    if (!socket) return;

    const refreshDashboard = () => {
      dispatch(
        apiSlice.util.invalidateTags([
          { type: "Table", id: "LIST" },
          { type: "Order", id: "STATS" },
        ]),
      );
    };

    // "connect" fires on the first connection AND on every automatic
    // reconnect, so it also covers whatever was missed while offline
    // (Socket.IO never replays events): subscribe, then sync. The server
    // puts Admin sockets in staff_room during the connection handler.
    socket.on("connect", refreshDashboard);

    // A new order just went live (cash order, or an online one that was
    // just paid): its table is now Occupied and the stats moved.
    socket.on("new_order", refreshDashboard);

    // preparing / completed / cancelled: completing or cancelling frees the
    // table, and every change moves the active-orders count.
    socket.on("status_changed", refreshDashboard);

    return () => {
      // Drop listeners first, then close (same teardown as the other hooks)
      socket.off();
      socket.disconnect();
    };
  }, [dispatch]);
};

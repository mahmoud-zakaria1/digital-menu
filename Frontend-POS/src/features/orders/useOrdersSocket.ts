import { useEffect } from "react";
import { useAppDispatch } from "../../app/hooks";
import { createSocket } from "../../api/socket";
import { ordersApiSlice } from "./ordersApiSlice";
import type { Order, OrderStatus } from "./types/order.types";

// Exported so the dashboard's useGetOrdersQuery call uses the exact same
// args - cache patches only land correctly if the args match precisely.
export const ORDERS_QUERY_ARGS = { page: 1, limit: 100 };

interface UseOrdersSocketOptions {
  // Called on every live "new_order" event (e.g. to play a sound). Keep
  // this stable (defined via useCallback with no deps, or a ref) - it's
  // intentionally not in this hook's effect deps, so passing a new inline
  // function every render won't reconnect the socket.
  onNewOrder?: () => void;
}

// Connects only while the consuming component (the Cashier/Admin
// dashboard) is mounted - not a persistent, app-wide connection - and
// patches incoming events directly into the getOrders RTK Query cache
// instead of refetching, so the board updates instantly with no loading
// flicker.
export const useOrdersSocket = ({
  onNewOrder,
}: UseOrdersSocketOptions = {}) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const socket = createSocket();
    if (!socket) return;

    // "connect" fires on the first connection AND on every automatic
    // reconnect. Socket.IO never replays events emitted while a client was
    // offline (or still connecting), so a wifi blip - or an order created
    // between the board's first fetch and this socket finishing its
    // handshake - could silently drop an order from the board. Re-fetching
    // on every connect re-syncs with the server. (The server joins
    // staff_room synchronously during the connection handler, so by the
    // time this fires we're already subscribed: subscribe, then sync.)
    socket.on("connect", () => {
      dispatch(
        ordersApiSlice.util.invalidateTags([{ type: "Order", id: "LIST" }]),
      );
    });

    socket.on("new_order", (order: Order) => {
      dispatch(
        ordersApiSlice.util.updateQueryData(
          "getOrders",
          ORDERS_QUERY_ARGS,
          (draft) => {
            // Guard against a duplicate: a re-sync fetch can land the same
            // order that this event is also delivering.
            if (!draft.orders.some((o) => o._id === order._id)) {
              draft.orders.unshift(order);
            }
          },
        ),
      );
      onNewOrder?.();
    });

    socket.on(
      "status_changed",
      (payload: { orderId: string; status: OrderStatus }) => {
        dispatch(
          ordersApiSlice.util.updateQueryData(
            "getOrders",
            ORDERS_QUERY_ARGS,
            (draft) => {
              const order = draft.orders.find((o) => o._id === payload.orderId);
              if (order) order.status = payload.status;
            },
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);
};

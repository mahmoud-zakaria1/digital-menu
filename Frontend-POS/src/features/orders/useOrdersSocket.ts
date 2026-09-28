import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAppDispatch } from "../../app/hooks";
import { ordersApiSlice } from "./ordersApiSlice";
import type { Order, OrderStatus } from "./types/order.types";

// Socket.IO connects to the backend's root, not the /api-prefixed REST
// base URL axios uses - derive it from the same env var so there's only
// one place the backend URL is configured.
const SOCKET_URL = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.replace(/\/api\/?$/, "");

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
    if (!SOCKET_URL) return;

    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.on("new_order", (order: Order) => {
      dispatch(
        ordersApiSlice.util.updateQueryData(
          "getOrders",
          ORDERS_QUERY_ARGS,
          (draft) => {
            draft.orders.unshift(order);
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

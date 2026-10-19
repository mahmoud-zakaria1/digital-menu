import { useEffect, useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { createSocket } from "../../api/socket";
import { ordersApiSlice } from "./ordersApiSlice";
import type { OrderStatus, PaymentStatus } from "./types/order.types";

// Live-tracks one order for the customer who placed it. Pass undefined to
// stay disconnected (e.g. once the order is completed/cancelled there's
// nothing left to listen for).
//
// Events are a freshness optimisation, never the source of truth: the page
// loads the order over REST, and this hook only keeps it current.
export const useOrderTracking = (orderId: string | undefined) => {
  const dispatch = useAppDispatch();
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const socket = createSocket();
    if (!socket) return;

    // 1️⃣ "connect" fires on the first connection AND on every automatic
    // reconnect, so this single handler also IS the reconnect strategy:
    // every time we (re)connect we re-join the order's room.
    socket.on("connect", () => {
      setIsLive(true);

      // The server acknowledges once the room is actually joined (its
      // ownership check is async). Only then do we re-fetch: anything that
      // changed before the join - including while we were offline - was
      // never delivered to this socket, and Socket.IO doesn't replay it.
      // "Subscribe, then sync."
      socket.emit("track_order", orderId, () => {
        dispatch(
          ordersApiSlice.util.invalidateTags([{ type: "Order", id: orderId }]),
        );
      });
    });

    socket.on("disconnect", () => setIsLive(false));

    // 2️⃣ Order lifecycle changes (pending -> preparing -> completed, cancelled)
    socket.on(
      "status_changed",
      (payload: { orderId: string; status: OrderStatus }) => {
        if (payload.orderId !== orderId) return;

        dispatch(
          ordersApiSlice.util.updateQueryData(
            "getOrderById",
            orderId,
            (draft) => {
              draft.status = payload.status;
            },
          ),
        );
      },
    );

    // 3️⃣ Online payment result, emitted by the HMAC-verified Paymob webhook.
    // This is what flips the page from "Confirming your payment..." to
    // paid/failed without the customer having to refresh. (A successful
    // payment is followed by a status_changed pending -> preparing.)
    socket.on(
      "payment_status_changed",
      (payload: { orderId: string; paymentStatus: PaymentStatus }) => {
        if (payload.orderId !== orderId) return;

        dispatch(
          ordersApiSlice.util.updateQueryData(
            "getOrderById",
            orderId,
            (draft) => {
              draft.paymentStatus = payload.paymentStatus;
            },
          ),
        );
      },
    );

    // 4️⃣ The server refuses (not the owner / unknown id). The page still
    // shows what REST returned, it just won't update live.
    socket.on("track_order_error", (message: string) => {
      console.warn("Order tracking unavailable:", message);
    });

    return () => {
      // Drop listeners first so the disconnect event below can't call
      // setIsLive on a hook that's already going away.
      socket.off();
      socket.disconnect();
    };
  }, [dispatch, orderId]);

  return { isLive };
};

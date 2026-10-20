// The public address the QR code points at. In production set VITE_APP_URL
// to the deployed frontend (e.g. https://app.example.com) so QR codes
// generated while the Admin happens to be on localhost or a preview URL
// still print the REAL address. Falls back to wherever the Admin is
// browsing from, which is correct once the app is deployed.
const APP_URL = (
  (import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin
).replace(/\/$/, "");

// The exact link MenuPage understands: it reads ?table=<id> and syncs it
// into the cart (setTableFromUrl), which makes checkout a Dine-in order.
export const getTableMenuUrl = (tableId: string): string =>
  `${APP_URL}/menu?table=${tableId}`;

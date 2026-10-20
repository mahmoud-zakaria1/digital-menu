import toast from "react-hot-toast";
import {
  useGetTablesQuery,
  useDeleteTableMutation,
} from "../../tables/tablesApiSlice";
import type { Table, TableStatus } from "../../tables/types/table.types";

interface TablesTableProps {
  onShowQr: (table: Table) => void;
}

// Status colors follow the app's rule: brand color for structure, semantic
// colors (green / red / amber) for state.
const STATUS_STYLES: Record<TableStatus, string> = {
  Available: "bg-green-50 text-green-600",
  Occupied: "bg-red-50 text-red-500",
  Reserved: "bg-amber-50 text-amber-600",
};

// A populated currentOrder is an object; it's a bare id if never populated
// and null if the order it pointed to was deleted - never assume it's
// always a full object.
const getOrderSummary = (table: Table): string | null => {
  const order = table.currentOrder;
  if (!order) return null;
  if (typeof order === "string")
    return `Order #${order.slice(-6).toUpperCase()}`;

  return `Order #${order._id.slice(-6).toUpperCase()} · ${order.status} · ${order.totalPrice.toFixed(2)} EGP`;
};

export const TablesTable = ({ onShowQr }: TablesTableProps) => {
  // Refetch every time the tab is opened: a table's status changes whenever
  // an order goes live or finishes (including from the Cashier's device),
  // so a cached list could easily be stale.
  const {
    data: tables = [],
    isLoading,
    isError,
  } = useGetTablesQuery(undefined, { refetchOnMountOrArgChange: true });
  const [deleteTable, { isLoading: isDeleting }] = useDeleteTableMutation();

  const sortedTables = [...tables].sort((a, b) => a.tableNo - b.tableNo);

  const handleDelete = async (table: Table) => {
    if (!window.confirm(`Delete Table ${table.tableNo}?`)) return;

    try {
      await deleteTable(table._id).unwrap();
      toast.success("Table deleted");
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      // Surfaces the backend's real message, e.g. "Cannot delete table with
      // an active order. Cancel or complete the order first."
      toast.error(errorData.data?.message || "Couldn't delete the table.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500 py-16">
        Couldn't load tables right now.
      </p>
    );
  }

  if (sortedTables.length === 0) {
    return (
      <p className="text-center text-brand-charcoal/40 py-16">
        No tables yet. Add your first one to get its QR code.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-peach overflow-hidden">
      {sortedTables.map((table) => {
        const orderSummary = getOrderSummary(table);

        return (
          <div
            key={table._id}
            className="flex items-center gap-4 p-4 border-b border-brand-peach last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-charcoal">
                Table {table.tableNo}
              </p>
              {orderSummary && (
                <p className="text-xs text-brand-charcoal/50 truncate">
                  {orderSummary}
                </p>
              )}
            </div>

            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[table.status]}`}
            >
              {table.status}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onShowQr(table)}
                className="text-sm font-medium text-brand-orange hover:underline cursor-pointer"
              >
                QR
              </button>
              <button
                type="button"
                onClick={() => handleDelete(table)}
                disabled={isDeleting}
                className="text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

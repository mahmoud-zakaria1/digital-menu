import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { tableSchema, type TableFormData } from "../schemas/table.schema";
import { useAddTableMutation } from "../../tables/tablesApiSlice";

interface TableFormModalProps {
  onClose: () => void;
}

export const TableFormModal = ({ onClose }: TableFormModalProps) => {
  const [addTable, { isLoading }] = useAddTableMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
  });

  const onSubmit = async (data: TableFormData) => {
    try {
      const created = await addTable({ tableNo: data.tableNo }).unwrap();
      toast.success(`Table ${created.tableNo} added`);
      onClose();
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      // Surfaces the backend's real message, e.g. "Table already exists"
      toast.error(errorData.data?.message || "Couldn't add the table.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-brand-charcoal mb-1">
          New Table
        </h2>
        <p className="text-xs text-brand-charcoal/50 mb-4">
          You can print its QR code right after it's created.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Table Number
            </label>
            <input
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 5"
              {...register("tableNo", { valueAsNumber: true })}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm"
            />
            {errors.tableNo && (
              <p className="text-red-500 text-xs mt-1">
                {errors.tableNo.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-brand-peach text-brand-charcoal font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white font-medium transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Adding..." : "Add Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

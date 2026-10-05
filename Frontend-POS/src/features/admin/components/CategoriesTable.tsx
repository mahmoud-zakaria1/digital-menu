import toast from "react-hot-toast";
import {
  useGetCategoriesQuery,
  useDeleteCategoryMutation,
} from "../../menu/menuApiSlice";
import type { Category } from "../../menu/types/menu.types";

interface CategoriesTableProps {
  onEdit: (category: Category) => void;
}

export const CategoriesTable = ({ onEdit }: CategoriesTableProps) => {
  const { data: categories = [], isLoading, isError } = useGetCategoriesQuery();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;

    try {
      await deleteCategory(category._id).unwrap();
      toast.success("Category deleted");
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      // Surfaces the backend's real message, e.g. "Cannot delete category.
      // 3 meal(s) are still using it." - not a generic failure toast.
      toast.error(errorData.data?.message || "Couldn't delete the category.");
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
        Couldn't load categories right now.
      </p>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-center text-brand-charcoal/40 py-16">
        No categories yet. Add your first one.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-peach overflow-hidden">
      {categories.map((category) => (
        <div
          key={category._id}
          className="flex items-center justify-between p-4 border-b border-brand-peach last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <p className="font-semibold text-brand-charcoal">{category.name}</p>
            {!category.isActive && (
              <span className="text-xs font-medium text-brand-charcoal/40 bg-brand-peach px-2 py-0.5 rounded-full">
                Inactive
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="text-sm font-medium text-brand-orange hover:underline cursor-pointer"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDelete(category)}
              disabled={isDeleting}
              className="text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50 cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

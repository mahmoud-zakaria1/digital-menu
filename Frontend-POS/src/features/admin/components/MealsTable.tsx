import toast from "react-hot-toast";
import {
  useGetMealsQuery,
  useDeleteMealMutation,
} from "../../menu/menuApiSlice";
import type { Meal } from "../../menu/types/menu.types";

interface MealsTableProps {
  onEdit: (meal: Meal) => void;
}

export const MealsTable = ({ onEdit }: MealsTableProps) => {
  const { data, isLoading, isError } = useGetMealsQuery({
    page: 1,
    limit: 100,
  });
  const [deleteMeal, { isLoading: isDeleting }] = useDeleteMealMutation();

  const meals = data?.meals ?? [];

  const handleDelete = async (meal: Meal) => {
    if (!window.confirm(`Delete "${meal.name}"? This can't be undone.`)) {
      return;
    }
    try {
      await deleteMeal(meal._id).unwrap();
      toast.success("Meal deleted");
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(errorData.data?.message || "Couldn't delete the meal.");
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
        Couldn't load meals right now.
      </p>
    );
  }

  if (meals.length === 0) {
    return (
      <p className="text-center text-brand-charcoal/40 py-16">
        No meals yet. Add your first one.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-peach overflow-hidden">
      {meals.map((meal) => {
        const categoryName =
          typeof meal.category === "string" ? "—" : meal.category.name;

        return (
          <div
            key={meal._id}
            className="flex items-center gap-4 p-4 border-b border-brand-peach last:border-b-0"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-brand-peach flex-shrink-0">
              {meal.image ? (
                <img
                  src={meal.image}
                  alt={meal.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-orange/40 text-[10px]">
                  No image
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-charcoal truncate">
                {meal.name}
              </p>
              <p className="text-xs text-brand-charcoal/50">
                {categoryName} · {meal.price.toFixed(2)} EGP
              </p>
            </div>

            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                meal.isAvailable
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {meal.isAvailable ? "Available" : "Unavailable"}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onEdit(meal)}
                className="text-sm font-medium text-brand-orange hover:underline cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(meal)}
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

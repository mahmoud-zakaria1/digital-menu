import { useGetOrderStatsQuery } from "../../orders/ordersApiSlice";

export const AnalyticsCards = () => {
  const { data, isLoading, isError } = useGetOrderStatsQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-center text-red-500 py-8 text-sm">
        Couldn't load stats right now.
      </p>
    );
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-brand-peach p-5">
          <p className="text-xs font-medium text-brand-charcoal/50 mb-1">
            Total Revenue
          </p>
          <p className="text-2xl font-bold text-brand-charcoal">
            {data.totalRevenue.toFixed(2)} EGP
          </p>
          <p className="text-xs text-brand-charcoal/40 mt-1">
            From completed orders
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-peach p-5">
          <p className="text-xs font-medium text-brand-charcoal/50 mb-1">
            Active Orders
          </p>
          <p className="text-2xl font-bold text-brand-charcoal">
            {data.activeOrders}
          </p>
          <p className="text-xs text-brand-charcoal/40 mt-1">
            Pending + Preparing
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-peach p-5">
        <p className="text-xs font-medium text-brand-charcoal/50 mb-3">
          Best-Selling Meals
        </p>

        {data.bestSellingMeals.length === 0 ? (
          <p className="text-sm text-brand-charcoal/40">No orders yet.</p>
        ) : (
          <ol className="space-y-2">
            {data.bestSellingMeals.map((meal, idx) => (
              <li
                key={meal.mealId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-brand-charcoal">
                  <span className="text-brand-orange font-semibold mr-2">
                    #{idx + 1}
                  </span>
                  {meal.name}
                </span>
                <span className="font-medium text-brand-charcoal/60">
                  {meal.totalQuantity} sold
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../../app/hooks";
import { setTableFromUrl } from "../../cart/cartSlice";
import { useGetMealsQuery, useGetCategoriesQuery } from "../menuApiSlice";
import { useDebounce } from "../../../hooks/useDebounce";
import { CategoryFilter } from "../components/CategoryFilter";
import { SearchBar } from "../components/SearchBar";
import { MealCard } from "../components/MealCard";

export const MenuPage = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  // 1️⃣ Sync ?table= from the URL into the cart slice once per value change.
  // setTableFromUrl itself decides whether that actually changes anything
  // (see cartSlice: no-op if same table, clears items if a DIFFERENT table).
  const tableIdFromUrl = searchParams.get("table") ?? undefined;
  useEffect(() => {
    dispatch(setTableFromUrl(tableIdFromUrl));
  }, [dispatch, tableIdFromUrl]);

  // 2️⃣ Filter / search local state
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);

  // 3️⃣ Data fetching
  const {
    data: mealsData,
    isLoading: isMealsLoading,
    isError: isMealsError,
  } = useGetMealsQuery({
    page: 1,
    limit: 20,
    category: selectedCategoryId,
    search: debouncedSearch || undefined,
  });

  const { data: categories = [] } = useGetCategoriesQuery();

  const meals = mealsData?.meals ?? [];

  return (
    <div className="min-h-screen bg-brand-cream p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-brand-charcoal mb-4">Menu</h1>

        <div className="mb-4">
          <SearchBar value={searchInput} onChange={setSearchInput} />
        </div>

        <div className="mb-6">
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        </div>

        {isMealsLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-orange"></div>
          </div>
        )}

        {isMealsError && (
          <p className="text-center text-red-500 py-16">
            Couldn't load the menu right now. Please try again in a moment.
          </p>
        )}

        {!isMealsLoading && !isMealsError && meals.length === 0 && (
          <p className="text-center text-brand-charcoal/40 py-16">
            {debouncedSearch || selectedCategoryId
              ? "No meals match your search."
              : "No meals available yet — check back soon."}
          </p>
        )}

        {!isMealsLoading && !isMealsError && meals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {meals.map((meal) => (
              <MealCard key={meal._id} meal={meal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

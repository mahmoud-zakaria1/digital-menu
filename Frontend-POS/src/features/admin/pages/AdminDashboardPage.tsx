import { useState } from "react";
import { MealsTable } from "../components/MealsTable";
import { CategoriesTable } from "../components/CategoriesTable";
import { MealFormModal } from "../components/MealFormModal";
import { CategoryFormModal } from "../components/CategoryFormModal";
import type { Meal, Category } from "../../menu/types/menu.types";

type Tab = "meals" | "categories";

export const AdminDashboardPage = () => {
  const [tab, setTab] = useState<Tab>("meals");

  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const openNewMeal = () => {
    setEditingMeal(null);
    setIsMealModalOpen(true);
  };
  const openEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setIsMealModalOpen(true);
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };
  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-brand-peach px-4 md:px-8 py-3">
        <span className="text-lg font-extrabold text-brand-charcoal tracking-tight">
          Admin<span className="text-brand-orange">Dashboard</span>
        </span>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(["meals", "categories"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition cursor-pointer ${
                  tab === t
                    ? "bg-brand-orange text-white"
                    : "bg-brand-peach text-brand-charcoal hover:bg-brand-orange/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={tab === "meals" ? openNewMeal : openNewCategory}
            className="px-4 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-semibold transition cursor-pointer"
          >
            + Add {tab === "meals" ? "Meal" : "Category"}
          </button>
        </div>

        {tab === "meals" ? (
          <MealsTable onEdit={openEditMeal} />
        ) : (
          <CategoriesTable onEdit={openEditCategory} />
        )}
      </div>

      {isMealModalOpen && (
        <MealFormModal
          meal={editingMeal ?? undefined}
          onClose={() => setIsMealModalOpen(false)}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryFormModal
          category={editingCategory ?? undefined}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      )}
    </div>
  );
};

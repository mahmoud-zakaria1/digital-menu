import type { Category } from "../types/menu.types";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
          selectedCategoryId === undefined
            ? "bg-brand-orange text-white"
            : "bg-brand-peach text-brand-charcoal hover:bg-brand-orange/20"
        }`}
      >
        All
      </button>

      {categories.map((category) => (
        <button
          key={category._id}
          type="button"
          onClick={() => onSelect(category._id)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
            selectedCategoryId === category._id
              ? "bg-brand-orange text-white"
              : "bg-brand-peach text-brand-charcoal hover:bg-brand-orange/20"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

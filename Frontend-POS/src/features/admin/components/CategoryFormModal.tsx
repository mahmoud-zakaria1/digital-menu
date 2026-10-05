import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  categorySchema,
  type CategoryFormData,
} from "../schemas/category.schema";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "../../menu/menuApiSlice";
import type { Category } from "../../menu/types/menu.types";

interface CategoryFormModalProps {
  category?: Category;
  onClose: () => void;
}

export const CategoryFormModal = ({
  category,
  onClose,
}: CategoryFormModalProps) => {
  const isEditing = Boolean(category);
  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", isActive: true },
  });

  useEffect(() => {
    if (!category) return;
    reset({ name: category.name, isActive: category.isActive });
  }, [category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditing && category) {
        await updateCategory({ id: category._id, payload: data }).unwrap();
        toast.success("Category updated");
      } else {
        await createCategory({ name: data.name }).unwrap();
        toast.success("Category created");
      }
      onClose();
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(errorData.data?.message || "Couldn't save the category.");
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
        <h2 className="text-xl font-bold text-brand-charcoal mb-4">
          {isEditing ? "Edit Category" : "New Category"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Name
            </label>
            <input
              type="text"
              {...register("name")}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {isEditing && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("isActive")}
                className="accent-brand-orange w-4 h-4"
              />
              <span className="text-sm text-brand-charcoal">Active</span>
            </label>
          )}

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
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white font-medium transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

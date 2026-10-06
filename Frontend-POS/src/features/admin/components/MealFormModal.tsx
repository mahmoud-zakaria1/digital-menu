import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { mealSchema, type MealFormData } from "../schemas/meal.schema";
import {
  useGetCategoriesQuery,
  useCreateMealMutation,
  useUpdateMealMutation,
} from "../../menu/menuApiSlice";
import { useUploadMealImageMutation } from "../uploadsApiSlice";
import type { Meal } from "../../menu/types/menu.types";

interface MealFormModalProps {
  meal?: Meal;
  onClose: () => void;
}

export const MealFormModal = ({ meal, onClose }: MealFormModalProps) => {
  const isEditing = Boolean(meal);
  const { data: categories = [] } = useGetCategoriesQuery();
  const [createMeal, { isLoading: isCreating }] = useCreateMealMutation();
  const [updateMeal, { isLoading: isUpdating }] = useUpdateMealMutation();
  const [uploadMealImage, { isLoading: isUploading }] =
    useUploadMealImageMutation();
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MealFormData>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      image: "",
      isAvailable: true,
    },
  });

  const imageUrl = watch("image");

  // Prefill when editing. meal._id never changes for a given modal
  // instance, so this only runs once per meal being edited.
  useEffect(() => {
    if (!meal) return;
    reset({
      name: meal.name,
      description: meal.description ?? "",
      price: meal.price,
      category:
        typeof meal.category === "string" ? meal.category : meal.category._id,
      image: meal.image ?? "",
      isAvailable: meal.isAvailable,
    });
  }, [meal, reset]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { url } = await uploadMealImage(file).unwrap();
      setValue("image", url, { shouldValidate: true });
      toast.success("Image uploaded");
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(errorData.data?.message || "Couldn't upload the image.");
    } finally {
      // Reset the file input so selecting the same file again still
      // fires onChange (browsers don't fire change on an unchanged value).
      e.target.value = "";
    }
  };

  const onSubmit = async (data: MealFormData) => {
    const payload = {
      ...data,
      image: data.image || undefined,
    };

    try {
      if (isEditing && meal) {
        await updateMeal({ id: meal._id, payload }).unwrap();
        toast.success("Meal updated");
      } else {
        await createMeal(payload).unwrap();
        toast.success("Meal created");
      }
      onClose();
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(errorData.data?.message || "Couldn't save the meal.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-brand-charcoal mb-4">
          {isEditing ? "Edit Meal" : "New Meal"}
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

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-brand-charcoal mb-1">
                Price (EGP)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm"
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-charcoal mb-1">
                Category
              </label>
              <select
                {...register("category")}
                className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm bg-white"
              >
                <option value="">Select...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>

          {/* 📸 Image: upload a file (fills the URL below automatically)
              or paste an external URL directly - either works. */}
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Image
            </label>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-brand-peach flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-orange/40 text-[10px]">
                    No image
                  </div>
                )}
              </div>

              <label className="flex-1">
                <span className="inline-block px-3 py-2 rounded-lg border border-brand-peach text-sm text-brand-charcoal cursor-pointer hover:bg-brand-peach/40 transition">
                  {isUploading ? "Uploading..." : "Choose file..."}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            <input
              type="text"
              {...register("image")}
              placeholder="or paste an image URL"
              className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm"
            />
            {errors.image && (
              <p className="text-red-500 text-xs mt-1">
                {errors.image.message}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("isAvailable")}
              className="accent-brand-orange w-4 h-4"
            />
            <span className="text-sm text-brand-charcoal">Available</span>
          </label>

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
              disabled={isSubmitting || isUploading}
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

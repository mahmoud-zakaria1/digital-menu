import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { staffSchema, type StaffFormData } from "../schemas/staff.schema";
import { useCreateStaffMutation } from "../staffApiSlice";

interface StaffFormModalProps {
  onClose: () => void;
}

const inputClass =
  "w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm";

export const StaffFormModal = ({ onClose }: StaffFormModalProps) => {
  const [createStaff, { isLoading }] = useCreateStaffMutation();
  // The Admin is choosing a password for SOMEONE ELSE and has to pass it
  // on, so a typo is much more costly than in a normal sign-up form -
  // hence the show/hide toggle.
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "Cashier",
    },
  });

  const onSubmit = async (data: StaffFormData) => {
    try {
      const created = await createStaff(data).unwrap();
      toast.success(`${created.role} account created for ${created.name}`);
      onClose();
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(
        errorData.data?.message || "Couldn't create the staff account.",
      );
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
        <h2 className="text-xl font-bold text-brand-charcoal mb-1">
          New Staff Account
        </h2>
        <p className="text-xs text-brand-charcoal/50 mb-4">
          They can log in right away with this email and password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Full Name
            </label>
            <input type="text" {...register("name")} className={inputClass} />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Email
            </label>
            <input type="email" {...register("email")} className={inputClass} />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="+201000000000"
              className={inputClass}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={`${inputClass} pr-16`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-orange cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Role
            </label>
            <select {...register("role")} className={`${inputClass} bg-white`}>
              <option value="Cashier">Cashier</option>
              <option value="Admin">Admin</option>
            </select>
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
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

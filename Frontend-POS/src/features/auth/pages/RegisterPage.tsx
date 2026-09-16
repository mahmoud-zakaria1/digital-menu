import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { registerSchema, type RegisterFormData } from "../schemas/auth.schema";
import { useRegisterMutation } from "../authApiSlice";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterMutation();

  // 1️⃣ Initialize Form with Zod Validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // 2️⃣ Handle Form Submission
  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await registerUser(data).unwrap();
      toast.success(response.message || "Account created successfully!");
      navigate("/login");
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string; error?: string } };
      const errorMessage =
        errorObj.data?.message ||
        errorObj.data?.error ||
        "Registration failed.";

      toast.error(errorMessage, { duration: 4000 });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-brand-peach">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-charcoal">
            Create Account
          </h1>
          <p className="text-brand-charcoal/60 text-sm mt-2">
            Sign up to get started
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Full Name
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="John Doe"
              className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Email Address
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="+201000000000"
              className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-brand-charcoal/70 text-sm mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brand-orange hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

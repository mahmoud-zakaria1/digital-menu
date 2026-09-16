import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { loginSchema, type LoginFormData } from "../schemas/auth.schema";
import { useLoginMutation } from "../authApiSlice";
import { getRoleHomePath } from "../utils/getRoleHomePath";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();

  // 1️⃣ Initialize Form with Zod Validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 2️⃣ Handle Form Submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data).unwrap();
      toast.success(response.message || "Logged in successfully!");

      // If ProtectedRoute redirected the user here from somewhere specific
      // (e.g. they tried /cashier directly), send them back there instead
      // of always landing on the generic role home page.
      const from = (location.state as { from?: Location })?.from;
      const destination = from
        ? `${from.pathname}${from.search ?? ""}`
        : getRoleHomePath(response.user.role);

      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(
        errorData.data?.message ||
          "Login failed. Please check your credentials.",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-brand-peach">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-charcoal">
            Welcome Back
          </h1>
          <p className="text-brand-charcoal/60 text-sm mt-2">
            Sign in to access your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-brand-charcoal/70 text-sm mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-brand-orange hover:underline font-medium"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

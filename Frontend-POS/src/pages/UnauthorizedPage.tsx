import { Link } from "react-router-dom";

export const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream p-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl p-8 border border-brand-peach">
        <h1 className="text-6xl font-extrabold text-red-500 mb-2">403</h1>
        <h2 className="text-2xl font-bold text-brand-charcoal mb-2">
          Access Denied
        </h2>
        <p className="text-brand-charcoal/60 text-sm mb-6">
          You do not have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 bg-brand-orange hover:bg-brand-orange-dark text-white font-medium text-sm rounded-lg shadow transition cursor-pointer"
        >
          Back to Safety
        </Link>
      </div>
    </div>
  );
};

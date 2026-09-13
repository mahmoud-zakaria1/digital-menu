import { Link } from "react-router-dom";

export const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-6xl font-extrabold text-red-500 mb-2">403</h1>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Access Denied
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          You do not have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow transition cursor-pointer"
        >
          Back to Safety
        </Link>
      </div>
    </div>
  );
};

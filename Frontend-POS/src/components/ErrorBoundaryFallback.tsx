import type { FallbackProps } from "react-error-boundary";

// 1️⃣ Fallback UI when an unhandled rendering error occurs
export const ErrorBoundaryFallback = ({
  error,
  resetErrorBoundary,
}: FallbackProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          {(error as Error).message ||
            "An unexpected application error occurred."}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

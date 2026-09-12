import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";
import { store } from "./app/store.ts";
import { ToastProvider } from "./components/ToastProvider.tsx";
import { ErrorBoundaryFallback } from "./components/ErrorBoundaryFallback.tsx";
import App from "./App.tsx";
import "./index.css";
import "./styles/main.scss";

// 1️⃣ Initialize React Root Element
const rootElement = document.getElementById("root")!;

// 2️⃣ Render Application with Global Providers
createRoot(rootElement).render(
  <StrictMode>
    {/* 3️⃣ Catch unhandled React UI rendering errors */}
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      {/* 4️⃣ Provide Redux store context */}
      <Provider store={store}>
        {/* 5️⃣ Global Toast Notification Container */}
        <ToastProvider />
        <App />
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);

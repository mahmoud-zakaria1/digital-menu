import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store.ts";
import App from "./App.tsx";
import "./index.scss";

// 1️⃣ Initialize React Root Element
const rootElement = document.getElementById("root")!;

// 2️⃣ Render Application with Global Redux Provider
createRoot(rootElement).render(
  <StrictMode>
    {/* 3️⃣ Wrap the app tree with Redux store context */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);

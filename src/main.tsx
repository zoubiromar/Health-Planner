import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { PlannerProvider } from "./context";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");

createRoot(root).render(
  <StrictMode>
    <PlannerProvider>
      <App />
    </PlannerProvider>
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The planner still works without a home-screen cache.
    });
  });
}

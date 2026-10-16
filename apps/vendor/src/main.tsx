import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mercurjs/vendor/index.css";
import App from "@mercurjs/vendor";

// Vitrinaki sellers are Greek: default the panel to Greek unless the seller
// already picked a language (the panel's i18n detector reads "lng").
try {
  if (!localStorage.getItem("lng")) localStorage.setItem("lng", "el");
} catch {
  // Storage blocked: the panel falls back to browser language detection.
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

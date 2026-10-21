import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mercurjs/vendor/index.css";
import "./vitrinaki.css";
import App from "@mercurjs/vendor";

// Vitrinaki sellers are Greek: default the panel to Greek unless the seller
// already picked a language (the panel's i18n detector reads "lng").
try {
  if (!localStorage.getItem("lng")) localStorage.setItem("lng", "el");
} catch {
  // Storage blocked: the panel falls back to browser language detection.
}

// Sign-up lives on the public site (vitrinaki.gr/<locale>/start), which also
// presents the product. The panel's own /register page would be a second,
// different sign-up, so send people there instead.
const START_URL =
  (import.meta.env.VITE_VITRINAKI_START_URL as string | undefined) || "http://localhost:3100/gr/start";
if (/\/register\/?$/.test(window.location.pathname)) {
  window.location.replace(START_URL);
}

// Session hand-off from the public start page: it redirects here with
// #vk_handoff=<token>&vk_seller=<id> right after creating the shop. Store them
// where the panel keeps its login (same keys as @mercurjs/vendor's
// auth-token.ts) and remove them from the address bar before the app renders.
(() => {
  const hash = window.location.hash.slice(1);
  if (!hash.includes("vk_handoff=")) return;
  const params = new URLSearchParams(hash);
  const token = params.get("vk_handoff") || "";
  const sellerId = params.get("vk_seller") || "";
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return;
  try {
    localStorage.setItem("mercur_vendor_auth_token", token);
    if (/^[\w-]+$/.test(sellerId)) localStorage.setItem("mercur_vendor_seller_id", sellerId);
    else localStorage.removeItem("mercur_vendor_seller_id");
  } catch {
    // Storage blocked: the seller signs in on the login page instead.
  }
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

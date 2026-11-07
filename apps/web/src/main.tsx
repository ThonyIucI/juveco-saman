import { RouterProvider, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { z } from "zod";

import Loader from "./components/loader";
import NotFound from "./components/not-found";
import RouteError from "./components/route-error";
import { reloadForNewVersion } from "./lib/new-version";
import { routeTree } from "./routeTree.gen";

/** Mensajes de validación de zod en español (los que un esquema no define a mano). */
z.config(z.locales.es());

/*
  Vite avisa con este evento cuando no encuentra un archivo de la versión anterior (pasa en
  una pestaña abierta durante un deploy). Se recarga una vez en vez de mostrar el error.
*/
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewVersion()) {
    event.preventDefault();
  }
});

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultPendingComponent: () => <Loader />,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: NotFound,
  context: {},
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}

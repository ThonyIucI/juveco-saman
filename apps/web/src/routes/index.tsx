import { createFileRoute, redirect } from "@tanstack/react-router";

/** Sin portada pública: la raíz manda al panel, y el panel a /login si no hay sesión. */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

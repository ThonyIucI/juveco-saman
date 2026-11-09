import { useRouterState } from "@tanstack/react-router";
import type { MouseEvent } from "react";

/** Si la ruta actual está dentro de la sección del link («/actividades/…» para «/actividades»). */
const isInSection = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`);

/**
 * Tocar la sección en la que ya se está no navega (Thony, 2026-11-09): volver a entrar
 * recargaba todo (en Actividades, la lista redirige a la actividad y se pedían de nuevo
 * todos los endpoints). Como en WhatsApp o Instagram, solo sube al inicio de la página.
 * Para traer lo nuevo está el botón de sincronizar.
 */
export const useSectionLinkClick = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (to: string, onAfter?: () => void) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (isInSection(pathname, to)) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    onAfter?.();
  };
};

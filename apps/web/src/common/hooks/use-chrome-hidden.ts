import { useReducedMotion } from "motion/react";

import { useScrollDirection } from "@/common/hooks/use-scroll-direction";

/**
 * Si el encabezado y la barra inferior deben esconderse: al bajar se van para dejarle la
 * pantalla al contenido, al subir vuelven. Mismo comportamiento que saas.
 *
 * Con movimiento reducido nunca se esconden: una barra que entra y sale sola es justo
 * el tipo de movimiento que esa preferencia pide evitar.
 */
export const useChromeHidden = (): boolean => {
  const direction = useScrollDirection();
  const prefersReducedMotion = useReducedMotion();
  return !prefersReducedMotion && direction === "down";
};

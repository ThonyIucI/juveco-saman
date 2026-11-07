import { useSyncExternalStore } from "react";

/** Movimiento mínimo para considerar que hubo un cambio de dirección, en px. */
const DIRECTION_THRESHOLD = 10;
/** Cerca del tope no se oculta nada: ahí el encabezado siempre va completo. */
const TOP_ZONE = 80;

export type TScrollDirection = "top" | "up" | "down";

/*
  Un único listener compartido para toda la app. Dos componentes que reaccionan al scroll
  (el encabezado que se encoge y la barra de pestañas que sube) tienen que ver exactamente
  el mismo valor en el mismo frame, o se desfasan y aparece un salto.
*/
let direction: TScrollDirection = "top";
let lastScrollY = 0;
let pendingFrame = 0;
const listeners = new Set<() => void>();

const setDirection = (next: TScrollDirection) => {
  if (next === direction) {
    return;
  }

  direction = next;
  listeners.forEach((listener) => listener());
};

const readScroll = () => {
  pendingFrame = 0;

  const scrollY = Math.max(window.scrollY, 0);
  const delta = scrollY - lastScrollY;

  if (scrollY <= TOP_ZONE) {
    lastScrollY = scrollY;
    setDirection("top");
    return;
  }

  if (Math.abs(delta) < DIRECTION_THRESHOLD) {
    return;
  }

  lastScrollY = scrollY;
  setDirection(delta > 0 ? "down" : "up");
};

const handleScroll = () => {
  if (pendingFrame) {
    return;
  }

  pendingFrame = requestAnimationFrame(readScroll);
};

const subscribe = (listener: () => void) => {
  if (listeners.size === 0) {
    lastScrollY = Math.max(window.scrollY, 0);
    direction = lastScrollY <= TOP_ZONE ? "top" : "up";
    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      window.removeEventListener("scroll", handleScroll);

      if (pendingFrame) {
        cancelAnimationFrame(pendingFrame);
        pendingFrame = 0;
      }
    }
  };
};

/** `"top"` mientras se está cerca del inicio; luego `"down"` o `"up"` según hacia dónde va. */
export const useScrollDirection = (): TScrollDirection =>
  useSyncExternalStore(
    subscribe,
    () => direction,
    () => "top" as const,
  );

import { useEffect, useRef, useState } from "react";

/** Lo que se ve mientras carga: nada, el esqueleto o el contenido. */
export type TLoadingPhase = "waiting" | "skeleton" | "ready";

/* Si los datos llegan antes de esto, no se muestra esqueleto: solo parpadearía. */
const SKELETON_DELAY_MS = 200;
/* Si el esqueleto llegó a aparecer, se queda al menos esto, para que no parpadee al irse. */
const SKELETON_MIN_MS = 300;

/**
 * Decide qué mostrar mientras carga (Thony, 2026-11-18): una carga rápida pasa directo al
 * contenido; una lenta muestra el esqueleto un tiempo mínimo antes de dar paso al contenido.
 */
export const useLoadingPhase = (isLoading: boolean): TLoadingPhase => {
  const [phase, setPhase] = useState<TLoadingPhase>(isLoading ? "waiting" : "ready");
  const skeletonShownAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      setPhase("waiting");
      const timer = window.setTimeout(() => {
        skeletonShownAtRef.current = Date.now();
        setPhase("skeleton");
      }, SKELETON_DELAY_MS);
      return () => window.clearTimeout(timer);
    }

    const shownAt = skeletonShownAtRef.current;
    if (shownAt === null) {
      setPhase("ready");
      return undefined;
    }
    const remaining = SKELETON_MIN_MS - (Date.now() - shownAt);
    const timer = window.setTimeout(() => {
      skeletonShownAtRef.current = null;
      setPhase("ready");
    }, Math.max(remaining, 0));
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  return phase;
};

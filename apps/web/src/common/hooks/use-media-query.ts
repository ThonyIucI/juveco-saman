import { useEffect, useState } from "react";

/**
 * Arranca en `false` y resuelve al valor real después de montar, así el primer render
 * es el mismo en todas partes y no parpadea. Luego sigue los cambios de tamaño.
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
};

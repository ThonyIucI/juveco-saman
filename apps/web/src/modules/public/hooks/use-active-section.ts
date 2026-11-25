import { useEffect, useState } from "react";

/**
 * La sección que se está leyendo, para marcar su enlace en el navbar. Cuenta la que cruza una
 * franja en el tercio superior de la pantalla.
 */
export const useActiveSection = (ids: readonly string[], isContentReady: boolean): string | null => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-30% 0px -65% 0px" },
    );
    const elements = ids.map((id) => document.getElementById(id)).filter((element): element is HTMLElement => element !== null);
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
    /* Las secciones que dependen de la API aparecen después: se vuelven a buscar. */
  }, [ids, isContentReady]);

  return activeId;
};

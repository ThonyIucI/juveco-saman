import { useEffect, useRef, useState } from "react";

import { useDebouncedCallback } from "@/common/hooks/use-debounced-callback";

/**
 * El ancho de un elemento, para pasárselo a algo que lo fija al cargar (el plugin de
 * Facebook). La primera medida es inmediata; los cambios de tamaño esperan `debounceMs`.
 * `null` hasta que se midió.
 */
export const useElementWidth = <TElement extends HTMLElement>(debounceMs: number) => {
  const ref = useRef<TElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const { schedule } = useDebouncedCallback((next: number) => setWidth(next), debounceMs);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    setWidth(Math.floor(element.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        schedule(Math.floor(entry.contentRect.width));
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, width };
};

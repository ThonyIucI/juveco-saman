import { useEffect, useRef } from "react";

/**
 * Ejecuta `callback` cuando pasan `delayMs` sin volver a llamarlo (p. ej. al dejar de
 * escribir). `cancel` descarta lo pendiente; al desmontar se descarta solo.
 */
export const useDebouncedCallback = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Siempre la última versión del callback, sin reiniciar el temporizador al renderizar. */
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const schedule = (...args: TArgs) => {
    cancel();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      callbackRef.current(...args);
    }, delayMs);
  };

  useEffect(() => cancel, []);

  return { schedule, cancel };
};

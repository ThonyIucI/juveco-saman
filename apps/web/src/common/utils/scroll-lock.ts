/**
 * Congela el scroll de la página mientras haya alguna modal abierta. Lleva la cuenta: con
 * dos modales a la vez (p. ej. una confirmación encima de un formulario), el scroll vuelve
 * recién cuando se cierra la última, y siempre al estado que tenía antes de la primera.
 */

let lockCount = 0;
let previousOverflow = "";

/** Bloquea el scroll y devuelve la función que lo libera (llamarla dos veces no hace nada). */
export const lockPageScroll = (): (() => void) => {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;

  let isReleased = false;
  return () => {
    if (isReleased) {
      return;
    }
    isReleased = true;
    lockCount -= 1;
    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow;
    }
  };
};

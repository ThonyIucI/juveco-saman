/* Curvas del design system (Emil): ease-out fuerte para entrar, curva de drawer iOS para las hojas. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/**
 * Lo que llega después del skeleton aparece con un fundido corto, no de golpe
 * (Thony, 2026-11-09). Se pone en el contenedor del contenido ya cargado: la animación corre
 * una vez, cuando la clase aparece. Sin animación si se pidió menos movimiento.
 */
export const FADE_IN_CLASS = "animate-in fade-in duration-300 motion-reduce:animate-none";

import { useEffect, useState } from "react";

interface IVisualViewport {
  /** Altura realmente visible: excluye el teclado virtual del celular. */
  height: number;
  /** Desplazamiento del área visible respecto al layout. */
  offsetTop: number;
}

const readViewport = (): IVisualViewport => {
  const viewport = window.visualViewport;

  return viewport
    ? { height: viewport.height, offsetTop: viewport.offsetTop }
    : { height: window.innerHeight, offsetTop: 0 };
};

/**
 * Sigue el área visible real del navegador.
 *
 * Al abrirse el teclado en un celular, el viewport del layout **no** se encoge: solo el
 * visual viewport. Sin esto, un formulario dentro de una hoja inferior queda detrás del
 * teclado y el chico escribe a ciegas.
 *
 * Solo se suscribe mientras `enabled` es `true`, o sea mientras la modal está abierta.
 */
export const useVisualViewport = (enabled: boolean): IVisualViewport => {
  const [state, setState] = useState<IVisualViewport>(readViewport);

  useEffect(() => {
    const viewport = window.visualViewport;

    if (!enabled || !viewport) {
      return;
    }

    const update = () => setState({ height: viewport.height, offsetTop: viewport.offsetTop });

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return state;
};

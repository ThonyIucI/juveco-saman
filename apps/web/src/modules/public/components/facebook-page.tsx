import { useElementWidth } from "@/modules/public/hooks/use-element-width";
import { FACEBOOK_URL } from "@/modules/public/data/social";

/* Lo que admite el plugin de página de Facebook: de 180 a 500 px de ancho. */
const MIN_WIDTH = 180;
const MAX_WIDTH = 500;
const HEIGHT = 700;
const RESIZE_DEBOUNCE_MS = 250;
/* Bajo `md` la columna va a todo el ancho, sin tarjeta: pantalla menos el gutter (`px-4`). */
const MD_PX = 768;
const MOBILE_GUTTERS_PX = 32;

/*
  En celular el ancho sale de la pantalla y no del contenedor: Facebook entrega exactamente
  el ancho pedido, así que una medida chica (una columna encogida al cargar) lo dejaba
  angosto y pegado a la izquierda. Desde `md` sí se mide la columna (tarjeta con padding).
*/
const columnWidthOf = (measured: number): number => {
  const viewport = document.documentElement.clientWidth;
  return viewport < MD_PX ? viewport - MOBILE_GUTTERS_PX : measured;
};

const pluginUrlOf = (width: number): string => {
  const params = new URLSearchParams({
    href: FACEBOOK_URL,
    tabs: "timeline",
    width: String(width),
    height: String(HEIGHT),
    small_header: "true",
    adapt_container_width: "true",
    hide_cover: "false",
  });
  return `https://www.facebook.com/plugins/page.php?${params.toString()}`;
};

/**
 * El plugin oficial de página de Facebook. Fija su ancho al cargar (máximo 500 px) y no se
 * adapta solo: por eso se mide el contenedor y se vuelve a pedir al cambiar de ancho. Va
 * centrado en su columna y nunca más ancho que ella.
 */
export default function FacebookPage() {
  const { ref, width } = useElementWidth<HTMLDivElement>(RESIZE_DEBOUNCE_MS);
  /* Sin medida real (nula o 0) no se dibuja: un iframe pedido a 180 px se queda angosto. */
  const pluginWidth =
    width === null || width <= 0
      ? null
      : Math.min(Math.max(Math.floor(columnWidthOf(width)), MIN_WIDTH), MAX_WIDTH);

  /* Bloque `w-full` que solo se mide a sí mismo: su ancho no depende del iframe de adentro. */
  return (
    <div ref={ref} className="block w-full min-w-0" style={{ minHeight: HEIGHT }}>
      {pluginWidth !== null && (
        <iframe
          key={pluginWidth}
          title="Publicaciones de la página de Facebook de Juveco Samán"
          src={pluginUrlOf(pluginWidth)}
          width={pluginWidth}
          height={HEIGHT}
          loading="lazy"
          allow="encrypted-media"
          className="mx-auto block max-w-full border-0"
          style={{ width: pluginWidth, height: HEIGHT, overflow: "hidden" }}
        />
      )}
    </div>
  );
}

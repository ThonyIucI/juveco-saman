import { useElementWidth } from "@/modules/public/hooks/use-element-width";
import { FACEBOOK_URL } from "@/modules/public/data/social";

/* Lo que admite el plugin de página de Facebook: de 180 a 500 px de ancho. */
const MIN_WIDTH = 180;
const MAX_WIDTH = 500;
const HEIGHT = 700;
const RESIZE_DEBOUNCE_MS = 250;

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
  const pluginWidth = width === null ? null : Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH);

  return (
    <div ref={ref} className="flex w-full min-w-0 justify-center overflow-hidden" style={{ minHeight: HEIGHT }}>
      {pluginWidth !== null && (
        <iframe
          key={pluginWidth}
          title="Publicaciones de la página de Facebook de Juveco Samán"
          src={pluginUrlOf(pluginWidth)}
          width={pluginWidth}
          height={HEIGHT}
          loading="lazy"
          allow="encrypted-media"
          className="max-w-full border-0"
          style={{ overflow: "hidden" }}
        />
      )}
    </div>
  );
}

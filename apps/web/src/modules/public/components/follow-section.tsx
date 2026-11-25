import { buttonVariants } from "@juveco/ui/components/button";
import { memo, useEffect } from "react";

import FacebookIcon from "@/common/components/icons/facebook-icon";
import TikTokIcon from "@/common/components/icons/tiktok-icon";
import { FACEBOOK_URL, TIKTOK_URL, TIKTOK_USERNAME } from "@/modules/public/data/social";

import FacebookPage from "./facebook-page";
import { Reveal } from "./reveal";
import SiteSection from "./site-section";

const TIKTOK_SCRIPT_SRC = "https://www.tiktok.com/embed.js";

/**
 * Síguenos: los últimos videos de TikTok (embed oficial de creador, sin llave) y las
 * publicaciones de Facebook (plugin oficial de página, con el ancho medido del contenedor
 * para que no se corte en celular), lado a lado en escritorio y apilados en celular; y los
 * botones a cada red (Thony, 2026-11-25).
 */
export default function FollowSection() {
  return (
    <SiteSection id="siguenos" tone="muted" eyebrow="Síguenos" title="Lo último en nuestras redes">
      <Reveal className="mb-6 space-y-3 md:mb-8">
        <p className="max-w-2xl text-base text-foreground">
          Publicamos avisos, fotos y resultados de cada actividad. Síguenos para enterarte primero.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
            <TikTokIcon className="size-5" />@{TIKTOK_USERNAME}
          </a>
          <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
            <FacebookIcon className="size-5" />
            Facebook
          </a>
        </div>
      </Reveal>

      {/* `grid-cols-1` es minmax(0, 1fr): la columna nunca crece con el iframe de TikTok. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Reveal className="min-w-0 overflow-hidden md:rounded-lg md:border md:border-border md:bg-card md:p-3">
          <TikTokFeed />
        </Reveal>
        <Reveal delay={0.1} className="min-w-0 md:rounded-lg md:border md:border-border md:bg-card md:p-3">
          <FacebookPage />
        </Reveal>
      </div>
    </SiteSection>
  );
}

/*
  El script de TikTok reemplaza el `blockquote` por su iframe: React no debe volver a
  dibujarlo, por eso va memorizado y sin props.
*/
const TikTokFeed = memo(function TikTokFeed() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = TIKTOK_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <blockquote
      className="tiktok-embed m-0!"
      cite={TIKTOK_URL}
      data-unique-id={TIKTOK_USERNAME}
      data-embed-type="creator"
      style={{ maxWidth: 780, minWidth: 0, width: "100%", marginInline: "auto" }}
    >
      <section>
        <a target="_blank" rel="noreferrer" href={`${TIKTOK_URL}?refer=creator_embed`}>
          @{TIKTOK_USERNAME}
        </a>
      </section>
    </blockquote>
  );
});

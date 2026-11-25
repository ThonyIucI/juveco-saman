import { buttonVariants } from "@juveco/ui/components/button";
import { memo, useEffect } from "react";

import FacebookIcon from "@/common/components/icons/facebook-icon";
import TikTokIcon from "@/common/components/icons/tiktok-icon";
import { FACEBOOK_URL, TIKTOK_URL, TIKTOK_USERNAME } from "@/modules/public/data/social";

import { Reveal } from "./reveal";
import SiteSection from "./site-section";

const TIKTOK_SCRIPT_SRC = "https://www.tiktok.com/embed.js";

/**
 * Síguenos: los últimos videos de TikTok con su embed oficial de creador (sin llave) y los
 * botones a cada red. El plugin de Facebook no va: en celular corta las publicaciones
 * (Thony, 2026-11-25).
 */
export default function FollowSection() {
  return (
    <SiteSection id="siguenos" tone="muted" eyebrow="Síguenos" title="Lo último en nuestras redes">
      <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <TikTokFeed />
        </Reveal>
        <Reveal delay={0.1} className="space-y-3">
          <p className="text-base text-foreground">
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
      style={{ maxWidth: 780, minWidth: 288 }}
    >
      <section>
        <a target="_blank" rel="noreferrer" href={`${TIKTOK_URL}?refer=creator_embed`}>
          @{TIKTOK_USERNAME}
        </a>
      </section>
    </blockquote>
  );
});

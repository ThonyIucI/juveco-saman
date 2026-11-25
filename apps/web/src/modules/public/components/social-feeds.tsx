import { memo, useEffect } from "react";

import { FACEBOOK_URL, TIKTOK_URL, TIKTOK_USERNAME } from "@/modules/public/data/social";

const TIKTOK_SCRIPT_SRC = "https://www.tiktok.com/embed.js";

/* El plugin de página de Facebook acepta hasta 500 px de ancho. */
const FACEBOOK_WIDTH = 500;
const FACEBOOK_HEIGHT = 560;

const facebookPluginUrl = () => {
  const params = new URLSearchParams({
    href: FACEBOOK_URL,
    tabs: "timeline",
    width: String(FACEBOOK_WIDTH),
    height: String(FACEBOOK_HEIGHT),
    small_header: "true",
    adapt_container_width: "true",
    hide_cover: "false",
    show_facepile: "false",
  });
  return `https://www.facebook.com/plugins/page.php?${params.toString()}`;
};

/**
 * Las últimas publicaciones (avance, Thony 2026-11-25). TikTok: el embed oficial de creador,
 * sin llave. Facebook: el plugin de página, que solo funciona si el enlace es una *página* y
 * no un perfil personal; si no carga, quedan los botones de arriba.
 */
export default function SocialFeeds() {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <TikTokFeed />
      <iframe
        title="Publicaciones de Juveco en Facebook"
        src={facebookPluginUrl()}
        height={FACEBOOK_HEIGHT}
        loading="lazy"
        className="w-full max-w-125 rounded-md border border-border bg-card"
        allow="encrypted-media"
      />
    </div>
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

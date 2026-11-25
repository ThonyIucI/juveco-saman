import { buttonVariants } from "@juveco/ui/components/button";
import { cn } from "@juveco/ui/lib/utils";
import { type ReactNode, memo, useEffect, useState } from "react";

import FacebookIcon from "@/common/components/icons/facebook-icon";
import TikTokIcon from "@/common/components/icons/tiktok-icon";
import { FACEBOOK_URL, TIKTOK_URL, TIKTOK_USERNAME } from "@/modules/public/data/social";

import { RevealGroup, RevealItem } from "./reveal";
import SiteSection from "./site-section";

type TNetwork = "tiktok" | "facebook";

const TIKTOK_SCRIPT_SRC = "https://www.tiktok.com/embed.js";
/* El plugin de página de Facebook acepta hasta 500 px de ancho. */
const FACEBOOK_WIDTH = 500;
const FACEBOOK_HEIGHT = 600;

const facebookPluginUrl = () =>
  `https://www.facebook.com/plugins/page.php?${new URLSearchParams({
    href: FACEBOOK_URL,
    tabs: "timeline",
    width: String(FACEBOOK_WIDTH),
    height: String(FACEBOOK_HEIGHT),
    small_header: "true",
    adapt_container_width: "true",
    show_facepile: "false",
  }).toString()}`;

/**
 * Síguenos: lo último de TikTok y Facebook (avance, Thony 2026-11-25). En escritorio van lado
 * a lado; en celular, uno a la vez con un selector, para no hacer dos scrolls largos.
 *
 * TikTok usa su embed oficial de creador (sin llave). El plugin de Facebook solo carga si el
 * enlace es una *página* y no un perfil personal; el botón de abajo funciona igual.
 */
export default function FollowSection() {
  const [network, setNetwork] = useState<TNetwork>("tiktok");

  return (
    <SiteSection id="siguenos" eyebrow="Síguenos" title="Lo último en nuestras redes">
      <div role="tablist" aria-label="Red social" className="mb-6 inline-flex rounded-lg bg-muted p-1 lg:hidden">
        {(["tiktok", "facebook"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={network === option}
            onClick={() => setNetwork(option)}
            className={cn(
              "min-h-11 cursor-pointer rounded-md px-5 font-semibold transition-colors",
              network === option ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
            )}
          >
            {option === "tiktok" ? "TikTok" : "Facebook"}
          </button>
        ))}
      </div>

      <RevealGroup className="grid items-start gap-8 lg:grid-cols-2">
        <RevealItem className={cn(network !== "tiktok" && "hidden lg:block")}>
          <NetworkHeader icon={<TikTokIcon className="size-5" />} label={`@${TIKTOK_USERNAME}`} href={TIKTOK_URL} />
          <TikTokFeed />
        </RevealItem>
        <RevealItem className={cn(network !== "facebook" && "hidden lg:block")}>
          <NetworkHeader icon={<FacebookIcon className="size-5" />} label="Juveco Samán" href={FACEBOOK_URL} />
          <iframe
            title="Publicaciones de Juveco en Facebook"
            src={facebookPluginUrl()}
            height={FACEBOOK_HEIGHT}
            loading="lazy"
            allow="encrypted-media"
            className="w-full max-w-125 rounded-lg border border-border bg-card"
          />
        </RevealItem>
      </RevealGroup>
    </SiteSection>
  );
}

function NetworkHeader({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
        {icon}
        {label}
      </p>
      <a href={href} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Seguir
      </a>
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

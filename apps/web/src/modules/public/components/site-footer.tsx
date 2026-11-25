import { whatsAppUsernameUrl } from "@juveco/shared/whatsapp";
import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { LogIn } from "lucide-react";

import FacebookIcon from "@/common/components/icons/facebook-icon";
import TikTokIcon from "@/common/components/icons/tiktok-icon";
import WhatsAppIcon from "@/common/components/icons/whatsapp-icon";
import { useSessionRole } from "@/common/hooks/use-session-role";
import { SITE, SITE_SECTIONS } from "@/modules/public/data/site";
import { FACEBOOK_URL, TIKTOK_URL, TIKTOK_USERNAME } from "@/modules/public/data/social";

/* Azul marino de la tinta del logo: identidad, igual en claro y en oscuro. */
const NAVY_CLASS = "bg-[#14214A] text-white";

const SOCIAL_LINK_CLASS =
  "flex size-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20";

/** Los íconos de las redes; en celular van junto a la marca y en escritorio, en la columna Contacto. */
function SocialLinks() {
  return (
    <div className="flex gap-2">
      <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" aria-label="Facebook" className={SOCIAL_LINK_CLASS}>
        <FacebookIcon className="size-5" />
      </a>
      <a
        href={TIKTOK_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={`TikTok @${TIKTOK_USERNAME}`}
        className={SOCIAL_LINK_CLASS}
      >
        <TikTokIcon className="size-5" />
      </a>
      {SITE.whatsappUsername && (
        <a
          href={whatsAppUsernameUrl(SITE.whatsappUsername)}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          className={SOCIAL_LINK_CLASS}
        >
          <WhatsAppIcon className="size-5" />
        </a>
      )}
    </div>
  );
}

/**
 * Footer de la portada: quiénes somos, las secciones, las redes y el contacto. La entrada
 * de la directiva va acá, discreta, y no en el navbar (Thony, 2026-11-25). En celular es
 * compacto: redes junto a la marca, secciones en dos columnas y la línea final en una fila.
 */
export default function SiteFooter({ hasEvent = true }: { hasEvent?: boolean }) {
  const hasSession = useSessionRole() !== null;
  const sections = SITE_SECTIONS.filter((section) => hasEvent || section.id !== "evento");

  return (
    <footer className={NAVY_CLASS}>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-[1.4fr_1fr_1fr] md:gap-10 md:px-6 md:py-12">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/logo.png" alt="" className="size-12 shrink-0" />
              <div className="min-w-0">
                <p className="font-heading text-xl font-semibold">{SITE.shortName}</p>
                <p className="text-sm text-white/70">{SITE.term}</p>
              </div>
            </div>
            <div className="shrink-0 md:hidden">
              <SocialLinks />
            </div>
          </div>
          <p className="mt-3 max-w-sm text-sm text-white/70 md:mt-4">{SITE.intro}</p>
        </div>

        <nav aria-label="Secciones del pie">
          <p className="mb-1 text-xs font-semibold tracking-widest text-gold uppercase md:mb-3">Secciones</p>
          <ul className="grid grid-cols-2 gap-x-4 md:block">
            {sections.map((section) => (
              <li key={section.id}>
                <Link to="/" hash={section.id} className="flex min-h-11 items-center text-sm text-white/80 transition-colors hover:text-white">
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
          <p className="mb-3 text-xs font-semibold tracking-widest text-gold uppercase">Contacto</p>
          <SocialLinks />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1 text-xs text-white/60 md:px-6 md:py-5 md:text-sm">
          <p className="min-w-0 truncate">
            © {dayjs().year()} <span className="md:hidden">{SITE.shortName}</span>
            <span className="hidden md:inline">{SITE.fullName}</span>
          </p>
          <Link
            to={hasSession ? "/dashboard" : "/login"}
            className="flex min-h-11 shrink-0 items-center gap-1.5 text-sm transition-colors hover:text-white"
          >
            <LogIn className="size-4" />
            {hasSession ? "Ir al panel" : "Acceso directiva"}
          </Link>
        </div>
      </div>
    </footer>
  );
}

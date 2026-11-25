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

/**
 * Footer de la portada: quiénes somos, las secciones, las redes y el contacto. La entrada
 * de la directiva va acá, discreta, y no en el navbar (Thony, 2026-11-25).
 */
export default function SiteFooter({ hasEvent = true }: { hasEvent?: boolean }) {
  const hasSession = useSessionRole() !== null;
  const sections = SITE_SECTIONS.filter((section) => hasEvent || section.id !== "evento");

  return (
    <footer className={NAVY_CLASS}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="size-12" />
            <div>
              <p className="font-heading text-xl font-semibold">{SITE.shortName}</p>
              <p className="text-sm text-white/70">{SITE.term}</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-white/70">{SITE.intro}</p>
        </div>

        <nav aria-label="Secciones del pie">
          <p className="mb-3 text-xs font-semibold tracking-widest text-gold uppercase">Secciones</p>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <Link to="/" hash={section.id} className="flex min-h-11 items-center text-sm text-white/80 transition-colors hover:text-white">
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-3 text-xs font-semibold tracking-widest text-gold uppercase">Contacto</p>
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
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-white/60 md:px-6">
          <p>
            © {dayjs().year()} {SITE.fullName}
          </p>
          <Link
            to={hasSession ? "/dashboard" : "/login"}
            className="flex min-h-11 items-center gap-1.5 transition-colors hover:text-white"
          >
            <LogIn className="size-4" />
            {hasSession ? "Ir al panel" : "Acceso directiva"}
          </Link>
        </div>
      </div>
    </footer>
  );
}

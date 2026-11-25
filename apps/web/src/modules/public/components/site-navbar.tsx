import { cn } from "@juveco/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { SITE, SITE_SECTIONS } from "@/modules/public/data/site";
import { useActiveSection } from "@/modules/public/hooks/use-active-section";
import { useNavbarHidden } from "@/modules/public/hooks/use-navbar-hidden";
import { scrollToSection } from "@/modules/public/utils/scroll";

const SECTION_IDS = SITE_SECTIONS.map((section) => section.id);

interface ISiteNavbarProps {
  /** En el inicio los enlaces bajan a la sección; en las otras páginas, vuelven al inicio. */
  isHome?: boolean;
  /** Las secciones que dependen de la API ya están en la página. */
  isContentReady?: boolean;
  /** Hay un evento al que bajar: sin él, el enlace «Eventos» no lleva a nada y se oculta. */
  hasEvent?: boolean;
}

/**
 * Navbar de las páginas públicas: el logo y el nombre en una sola línea, y los enlaces a las
 * secciones del inicio (el de la que se está leyendo, marcado). En celular, un menú ☰. Se
 * esconde al bajar y reaparece al subir (Thony, 2026-11-25).
 */
export default function SiteNavbar({ isHome = false, isContentReady = false, hasEvent = true }: ISiteNavbarProps) {
  const activeId = useActiveSection(SECTION_IDS, isContentReady);
  const isReduced = useReducedMotion() ?? false;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isHidden = useNavbarHidden(isMenuOpen);
  const sections = SITE_SECTIONS.filter((section) => hasEvent || section.id !== "evento");

  /* Escape cierra el menú móvil. */
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const sectionLink = (id: string, label: string, className: string) => (
    <Link
      to="/"
      hash={id}
      onClick={(event) => {
        setIsMenuOpen(false);
        if (isHome) {
          event.preventDefault();
          scrollToSection(id);
        }
      }}
      aria-current={isHome && activeId === id ? "true" : undefined}
      className={cn(className, isHome && activeId === id ? "text-primary dark:text-blue-400" : "text-muted-foreground hover:text-foreground")}
    >
      {label}
    </Link>
  );

  return (
    <header
      inert={isHidden}
      className={cn(
        "sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur transition-transform duration-300 ease-out motion-reduce:transition-none",
        isHidden && "-translate-y-full",
      )}
    >
      <nav aria-label="Secciones" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          to="/"
          onClick={(event) => {
            setIsMenuOpen(false);
            if (isHome) {
              event.preventDefault();
              scrollToSection("inicio");
            }
          }}
          className="flex min-h-11 shrink-0 items-center gap-2.5 font-heading text-xl font-semibold whitespace-nowrap text-primary dark:text-blue-400"
        >
          <img src="/logo.png" alt="" className="size-9" />
          {SITE.shortName}
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {sections.map((section) => (
            <li key={section.id}>
              {sectionLink(section.id, section.label, "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors")}
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted lg:hidden"
        >
          {isMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.ul
            initial={{ opacity: 0, y: isReduced ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isReduced ? 0 : -8 }}
            transition={{ duration: isReduced ? 0 : 0.2 }}
            className="absolute inset-x-0 top-full border-b border-border bg-background px-4 py-3 shadow-elevated lg:hidden"
          >
            {sections.map((section) => (
              <li key={section.id}>
                {sectionLink(section.id, section.label, "flex min-h-12 items-center rounded-md px-3 text-base font-medium")}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}

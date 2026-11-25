import { cn } from "@juveco/ui/lib/utils";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { SITE, SITE_SECTIONS } from "@/modules/public/data/site";
import { useActiveSection } from "@/modules/public/hooks/use-active-section";
import { scrollToSection } from "@/modules/public/utils/scroll";

const SECTION_IDS = SITE_SECTIONS.map((section) => section.id);

/**
 * Navbar de la portada: el logo y el nombre en una sola línea, y los enlaces a las secciones
 * (el de la que se está leyendo, marcado). Desde tablet chica para abajo, un menú ☰.
 */
export default function SiteNavbar({ isContentReady }: { isContentReady: boolean }) {
  const activeId = useActiveSection(SECTION_IDS, isContentReady);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const goTo = (id: string) => {
    setIsMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur">
      <nav aria-label="Secciones" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <a
          href="#inicio"
          onClick={(event) => {
            event.preventDefault();
            goTo("inicio");
          }}
          className="flex shrink-0 items-center gap-2.5 font-heading text-lg font-extrabold whitespace-nowrap text-primary"
        >
          <img src="/logo.png" alt="" className="size-9" />
          {SITE.shortName}
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {SITE_SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  goTo(section.id);
                }}
                aria-current={activeId === section.id ? "true" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  activeId === section.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {section.label}
              </a>
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

      {/* Firma: la franja de las seis manos del logo. */}
      <div aria-hidden className="rainbow-band h-1" />

      <AnimatePresence>
        {isMenuOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full border-b border-border bg-background px-4 py-3 shadow-elevated lg:hidden"
          >
            {SITE_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(section.id);
                  }}
                  className={cn(
                    "flex min-h-12 items-center rounded-md px-3 text-base font-semibold",
                    activeId === section.id ? "text-primary" : "text-foreground",
                  )}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}

import { buttonVariants } from "@juveco/ui/components/button";
import { cn } from "@juveco/ui/lib/utils";
import { ArrowDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useState } from "react";

import { EASE_OUT } from "@/common/constants/motion";
import { HERO_SLIDES, SITE } from "@/modules/public/data/site";
import { scrollToSection } from "@/modules/public/utils/scroll";

const SLIDE_MS = 6000;
/* Cuánto baja la foto mientras se hace scroll: se mueve más lento que la página. */
const PARALLAX_PX = 120;

/**
 * Inicio de la portada (Thony, 2026-11-25): las fotos de los proyectos pasan con un fundido y
 * un zoom lento, y la foto se queda atrás al bajar (parallax). Se pausa con el mouse o el foco encima
 * o con la pestaña oculta; con «menos movimiento», queda en la primera foto sin efectos.
 *
 * Una foto que todavía no está en `public/portada/` se salta; sin ninguna, queda el azul liso. Las fotos verticales se anclan con `objectPosition`.
 */
export default function HeroCarousel({ hasEvent = true }: { hasEvent?: boolean }) {
  const isReduced = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const { scrollY } = useScroll();
  const photoY = useTransform(scrollY, [0, 600], [0, isReduced ? 0 : PARALLAX_PX]);

  const slides = HERO_SLIDES.filter((slide) => !missing.includes(slide.image));
  const slideCount = slides.length;
  const isPaused = isHovered || isFocused;
  const slide = slideCount > 0 ? slides[index % slideCount] : undefined;

  useEffect(() => {
    if (isReduced || isPaused || slideCount < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setIndex((current) => (current + 1) % slideCount);
      }
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [isReduced, isPaused, slideCount, index]);

  return (
    <section
      id="inicio"
      aria-roledescription="carrusel"
      aria-label="Fotos de Juveco"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className="relative isolate flex min-h-[64svh] scroll-mt-16 items-end overflow-hidden bg-linear-to-br from-primary to-[#14214A]"
    >
      <motion.div aria-hidden style={{ y: photoY }} className="absolute inset-0 -z-10">
        <AnimatePresence initial={false}>
          {slide && (
            <motion.img
              key={slide.image}
              src={slide.image}
              alt=""
              decoding="async"
              onError={() => setMissing((current) => [...current, slide.image])}
              style={{ objectPosition: slide.objectPosition }}
              className="absolute inset-0 size-full object-cover"
              initial={{ opacity: 0, scale: isReduced ? 1 : 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 1.2 }, scale: { duration: SLIDE_MS / 1000 + 1.2, ease: "linear" } }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Oscurece abajo y a la izquierda (donde va el texto) para que se lea sobre cualquier foto. */}
      {slide && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-t from-[#0b1330]/90 via-[#0b1330]/65 to-[#0b1330]/10"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-r from-[#0b1330]/70 via-[#0b1330]/30 to-transparent"
          />
        </>
      )}

      <div className={cn("mx-auto w-full max-w-6xl px-4 pt-20 md:px-6", hasEvent ? "pb-24 md:pb-28" : "pb-12 md:pb-16")}>
        <motion.div
          initial={isReduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="max-w-xl text-white"
        >
          {/* El nombre es el título (Thony, 2026-11-28): blanco, 700, 24px. El dorado suelto se perdía en fotos claras. */}
          <h1 className="font-heading text-2xl leading-tight font-bold uppercase">{SITE.fullName}</h1>
          <p className="mt-3 text-base text-white/85">{SITE.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {hasEvent && (
              <button
                type="button"
                onClick={() => scrollToSection("evento")}
                className={buttonVariants({ variant: "gold" })}
              >
                Lo que hacemos ahora
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection("nosotros")}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white",
              )}
            >
              Conócenos
              <ArrowDown />
            </button>
          </div>
        </motion.div>

        {slideCount > 1 && slide && (
          <div className="mt-8 flex items-center gap-4 text-sm text-white/80">
            <div className="flex">
              {slides.map((item, dotIndex) => (
                <button
                  key={item.image}
                  type="button"
                  aria-label={`Ver foto: ${item.caption}`}
                  aria-current={item.image === slide.image ? "true" : undefined}
                  onClick={() => setIndex(dotIndex)}
                  className="flex size-11 cursor-pointer items-center justify-center"
                >
                  <span
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      item.image === slide.image ? "w-6 bg-white" : "w-1.5 bg-white/50",
                    )}
                  />
                </button>
              ))}
            </div>
            <span
              aria-live={isPaused ? "polite" : "off"}
              className="rounded-full bg-black/55 px-3 py-1 font-medium text-white backdrop-blur-sm"
            >
              {slide.caption}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

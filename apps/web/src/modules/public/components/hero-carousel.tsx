import { buttonVariants } from "@juveco/ui/components/button";
import { cn } from "@juveco/ui/lib/utils";
import { ArrowDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useState } from "react";

import { HERO_SLIDES, SITE } from "@/modules/public/data/site";
import { scrollToSection } from "@/modules/public/utils/scroll";

import SiteImage from "./site-image";

const SLIDE_MS = 6000;
/* Cuánto baja la foto mientras se hace scroll: se mueve más lento que la página. */
const PARALLAX_PX = 120;

/**
 * Inicio de la portada (Thony, 2026-11-25): las fotos de los proyectos pasan con un fundido y
 * un zoom lento, y la foto se queda atrás al bajar (parallax). Se pausa con el mouse encima o
 * con la pestaña oculta; con «menos movimiento», queda en la primera foto sin efectos.
 */
export default function HeroCarousel() {
  const isReduced = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { scrollY } = useScroll();
  const photoY = useTransform(scrollY, [0, 600], [0, isReduced ? 0 : PARALLAX_PX]);

  const slideCount = HERO_SLIDES.length;

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
  }, [isReduced, isPaused, slideCount]);

  const slide = HERO_SLIDES[index];

  return (
    <section
      id="inicio"
      aria-roledescription="carrusel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative isolate flex min-h-[78svh] scroll-mt-16 items-end overflow-hidden bg-[#14214A] md:min-h-[82svh]"
    >
      <motion.div aria-hidden style={{ y: photoY }} className="absolute inset-0 -z-10">
        <AnimatePresence initial={false}>
          {slide && (
            <motion.div
              key={slide.image}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: isReduced ? 1 : 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 1.2 }, scale: { duration: SLIDE_MS / 1000 + 1.2, ease: "linear" } }}
            >
              <SiteImage src={slide.image} alt="" isPriority={index === 0} hasIconFallback={false} className="size-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Oscurece abajo para que el texto se lea sobre cualquier foto. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-[#0b1330]/90 via-[#0b1330]/45 to-[#0b1330]/10" />

      <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-14 md:px-6 md:pb-20">
        <motion.div
          initial={isReduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-white"
        >
          <p className="mb-3 text-sm font-bold tracking-widest text-gold uppercase">{SITE.fullName}</p>
          <h1 className="font-heading text-4xl leading-tight font-extrabold tracking-tight md:text-6xl">
            {SITE.tagline}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">{SITE.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollToSection("eventos")}
              className={cn(buttonVariants({ size: "lg" }), "cursor-pointer bg-gold text-gold-foreground hover:bg-gold/90")}
            >
              Lo que hacemos ahora
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("nosotros")}
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "cursor-pointer border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white",
              )}
            >
              Conócenos
              <ArrowDown />
            </button>
          </div>
        </motion.div>

        {slideCount > 1 && (
          <div className="mt-10 flex items-center gap-4 text-sm text-white/80">
            <div className="flex gap-2">
              {HERO_SLIDES.map((item, dotIndex) => (
                <button
                  key={item.image}
                  type="button"
                  aria-label={`Ver foto: ${item.caption}`}
                  aria-current={dotIndex === index ? "true" : undefined}
                  onClick={() => setIndex(dotIndex)}
                  className="flex size-6 cursor-pointer items-center justify-center"
                >
                  <span
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      dotIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/50",
                    )}
                  />
                </button>
              ))}
            </div>
            {slide && <span aria-live="polite">{slide.caption}</span>}
          </div>
        )}
      </div>
    </section>
  );
}

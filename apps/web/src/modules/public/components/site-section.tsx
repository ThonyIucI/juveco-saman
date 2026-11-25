import { cn } from "@juveco/ui/lib/utils";
import type { ReactNode } from "react";

import { Reveal } from "./reveal";

const TONE_CLASSES = {
  plain: "border-border bg-background",
  muted: "border-border bg-page",
  navy: "border-white/10 bg-[#14214A] text-white",
} as const;

interface ISiteSectionProps {
  /** Opcional: el evento lleva su `id` en un contenedor fijo (ver `routes/index.tsx`). */
  id?: string;
  /** Las secciones alternan fondo blanco y gris claro; `navy` es el azul marino del logo (igual en oscuro). */
  tone?: "plain" | "muted" | "navy";
  /** La palabra chica sobre el título: «Nosotros», «Proyectos». */
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}

/**
 * Una sección del inicio a todo el ancho, con el contenido en el contenedor común
 * (`max-w-6xl`). Cada una lleva una línea arriba, además del fondo alternado, para que se
 * note dónde empieza (Thony, 2026-11-25). Letras solo de 12, 14, 16, 20 y 24 px.
 */
export default function SiteSection({ id, tone = "plain", eyebrow, title, intro, children }: ISiteSectionProps) {
  const isNavy = tone === "navy";

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-16 border-t py-10 md:py-20",
        TONE_CLASSES[tone],
      )}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="mb-6 max-w-2xl md:mb-10">
          {eyebrow && (
            <p
              className={cn(
                "mb-2 text-xs font-semibold tracking-widest uppercase",
                isNavy ? "text-gold" : "text-primary dark:text-blue-400",
              )}
            >
              {eyebrow}
            </p>
          )}
          <h2 className={cn("font-heading text-2xl font-semibold tracking-tight", isNavy ? "text-white" : "text-foreground")}>
            {title}
          </h2>
          {intro && <p className={cn("mt-2 text-base", isNavy ? "text-white/80" : "text-muted-foreground")}>{intro}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

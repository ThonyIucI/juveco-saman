import { cn } from "@juveco/ui/lib/utils";
import type { ReactNode } from "react";

import { Reveal } from "./reveal";

interface ISiteSectionProps {
  /** Opcional: el evento lleva su `id` en un contenedor fijo (ver `routes/index.tsx`). */
  id?: string;
  /** Las secciones alternan fondo blanco y gris claro. */
  tone?: "plain" | "muted";
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
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-16 border-t border-border py-14 md:py-20",
        tone === "muted" ? "bg-page" : "bg-background",
      )}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="mb-8 max-w-2xl md:mb-10">
          {eyebrow && <p className="mb-2 text-xs font-semibold tracking-widest text-primary uppercase dark:text-blue-400">{eyebrow}</p>}
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
          {intro && <p className="mt-2 text-base text-muted-foreground">{intro}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

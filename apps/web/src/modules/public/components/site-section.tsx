import { cn } from "@juveco/ui/lib/utils";
import type { ReactNode } from "react";

import { Reveal } from "./reveal";

interface ISiteSectionProps {
  id: string;
  /** Las secciones alternan fondo blanco y gris claro. */
  tone?: "plain" | "muted";
  /** La palabra chica sobre el título: «Nosotros», «Proyectos». */
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}

/**
 * Una sección de la portada a todo el ancho, con el contenido en el contenedor común
 * (`max-w-6xl`). El encabezado aparece al llegar con el scroll.
 */
export default function SiteSection({ id, tone = "plain", eyebrow, title, intro, children }: ISiteSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-16 py-16 md:py-24", tone === "muted" ? "bg-page" : "bg-background")}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="mb-10 max-w-2xl md:mb-12">
          {eyebrow && (
            <p className="mb-2 text-sm font-bold tracking-widest text-primary uppercase">{eyebrow}</p>
          )}
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">{title}</h2>
          {intro && <p className="mt-3 text-lg text-muted-foreground">{intro}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

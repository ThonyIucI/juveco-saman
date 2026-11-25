import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface IPublicSectionProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  /** Una línea bajo el título: la fecha, de qué se trata. */
  subtitle?: ReactNode;
  children: ReactNode;
}

/** Una card de la portada: encabezado gris con el título y el cuerpo debajo (como las del panel). */
export default function PublicSection({ id, icon: Icon, title, subtitle, children }: IPublicSectionProps) {
  return (
    <section id={id} className="scroll-mt-20 overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-start gap-3 border-b border-border bg-muted/50 px-4 py-3">
        <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

import { Skeleton } from "@juveco/ui/components/skeleton";
import type { ReactNode } from "react";

interface IPageHeaderProps {
  title: string;
  /** Contadores del listado («3 negocios · 2 activos»). */
  subtitle?: string;
  isLoadingSubtitle?: boolean;
  /** Acción principal, a la derecha (p. ej. «Crear»). */
  action?: ReactNode;
}

/** Encabezado estándar de un módulo: título, contadores y la acción principal. */
export default function PageHeader({ title, subtitle, isLoadingSubtitle, action }: IPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
        {isLoadingSubtitle ? (
          <Skeleton className="mt-1.5 h-4 w-32 rounded-md" />
        ) : (
          subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

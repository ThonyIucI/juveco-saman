import { Skeleton } from "@juveco/ui/components/skeleton";
import type { ReactNode } from "react";

import { FADE_IN_CLASS } from "@/common/constants/motion";

interface IPageHeaderProps {
  title: string;
  /** Pegado al título (p. ej. el botón de sincronizar). */
  titleAction?: ReactNode;
  /** Contadores del listado («3 negocios · 2 activos»). */
  subtitle?: string;
  isLoadingSubtitle?: boolean;
  /** Acción principal, a la derecha (p. ej. «Crear»). */
  action?: ReactNode;
}

/** Encabezado estándar de un módulo: título, contadores y la acción principal. */
export default function PageHeader({ title, titleAction, subtitle, isLoadingSubtitle, action }: IPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-xl font-semibold text-foreground">{title}</h1>
          {titleAction}
        </div>
        {isLoadingSubtitle ? (
          <Skeleton className="mt-1.5 h-4 w-32 rounded-md" />
        ) : (
          subtitle && <p className={`mt-0.5 text-sm text-muted-foreground ${FADE_IN_CLASS}`}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

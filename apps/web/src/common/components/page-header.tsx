import { IconButton } from "@juveco/ui/components/icon-button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { FADE_IN_CLASS } from "@/common/constants/motion";

interface IPageHeaderProps {
  title: string;
  /** Pegado al título (p. ej. el botón de sincronizar). */
  titleAction?: ReactNode;
  /** Contadores del listado («3 negocios · 2 activos») o contenido con íconos (`ActivityMeta`). */
  subtitle?: ReactNode;
  isLoadingSubtitle?: boolean;
  /** Acción principal, a la derecha (p. ej. «Crear»). */
  action?: ReactNode;
  /** Volver: un chevron a la izquierda del título, sin texto (Thony, 2026-11-11). */
  back?: { label: string; onClick: () => void };
}

/** Encabezado estándar de un módulo: título, contadores y la acción principal. */
export default function PageHeader({ title, titleAction, subtitle, isLoadingSubtitle, action, back }: IPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-start gap-1">
        {back && (
          /* Centrado con la línea del título (28 px) y pegado al borde, como el texto de abajo. */
          <IconButton label={back.label} size="xs" className="-my-0.5 -ml-2 shrink-0" onClick={back.onClick}>
            <ChevronLeft className="size-5" />
          </IconButton>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-semibold text-foreground">{title}</h1>
            {/*
              Sin alto propio: el botón (36 px) estiraba la fila del título (28 px) y dejaba
              aire de más antes del subtítulo (Thony, 2026-11-11).
            */}
            {titleAction && <div className="-my-2 flex items-center">{titleAction}</div>}
          </div>
          {isLoadingSubtitle ? (
            <Skeleton className="mt-1 h-4 w-32 rounded-md" />
          ) : (
            subtitle && <div className={`mt-0.5 text-sm text-muted-foreground ${FADE_IN_CLASS}`}>{subtitle}</div>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

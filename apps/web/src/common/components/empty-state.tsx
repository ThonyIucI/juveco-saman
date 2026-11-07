import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface IEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** CTA para salir del vacío (p. ej. «Crear el primero»). */
  action?: ReactNode;
}

/** Estado vacío de un listado: ícono, título y, si aplica, cómo salir de ahí. */
export default function EmptyState({ icon: Icon, title, description, action }: IEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-7 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <p className="mt-4 font-heading text-base font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

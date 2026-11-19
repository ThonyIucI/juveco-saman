import type { IProjectProgress, IProjectResource } from "@juveco/shared/projects";
import { formatSoles } from "@juveco/shared/money";

interface IProjectProgressCardProps {
  project: Pick<IProjectResource, "goalAmount" | "beneficiaryCount">;
  progress: IProjectProgress;
}

/**
 * Lo ganado hasta hoy (cobrado menos premios comprados y gastos de sus actividades) contra la
 * meta, si la hay. Sin meta no se dibuja el avance.
 */
export default function ProjectProgressCard({ project, progress }: IProjectProgressCardProps) {
  const { goalAmount, beneficiaryCount } = project;
  const percent = goalAmount ? Math.min(100, Math.max(0, Math.round((progress.currentProfit / goalAmount) * 100))) : null;

  return (
    <div className="space-y-3 rounded-sm border border-border bg-card p-4">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <p className="text-sm text-muted-foreground">Ganado hasta hoy</p>
          <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
            {formatSoles(progress.currentProfit)}
          </p>
        </div>
        {goalAmount !== null && (
          <p className="text-sm text-muted-foreground tabular-nums">
            Meta <span className="font-semibold text-foreground">{formatSoles(goalAmount)}</span>
          </p>
        )}
      </div>

      {percent !== null && (
        <div className="space-y-1.5">
          <div
            role="progressbar"
            aria-label="Avance contra la meta"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">{percent}% de la meta</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Cobrado</dt>
          <dd className="font-semibold tabular-nums">{formatSoles(progress.collected)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Por cobrar</dt>
          <dd className="font-semibold tabular-nums">{formatSoles(progress.expected - progress.collected)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Premios y gastos</dt>
          <dd className="font-semibold tabular-nums">
            {formatSoles(progress.purchasedPrizes + progress.expenses)}
          </dd>
        </div>
        {beneficiaryCount !== null && (
          <div>
            <dt className="text-muted-foreground">Beneficiarios</dt>
            <dd className="font-semibold tabular-nums">{beneficiaryCount}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

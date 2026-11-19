import { Button } from "@juveco/ui/components/button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { type IProjectResource, projectDateLabels, projectTypeLabels } from "@juveco/shared/projects";
import { IconButton } from "@juveco/ui/components/icon-button";
import { activityTypeLabels } from "@juveco/shared/activities";
import { formatSoles } from "@juveco/shared/money";
import { EUserRole } from "@juveco/shared/roles";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, FolderKanban, Lock, LockOpen, Pencil } from "lucide-react";
import { useEffect } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import PageBox from "@/common/components/page-box";
import PageHeader from "@/common/components/page-header";
import { useBoolean } from "@/common/hooks/use-boolean";
import { formatDayMonth, formatShortDate } from "@/common/utils/format-date";
import ProjectFormModal from "@/modules/projects/components/project-form-modal";
import ProjectProgressCard from "@/modules/projects/components/project-progress-card";
import ProjectStatusBadge from "@/modules/projects/components/project-status-badge";
import { useGetProject } from "@/modules/projects/hooks/use-get-project";
import { useSetProjectClosed } from "@/modules/projects/hooks/use-set-project-closed";

export const Route = createFileRoute("/_app/proyectos/$projectId")({
  component: ProjectDetailPage,
});

/* «21 nov 2026» o «21 nov 2026 – 23 nov»: corto, para que entre en celular. */
const datesText = (project: IProjectResource): string =>
  project.endDate
    ? `${formatShortDate(project.startDate)} – ${formatDayMonth(project.endDate)}`
    : formatShortDate(project.startDate);

/** Un evento o proyecto: lo ganado contra la meta y sus actividades. */
function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { user: me } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  const GetProject = useGetProject();
  const SetClosed = useSetProjectClosed();
  const showForm = useBoolean();
  const showConfirm = useBoolean();

  const isSuperadmin = me.role === EUserRole.SUPERADMIN;
  const { detail } = GetProject;
  const project = detail?.project ?? null;
  const isClosed = project?.closedAt != null;

  const load = (signal?: AbortSignal) => GetProject.handler(projectId, signal);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const confirmToggle = async () => {
    if (!project) {
      return;
    }
    const result = isClosed ? await SetClosed.reopen(project.id) : await SetClosed.close(project.id);
    showConfirm.off();
    if (result) {
      await load();
    }
  };

  const openActivity = (activityId: string) =>
    navigate({ to: "/actividades/$activityId", params: { activityId } });

  /* Reabrir es solo del superadmin: el admin ve el estado y nada más. */
  const canToggle = project !== null && (!isClosed || isSuperadmin);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-4 p-4">
      {/* El cuerpo llega hasta abajo: si no, la caja blanca parece recortada (Thony, 2026-11-17). */}
      <PageBox>
        <PageHeader
          title={project?.name ?? "Proyecto"}
          titleAction={project && <ProjectStatusBadge closedAt={project.closedAt} />}
          back={{ label: "Volver a proyectos", onClick: () => navigate({ to: "/proyectos" }) }}
          isLoadingSubtitle={!project}
          subtitle={
            project && (
              <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span>{projectTypeLabels[project.type]}</span>
                <span aria-hidden className="h-4 w-px bg-border" />
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <CalendarDays aria-hidden className="size-4 shrink-0" />
                  {/* La etiqueta («Fecha del evento», «Inicio») solo donde hay espacio. */}
                  <span className="hidden md:inline">{projectDateLabels[project.type].start}:</span>
                  {datesText(project)}
                </span>
              </span>
            )
          }
          action={
            project && (
              /*
                Una sola acción principal (Thony, 2026-11-17): cerrar o reabrir en primario;
                editar, frecuente, como ícono con borde. En celular, las dos como íconos.
              */
              <div className="flex shrink-0 items-center gap-2">
                {!isClosed && (
                  <IconButton label="Editar" size="lg" isBordered onClick={showForm.on}>
                    <Pencil />
                  </IconButton>
                )}
                {canToggle && (
                  <>
                    <IconButton
                      label={isClosed ? "Reabrir" : "Cerrar"}
                      size="lg"
                      tone="primary"
                      isFilled
                      className="md:hidden"
                      onClick={showConfirm.on}
                    >
                      {isClosed ? <LockOpen /> : <Lock />}
                    </IconButton>
                    <Button type="button" size="lg" className="hidden md:inline-flex" onClick={showConfirm.on}>
                      {isClosed ? <LockOpen /> : <Lock />}
                      {isClosed ? "Reabrir" : "Cerrar"}
                    </Button>
                  </>
                )}
              </div>
            )
          }
        />
        {project?.description && <p className="mt-3 text-sm text-foreground">{project.description}</p>}
      </PageBox>

      <PageBox className="space-y-4 md:flex-1">
        {!detail ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (
          <>
            <ProjectProgressCard project={detail.project} progress={detail.progress} />

            <h2 className="font-heading text-base font-semibold text-foreground">Actividades</h2>
            {detail.activities.length === 0 ? (
              <EmptyState icon={FolderKanban} title="Este proyecto todavía no tiene actividades" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {detail.activities.map((activity) => (
                  <article
                    key={activity.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver ${activity.name}`}
                    onClick={() => openActivity(activity.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openActivity(activity.id);
                      }
                    }}
                    className="cursor-pointer overflow-hidden rounded-sm border border-border bg-card transition-colors outline-none hover:border-primary/40 focus-visible:ring-4 focus-visible:ring-ring/30"
                  >
                    <div className="border-b border-border bg-muted px-3 py-2.5">
                      <p className="truncate font-heading text-base font-bold text-foreground">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {activityTypeLabels[activity.type]} · {formatShortDate(activity.eventDate)}
                      </p>
                    </div>
                    <div className="p-3 text-sm">
                      <p className="text-muted-foreground">Ganado hasta hoy</p>
                      <p className="font-semibold tabular-nums">{formatSoles(activity.balance.currentProfit)}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </PageBox>

      {project && (
        <ProjectFormModal
          open={showForm.active}
          project={project}
          onClose={showForm.off}
          onSaved={() => load()}
        />
      )}

      <ConfirmModal
        open={showConfirm.active}
        title={isClosed ? "¿Reabrir?" : "¿Cerrar?"}
        description={
          isClosed
            ? "Se podrán registrar cartillas, pagos, premios y gastos otra vez."
            : "Ya no se podrán registrar cartillas, pagos, premios ni gastos en este proyecto ni en sus actividades. Solo el superadministrador puede reabrirlo."
        }
        confirmLabel={isClosed ? "Reabrir" : "Cerrar"}
        variant={isClosed ? "default" : "destructive"}
        loading={SetClosed.loading}
        onConfirm={confirmToggle}
        onCancel={showConfirm.off}
      />
    </div>
  );
}

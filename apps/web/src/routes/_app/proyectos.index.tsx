import { Button } from "@juveco/ui/components/button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import type { IProjectResource } from "@juveco/shared/projects";
import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban, Plus } from "lucide-react";
import { useEffect } from "react";

import EmptyState from "@/common/components/empty-state";
import PageBox from "@/common/components/page-box";
import PageHeader from "@/common/components/page-header";
import { useBoolean } from "@/common/hooks/use-boolean";
import ProjectCard from "@/modules/projects/components/project-card";
import ProjectFormModal from "@/modules/projects/components/project-form-modal";
import { useListProjects } from "@/modules/projects/hooks/use-list-projects";

export const Route = createFileRoute("/_app/proyectos/")({
  component: ProjectsPage,
});

/** Eventos y proyectos de Juveco: lo que agrupa las actividades (la Chocolatada, el mural…). */
function ProjectsPage() {
  const ListProjects = useListProjects();
  const showForm = useBoolean();
  const navigate = Route.useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    ListProjects.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projects = ListProjects.projects ?? [];
  const isLoading = ListProjects.projects === null;

  const openProject = (project: IProjectResource) =>
    navigate({ to: "/proyectos/$projectId", params: { projectId: project.id } });

  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-4 p-4">
      {/* El cuerpo llega hasta abajo: si no, la caja blanca parece recortada (Thony, 2026-11-17). */}
      <PageBox>
        <PageHeader
          title="Proyectos"
          subtitle={projects.length > 0 ? `${projects.length} en total` : undefined}
          isLoadingSubtitle={isLoading}
          action={
            <Button type="button" size="lg" onClick={showForm.on}>
              <Plus />
              Agregar
            </Button>
          }
        />
      </PageBox>

      <PageBox className="md:flex-1">
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Todavía no hay eventos ni proyectos"
            action={
              <Button type="button" onClick={showForm.on}>
                <Plus />
                Crear el primero
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onOpen={() => openProject(project)} />
            ))}
          </div>
        )}
      </PageBox>

      <ProjectFormModal
        open={showForm.active}
        onClose={showForm.off}
        onSaved={openProject}
      />
    </div>
  );
}

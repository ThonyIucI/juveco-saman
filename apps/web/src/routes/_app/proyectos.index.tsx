import { Button } from "@juveco/ui/components/button";
import type { IProjectResource } from "@juveco/shared/projects";
import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban, Plus } from "lucide-react";
import { useEffect } from "react";

import EmptyState from "@/common/components/empty-state";
import Loadable from "@/common/components/loadable";
import PageBox from "@/common/components/page-box";
import PageContainer from "@/common/components/page-container";
import PageHeader from "@/common/components/page-header";
import { useBoolean } from "@/common/hooks/use-boolean";
import ProjectCard from "@/modules/projects/components/project-card";
import ProjectFormModal from "@/modules/projects/components/project-form-modal";
import { ProjectGridSkeleton } from "@/modules/projects/components/project-skeletons";
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
    <PageContainer>
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

      <PageBox isFill>
        <Loadable isLoading={isLoading} skeleton={<ProjectGridSkeleton />}>
        {projects.length === 0 ? (
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
        </Loadable>
      </PageBox>

      <ProjectFormModal
        open={showForm.active}
        onClose={showForm.off}
        onSaved={openProject}
      />
    </PageContainer>
  );
}

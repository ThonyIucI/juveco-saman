import { Badge } from "@juveco/ui/components/badge";
import { type IProjectResource, projectTypeLabels } from "@juveco/shared/projects";
import { CalendarDays } from "lucide-react";

import { formatShortDate } from "@/common/utils/format-date";
import ProjectStatusBadge from "@/modules/projects/components/project-status-badge";

interface IProjectCardProps {
  project: IProjectResource;
  onOpen: () => void;
}

/** Un evento o proyecto en el listado: nombre y estado arriba; fecha y actividades abajo. */
export default function ProjectCard({ project, onOpen }: IProjectCardProps) {
  const activities = project.activityCount === 1 ? "1 actividad" : `${project.activityCount} actividades`;
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver ${project.name}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer overflow-hidden rounded-sm border border-border bg-card transition-colors outline-none hover:border-primary/40 focus-visible:ring-4 focus-visible:ring-ring/30"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted px-3 py-2.5">
        <p className="truncate font-heading text-base font-bold text-foreground">{project.name}</p>
        <ProjectStatusBadge closedAt={project.closedAt} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 p-3 text-sm text-foreground">
        <Badge color="primary" className="rounded-md">
          {projectTypeLabels[project.type]}
        </Badge>
        <span className="inline-flex items-center gap-2">
          <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
          <span className="font-semibold">{formatShortDate(project.startDate)}</span>
        </span>
        <span className="text-muted-foreground">{activities}</span>
      </div>
    </article>
  );
}

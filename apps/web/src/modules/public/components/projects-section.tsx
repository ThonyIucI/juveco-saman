import { Badge } from "@juveco/ui/components/badge";
import { useState } from "react";

import { type ISiteProject, PROJECTS, siteProjectStatusLabels } from "@/modules/public/data/site";

import Expandable from "./expandable";
import { RevealGroup, RevealItem } from "./reveal";
import SiteSection from "./site-section";

/* Se ven las primeras obras; las de la gestión anterior, tras «Ver más obras». */
const VISIBLE_PROJECTS = 3;
const hiddenProjects = PROJECTS.slice(VISIBLE_PROJECTS);

function ProjectGrid({ projects }: { projects: ISiteProject[] }) {
  return (
    <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <RevealItem key={project.id}>
          <ProjectCard project={project} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/** Los proyectos de la Juveco (obras para el barrio), cada uno con su foto. */
export default function ProjectsSection() {
  return (
    <SiteSection
      id="proyectos"
      tone="muted"
      eyebrow="Proyectos"
      title="Lo que estamos construyendo"
      intro="Obras que gestionamos juntos para mejorar Samán."
    >
      <ProjectGrid projects={PROJECTS.slice(0, VISIBLE_PROJECTS)} />
      {hiddenProjects.length > 0 && (
        <Expandable label="Ver más obras" className="mt-4">
          <div className="pt-4">
            <ProjectGrid projects={hiddenProjects} />
          </div>
        </Expandable>
      )}
    </SiteSection>
  );
}

function ProjectCard({ project }: { project: ISiteProject }) {
  /* Si la foto todavía no está en `public/portada/`, la card va sin imagen, no con una rota. */
  const [hasPhoto, setHasPhoto] = useState(true);

  return (
    <article className="group h-full overflow-hidden rounded-lg border border-border bg-card">
      {hasPhoto && (
        <div className="aspect-4/3 overflow-hidden">
          <img
            src={project.image}
            alt={project.name}
            loading="lazy"
            decoding="async"
            onError={() => setHasPhoto(false)}
            style={{ objectPosition: project.objectPosition }}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-base font-medium text-foreground">{project.name}</h3>
        {(project.status || project.tag) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {project.status && (
              <Badge color={project.status === "DONE" ? "success" : "primary"} className="rounded-md">
                {siteProjectStatusLabels[project.status]}
              </Badge>
            )}
            {project.tag && (
              <Badge color="neutral" className="rounded-md">
                {project.tag}
              </Badge>
            )}
          </div>
        )}
        {project.description && <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>}
      </div>
    </article>
  );
}

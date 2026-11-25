import { Badge } from "@juveco/ui/components/badge";

import { PROJECTS, siteProjectStatusLabels } from "@/modules/public/data/site";

import { RevealGroup, RevealItem } from "./reveal";
import SiteImage from "./site-image";
import SiteSection from "./site-section";

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
      <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((project) => (
          <RevealItem key={project.id}>
            <article className="group h-full overflow-hidden rounded-lg border border-border bg-card">
              <div className="aspect-4/3 overflow-hidden">
                <SiteImage
                  src={project.image}
                  alt={project.name}
                  className="size-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading text-lg font-bold text-foreground">{project.name}</h3>
                  {project.status && (
                    <Badge color={project.status === "DONE" ? "success" : "primary"} className="shrink-0 rounded-md">
                      {siteProjectStatusLabels[project.status]}
                    </Badge>
                  )}
                </div>
                {project.description && <p className="mt-2 text-muted-foreground">{project.description}</p>}
              </div>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>
    </SiteSection>
  );
}

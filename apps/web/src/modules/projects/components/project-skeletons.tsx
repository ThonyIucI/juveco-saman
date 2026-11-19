import { Skeleton } from "@juveco/ui/components/skeleton";

const SKELETON_CARD_COUNT = 3;

/* La misma forma que `ProjectCard`: header gris con nombre y estado, cuerpo con tipo y fecha. */
function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted px-3 py-2.5">
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      <div className="flex items-center gap-3 p-3">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
    </div>
  );
}

/** La grilla de proyectos mientras carga. */
export function ProjectGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** El detalle mientras carga: la card de lo ganado y una actividad. */
export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-sm border border-border bg-card p-4">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-8 w-36 rounded-md" />
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-5 w-24 rounded-md" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <div className="space-y-1.5 border-b border-border bg-muted px-3 py-2.5">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <div className="space-y-1.5 p-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

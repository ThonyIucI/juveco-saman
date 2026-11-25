import { EActivityType } from "@juveco/shared/activities";
import type { IPublicActivity } from "@juveco/shared/public";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { activitySlugOf } from "@/modules/public/utils/activity-links";

interface IActivityLinkProps {
  activity: IPublicActivity;
  className?: string;
  children: ReactNode;
}

/** El enlace a la página de detalle de una actividad: `/campeonatos/…` o `/bingos/…`. */
export default function ActivityLink({ activity, className, children }: IActivityLinkProps) {
  const params = { slug: activitySlugOf(activity) };
  return activity.type === EActivityType.CHAMPIONSHIP ? (
    <Link to="/campeonatos/$slug" params={params} className={className}>
      {children}
    </Link>
  ) : (
    <Link to="/bingos/$slug" params={params} className={className}>
      {children}
    </Link>
  );
}

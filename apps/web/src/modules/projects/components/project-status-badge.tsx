import { Badge } from "@juveco/ui/components/badge";
import { Lock } from "lucide-react";

interface IProjectStatusBadgeProps {
  closedAt: string | null;
}

/** Abierto o cerrado: un cerrado no recibe cosas nuevas. */
export default function ProjectStatusBadge({ closedAt }: IProjectStatusBadgeProps) {
  return closedAt ? (
    <Badge color="neutral" variant="soft" className="shrink-0 rounded-md">
      <Lock aria-hidden />
      Cerrado
    </Badge>
  ) : (
    <Badge color="success" variant="soft" className="shrink-0 rounded-md">
      Abierto
    </Badge>
  );
}

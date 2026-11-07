import { Badge } from "@juveco/ui/components/badge";
import { EUserRole, type TUserRole, userRoleLabels } from "@juveco/shared/roles";

interface IRoleBadgeProps {
  role: TUserRole;
}

/** Solo quien entra a la app lleva insignia: un usuario común no necesita una. */
export default function RoleBadge({ role }: IRoleBadgeProps) {
  if (role === EUserRole.USER) {
    return null;
  }
  return <Badge color="primary">{userRoleLabels[role]}</Badge>;
}

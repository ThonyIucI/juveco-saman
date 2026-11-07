import { Skeleton } from "@juveco/ui/components/skeleton";
import type { IUserResource } from "@juveco/shared/users";
import { fullName } from "@juveco/shared/people";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import WhatsAppButton from "@/common/components/whatsapp-button";
import { formatMonthYear } from "@/common/utils/format-date";

import RoleBadge from "./role-badge";
import UserWhatsAppValue from "./user-whatsapp-value";

interface IUserCardProps {
  user: IUserResource;
  actions: IRowAction[];
  onOpen: () => void;
}

/**
 * Card de un usuario:
 * - **Cabecera** (fondo gris): sus iniciales en su color, el nombre con su rol (si entra a
 *   la app) y debajo «Registrado en oct 2026». A la derecha, WhatsApp y `⋯`.
 * - **Cuerpo:** «WhatsApp» (el número o el usuario) y «Barrio».
 * - **Sin nota:** se ve solo en el detalle.
 *
 * La cabecera abre el detalle: el cuerpo no, porque ahí se mantiene
 * presionado el número para copiarlo.
 */
export default function UserCard({ user, actions, onOpen }: IUserCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center justify-between gap-2 bg-muted px-3 py-3">
        {/* Toda la cabecera abre el detalle; WhatsApp y `⋯` no. */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Ver a ${fullName(user)}`}
          onClick={onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen();
            }
          }}
          className="-m-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl p-1"
        >
          <InitialsAvatar name={fullName(user)} color={avatarColorOf(fullName(user))} />
          <div className="min-w-0">
            <p className="flex min-w-0 items-center gap-2">
              <span className="truncate font-heading font-semibold text-foreground">{fullName(user)}</span>
              <RoleBadge role={user.role} />
            </p>
            <p className="text-muted-foreground">Registrado en {formatMonthYear(user.createdAt)}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <WhatsAppButton phone={user.phone} username={user.whatsappUsername} />
          <RowActions actions={actions} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground">WhatsApp</p>
          <UserWhatsAppValue user={user} />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground">Barrio</p>
          {/* En su color, como en las cartillas (Thony, 2026-11-07); sin barrio, vacío. */}
          {user.neighborhood && <NeighborhoodBadge neighborhood={user.neighborhood} />}
        </div>
      </div>
    </article>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center gap-3 bg-muted px-4 py-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>
      <div className="px-4 py-3">
        <Skeleton className="h-10 w-1/2 rounded-lg" />
      </div>
    </div>
  );
}

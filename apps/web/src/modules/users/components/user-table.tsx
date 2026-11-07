import { Skeleton } from "@juveco/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@juveco/ui/components/table";
import type { IUserResource } from "@juveco/shared/users";
import { fullName } from "@juveco/shared/people";
import type { ReactNode } from "react";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import WhatsAppButton from "@/common/components/whatsapp-button";

import RoleBadge from "./role-badge";
import UserWhatsAppValue from "./user-whatsapp-value";

const SKELETON_COUNT = 4;
const COLUMN_COUNT = 5;

interface IUserTableProps {
  users: IUserResource[];
  isLoading: boolean;
  buildActions: (user: IUserResource) => IRowAction[];
  onOpen: (user: IUserResource) => void;
  /** El paginado, dentro de la card (como el saas). */
  footer?: ReactNode;
}

/**
 * Tabla de escritorio. Oculta en celular: allí se usa `UserMobileList`. Usuario · Rol ·
 * Barrio · WhatsApp · acciones con borde. Sin nota. Tocar la fila abre el detalle; copiar,
 * WhatsApp y `⋯` no.
 */
export default function UserTable({
  users,
  isLoading,
  buildActions,
  onOpen,
  footer,
}: IUserTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-md bg-card shadow-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-[32%]">Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Barrio</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: COLUMN_COUNT }, (_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-5 w-full max-w-32 rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => onOpen(user)}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <InitialsAvatar name={fullName(user)} color={avatarColorOf(fullName(user))} />
                      <span className="truncate font-heading font-semibold text-foreground">
                        {fullName(user)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className={user.neighborhood ? "text-foreground" : "text-muted-foreground"}>
                    {user.neighborhood?.name ?? "Sin barrio"}
                  </TableCell>
                  <TableCell>
                    <UserWhatsAppValue user={user} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <WhatsAppButton
                        phone={user.phone}
                        username={user.whatsappUsername}
                        isBordered
                      />
                      <RowActions actions={buildActions(user)} isBordered />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
      {footer && <div className="border-t border-border/60 px-5 py-3">{footer}</div>}
    </div>
  );
}

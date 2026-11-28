import { Badge } from "@juveco/ui/components/badge";
import { cn } from "@juveco/ui/lib/utils";
import { type IFamilyMemberResource, type IFamilyResource, familyNameOf } from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import { userConditionLabels } from "@juveco/shared/user-profiles";
import { CirclePlus, Pencil, Phone, Star, Trash2, UserMinus } from "lucide-react";

import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { FADE_IN_CLASS } from "@/common/constants/motion";
import {
  isHeadMember,
  memberPhoneLabel,
  memberSummaryLabel,
  pluralizePeople,
} from "@/modules/dwellings/utils/member-display";
import { headOf } from "@/modules/dwellings/utils/member-form";

/* Nombre y datos · acciones. La última, de ancho propio: las filas no se corren. */
const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3";

interface IMemberCompactListProps {
  families: IFamilyResource[];
  onEditMember: (member: IFamilyMemberResource) => void;
  onRemoveMember: (member: IFamilyMemberResource) => void;
  onDeleteFamily: (family: IFamilyResource) => void;
  onAddMember: () => void;
}

/**
 * Vista compacta de los integrantes en celular, con el molde de `ActivityItemCompactList`: filas
 * bajas con el nombre (⭐ si es jefe) y, debajo y en pequeño, DNI · edad · parentesco, sus badges
 * y el celular. Con 2 o más familias, cada una lleva su encabezado con `⋯`.
 */
export default function MemberCompactList({
  families,
  onEditMember,
  onRemoveMember,
  onDeleteFamily,
  onAddMember,
}: IMemberCompactListProps) {
  const isGrouped = families.length >= 2;

  const memberActions = (member: IFamilyMemberResource): IRowAction[] => [
    { icon: Pencil, label: "Editar integrante", inline: true, onClick: () => onEditMember(member) },
    { icon: UserMinus, label: "Quitar de la vivienda", variant: "destructive", onClick: () => onRemoveMember(member) },
  ];

  return (
    <div className={cn("md:hidden", FADE_IN_CLASS)}>
      {families.map((family) => {
        const familyActions: IRowAction[] = [
          { icon: Trash2, label: "Eliminar familia", variant: "destructive", onClick: () => onDeleteFamily(family) },
        ];
        return (
          <section key={family.id}>
            {isGrouped && (
              <div className={cn(ROW_GRID, "border-y border-border bg-muted/50 py-1.5 first:border-t-0")}>
                <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                  {familyNameOf(headOf(family))}
                  <span className="ml-2 font-normal text-muted-foreground">· {pluralizePeople(family.members.length)}</span>
                </p>
                <RowActions actions={familyActions} isBordered />
              </div>
            )}
            <ul className="divide-y divide-border">
              {family.members.map((member) => {
                const phoneLabel = memberPhoneLabel(family, member);
                return (
                  <li key={member.id} className={cn(ROW_GRID, "py-1.5")}>
                    <div className="min-w-0">
                      <p className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-foreground">{fullName(member)}</span>
                        {isHeadMember(member) && (
                          <Star aria-label="Jefe(a) de hogar" className="size-3.5 shrink-0 fill-primary text-primary" />
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{memberSummaryLabel(member)}</p>
                      {(member.conditions.length > 0 || phoneLabel) && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {member.conditions.map((condition) => (
                            <Badge key={condition} color="orange">
                              {userConditionLabels[condition]}
                            </Badge>
                          ))}
                          {phoneLabel && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                              <Phone aria-hidden className="size-3" />
                              {phoneLabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <RowActions actions={memberActions(member)} isBordered />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {/* Fila vacía al pie para agregar, igual que en la tabla de escritorio. */}
      <button
        type="button"
        onClick={onAddMember}
        className="flex min-h-12 w-full cursor-pointer items-center gap-2 border-t border-border px-4 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:bg-muted"
      >
        <CirclePlus aria-hidden className="size-5 text-primary" />
        Agregar integrante
      </button>
    </div>
  );
}

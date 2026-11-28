import { Badge } from "@juveco/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@juveco/ui/components/table";
import {
  type IFamilyMemberResource,
  type IFamilyResource,
  familyNameOf,
  familyRelationshipLabels,
} from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import { userConditionLabels } from "@juveco/shared/user-profiles";
import { CirclePlus, Pencil, Star, Trash2, UserMinus } from "lucide-react";

import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { FADE_IN_CLASS } from "@/common/constants/motion";
import { ageLabel } from "@/modules/dwellings/utils/dwellings";
import {
  isHeadMember,
  memberGenderLabel,
  memberPhoneLabel,
  pluralizePeople,
} from "@/modules/dwellings/utils/member-display";
import { headOf } from "@/modules/dwellings/utils/member-form";

const COLUMN_COUNT = 8;
const EMPTY_CELL = "—";

interface IMemberTableProps {
  families: IFamilyResource[];
  onEditMember: (member: IFamilyMemberResource) => void;
  onRemoveMember: (member: IFamilyMemberResource) => void;
  onDeleteFamily: (family: IFamilyResource) => void;
  onAddMember: () => void;
}

/**
 * Tabla de escritorio de los integrantes: Nombre (⭐ si es jefe) · DNI · Edad · Género · Parentesco ·
 * Condiciones · Celular · acciones (editar directo, quitar en `⋯`). Con 2 o más familias, antes de cada
 * una va su fila de grupo. Mismo molde que `DwellingTable`.
 */
export default function MemberTable({ families, onEditMember, onRemoveMember, onDeleteFamily, onAddMember }: IMemberTableProps) {
  const isGrouped = families.length >= 2;

  const memberActions = (member: IFamilyMemberResource): IRowAction[] => [
    { icon: Pencil, label: "Editar integrante", inline: true, onClick: () => onEditMember(member) },
    { icon: UserMinus, label: "Quitar de la vivienda", variant: "destructive", onClick: () => onRemoveMember(member) },
  ];

  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead>Nombre</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Edad</TableHead>
            <TableHead>Género</TableHead>
            <TableHead>Parentesco</TableHead>
            <TableHead>Condiciones</TableHead>
            <TableHead>Celular</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className={FADE_IN_CLASS}>
          {families.flatMap((family) => {
            const familyActions: IRowAction[] = [
              { icon: Trash2, label: "Eliminar familia", variant: "destructive", onClick: () => onDeleteFamily(family) },
            ];
            const groupRow = isGrouped && (
              <TableRow key={`family-${family.id}`} className="bg-muted/50 hover:bg-muted/50">
                <TableCell colSpan={COLUMN_COUNT}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {familyNameOf(headOf(family))}
                      <span className="ml-2 font-normal text-muted-foreground">
                        · {pluralizePeople(family.members.length)}
                      </span>
                    </p>
                    <RowActions actions={familyActions} isBordered />
                  </div>
                </TableCell>
              </TableRow>
            );
            const memberRows = family.members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-semibold text-foreground">{fullName(member)}</span>
                    {isHeadMember(member) && (
                      <Star aria-label="Jefe(a) de hogar" className="size-4 shrink-0 fill-primary text-primary" />
                    )}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{member.documentNumber ?? EMPTY_CELL}</TableCell>
                <TableCell>{ageLabel(member.age) ?? EMPTY_CELL}</TableCell>
                <TableCell>{memberGenderLabel(member) ?? EMPTY_CELL}</TableCell>
                <TableCell>{familyRelationshipLabels[member.relationship]}</TableCell>
                <TableCell>
                  {member.conditions.length > 0 ? (
                    <span className="flex flex-wrap gap-1.5">
                      {member.conditions.map((condition) => (
                        <Badge key={condition} color="orange">
                          {userConditionLabels[condition]}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    EMPTY_CELL
                  )}
                </TableCell>
                <TableCell className="tabular-nums">{memberPhoneLabel(family, member) ?? EMPTY_CELL}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <RowActions actions={memberActions(member)} isBordered />
                  </div>
                </TableCell>
              </TableRow>
            ));
            return [groupRow, ...memberRows];
          })}
          {/* Fila vacía al pie para agregar, como «Agregar perfil social» (Thony, 2026-11-28). */}
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={COLUMN_COUNT} className="p-0">
              <button
                type="button"
                onClick={onAddMember}
                className="flex min-h-12 w-full cursor-pointer items-center gap-2 px-4 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted/50 hover:text-foreground focus-visible:bg-muted"
              >
                <CirclePlus aria-hidden className="size-5 text-primary" />
                Agregar integrante
              </button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

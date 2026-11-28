import { Badge } from "@juveco/ui/components/badge";
import {
  EFamilyRelationship,
  type IFamilyMemberResource,
  type IFamilyResource,
  familyRelationshipLabels,
} from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import { formatInternationalPhone } from "@juveco/shared/phones";
import { userConditionLabels } from "@juveco/shared/user-profiles";
import { Pencil, Trash2, UserPlus } from "lucide-react";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { ageLabel } from "@/modules/dwellings/utils/dwellings";

interface IFamilyCardProps {
  family: IFamilyResource;
  onAddMember: (family: IFamilyResource) => void;
  onEditFamily: (family: IFamilyResource) => void;
  onDeleteFamily: (family: IFamilyResource) => void;
  onEditMember: (family: IFamilyResource, member: IFamilyMemberResource) => void;
  onDeleteMember: (family: IFamilyResource, member: IFamilyMemberResource) => void;
}

const pluralizePeople = (count: number) => `${count} ${count === 1 ? "persona" : "personas"}`;

/** El teléfono con el que se contacta a la familia: el del jefe o, si no tiene, el alternativo. */
const contactLine = (family: IFamilyResource): string | null => {
  const head = family.members.find((member) => member.relationship === EFamilyRelationship.HEAD);
  if (head?.phone) {
    return `Contacto: ${fullName(head)} · ${formatInternationalPhone(head.phone.countryPrefix, head.phone.number)}`;
  }
  if (family.contact) {
    const { name, phone } = family.contact;
    return `Contacto: ${name} · ${formatInternationalPhone(phone.countryPrefix, phone.number)}`;
  }
  return null;
};

/**
 * Una familia de la vivienda: header gris con el nombre del jefe y las acciones (agregar
 * integrante directo; editar y eliminar en `⋯`); debajo, el jefe primero y sus integrantes con
 * parentesco, edad y condiciones.
 */
export default function FamilyCard({
  family,
  onAddMember,
  onEditFamily,
  onDeleteFamily,
  onEditMember,
  onDeleteMember,
}: IFamilyCardProps) {
  const head = family.members.find((member) => member.relationship === EFamilyRelationship.HEAD);
  const contact = contactLine(family);

  const familyActions: IRowAction[] = [
    { icon: UserPlus, label: "Agregar integrante", inline: true, onClick: () => onAddMember(family) },
    { icon: Pencil, label: "Editar contacto y nota", onClick: () => onEditFamily(family) },
    { icon: Trash2, label: "Eliminar familia", variant: "destructive", onClick: () => onDeleteFamily(family) },
  ];

  const memberActions = (member: IFamilyMemberResource): IRowAction[] => [
    { icon: Pencil, label: "Cambiar parentesco", inline: true, onClick: () => onEditMember(family, member) },
    { icon: Trash2, label: "Quitar de la familia", variant: "destructive", onClick: () => onDeleteMember(family, member) },
  ];

  return (
    <article className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="flex items-start gap-2 border-b border-border bg-muted p-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-heading text-lg font-semibold wrap-anywhere text-foreground">
            {head ? `Familia de ${fullName(head)}` : "Familia"}
          </p>
          <p className="text-sm text-muted-foreground">{pluralizePeople(family.members.length)}</p>
        </div>
        <RowActions actions={familyActions} isBordered />
      </div>

      {(contact || family.note) && (
        <div className="space-y-1 border-b border-border px-3 py-2 text-sm">
          {contact && <p className="font-medium text-foreground">{contact}</p>}
          {family.note && <p className="text-muted-foreground">{family.note}</p>}
        </div>
      )}

      <ul className="divide-y divide-border">
        {family.members.map((member) => {
          const isHead = member.relationship === EFamilyRelationship.HEAD;
          const age = ageLabel(member.age);
          return (
            <li key={member.id} className={isHead ? "flex items-start gap-3 bg-primary/5 p-3" : "flex items-start gap-3 p-3"}>
              <InitialsAvatar name={fullName(member)} color={avatarColorOf(fullName(member))} />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-semibold text-foreground">{fullName(member)}</p>
                <p className="text-sm text-muted-foreground">
                  {[familyRelationshipLabels[member.relationship], age].filter(Boolean).join(" · ")}
                </p>
                {member.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {member.conditions.map((condition) => (
                      <Badge key={condition} color="orange">
                        {userConditionLabels[condition]}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {!isHead && <RowActions actions={memberActions(member)} isBordered />}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

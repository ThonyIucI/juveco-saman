import { Badge } from "@juveco/ui/components/badge";
import {
  EFamilyRelationship,
  type IFamilyMemberResource,
  type IFamilyResource,
  familyNameOf,
  familyRelationshipLabels,
} from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import { formatInternationalPhone } from "@juveco/shared/phones";
import { userConditionLabels } from "@juveco/shared/user-profiles";
import { Pencil, Phone, Star, Trash2, UserMinus, Users } from "lucide-react";

import { DetailSection } from "@/common/components/detail-section";
import EmptyState from "@/common/components/empty-state";
import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { FADE_IN_CLASS } from "@/common/constants/motion";
import { ageLabel } from "@/modules/dwellings/utils/dwellings";
import { headOf } from "@/modules/dwellings/utils/member-form";

const pluralizePeople = (count: number) => `${count} ${count === 1 ? "persona" : "personas"}`;

interface IMemberListProps {
  families: IFamilyResource[];
  onEditMember: (member: IFamilyMemberResource) => void;
  onRemoveMember: (member: IFamilyMemberResource) => void;
  onDeleteFamily: (family: IFamilyResource) => void;
}

/** Si el jefe no tiene celular y la familia dejó el de alguien más, va como una línea bajo su fila. */
const alternativeContactLine = (family: IFamilyResource, member: IFamilyMemberResource): string | null => {
  const isHead = member.relationship === EFamilyRelationship.HEAD;
  if (!isHead || member.phone || !family.contact) {
    return null;
  }
  const { name, phone } = family.contact;
  return `Contacto: ${name} · ${formatInternationalPhone(phone.countryPrefix, phone.number)}`;
};

interface IMemberRowProps {
  family: IFamilyResource;
  member: IFamilyMemberResource;
  onEditMember: (member: IFamilyMemberResource) => void;
  onRemoveMember: (member: IFamilyMemberResource) => void;
}

function MemberRow({ family, member, onEditMember, onRemoveMember }: IMemberRowProps) {
  const isHead = member.relationship === EFamilyRelationship.HEAD;
  const details = [familyRelationshipLabels[member.relationship], ageLabel(member.age)].filter(Boolean).join(" · ");
  const contactLine = alternativeContactLine(family, member);
  const actions: IRowAction[] = [
    { icon: Pencil, label: "Editar integrante", inline: true, onClick: () => onEditMember(member) },
    { icon: UserMinus, label: "Quitar de la vivienda", variant: "destructive", onClick: () => onRemoveMember(member) },
  ];

  return (
    <li className="flex items-center gap-3 py-2.5">
      <InitialsAvatar name={fullName(member)} color={avatarColorOf(fullName(member))} />
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-semibold text-foreground">{fullName(member)}</span>
          {isHead && <Star aria-label="Jefe(a) de hogar" className="size-4 shrink-0 fill-primary text-primary" />}
        </p>
        <p className="truncate text-sm text-muted-foreground">{details}</p>
        {(member.conditions.length > 0 || member.phone) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {member.conditions.map((condition) => (
              <Badge key={condition} color="orange">
                {userConditionLabels[condition]}
              </Badge>
            ))}
            {member.phone && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
                <Phone aria-hidden className="size-3.5" />
                {formatInternationalPhone(member.phone.countryPrefix, member.phone.number)}
              </span>
            )}
          </div>
        )}
        {contactLine && <p className="mt-1 text-sm font-medium text-foreground">{contactLine}</p>}
      </div>
      <RowActions actions={actions} isBordered />
    </li>
  );
}

/**
 * Los integrantes de la vivienda: una lista plana con el jefe primero (⭐). Con dos o más
 * familias, la misma lista agrupada por familia. Mismo molde que `PrizeList` y `MovementList`.
 */
export default function MemberList({ families, onEditMember, onRemoveMember, onDeleteFamily }: IMemberListProps) {
  const total = families.reduce((sum, family) => sum + family.members.length, 0);
  const isGrouped = families.length >= 2;

  return (
    <DetailSection
      title="Integrantes"
      isBordered
      action={total > 0 && <p className="text-sm text-muted-foreground">{pluralizePeople(total)}</p>}
    >
      {total === 0 ? (
        /* Sin botón: la acción de agregar ya está arriba. */
        <EmptyState icon={Users} title="Todavía no hay integrantes" />
      ) : (
        <div className={`-my-1 space-y-3 ${FADE_IN_CLASS}`}>
          {families.map((family) => {
            const familyActions: IRowAction[] = [
              { icon: Trash2, label: "Eliminar familia", variant: "destructive", onClick: () => onDeleteFamily(family) },
            ];
            return (
              <section key={family.id}>
                {isGrouped && (
                  <div className="flex items-center justify-between gap-2 border-b border-border py-2">
                    <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {familyNameOf(headOf(family))}
                      <span className="ml-2 font-normal text-muted-foreground">{pluralizePeople(family.members.length)}</span>
                    </p>
                    <RowActions actions={familyActions} isBordered />
                  </div>
                )}
                <ul className="divide-y divide-border">
                  {family.members.map((member) => (
                    <MemberRow
                      key={member.id}
                      family={family}
                      member={member}
                      onEditMember={onEditMember}
                      onRemoveMember={onRemoveMember}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </DetailSection>
  );
}

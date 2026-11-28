import type { IFamilyMemberResource, IFamilyResource } from "@juveco/shared/families";

import { DetailSection } from "@/common/components/detail-section";
import MemberCompactList from "@/modules/dwellings/components/member-compact-list";
import MemberTable from "@/modules/dwellings/components/member-table";
import { pluralizePeople } from "@/modules/dwellings/utils/member-display";

interface IMemberListProps {
  families: IFamilyResource[];
  onEditMember: (member: IFamilyMemberResource) => void;
  onRemoveMember: (member: IFamilyMemberResource) => void;
  onDeleteFamily: (family: IFamilyResource) => void;
  onAddMember: () => void;
}

/**
 * Los integrantes de la vivienda, a todo el ancho: tabla en escritorio y vista compacta en
 * celular. Con dos o más familias, la misma lista agrupada por familia.
 */
export default function MemberList({ families, onEditMember, onRemoveMember, onDeleteFamily, onAddMember }: IMemberListProps) {
  const total = families.reduce((sum, family) => sum + family.members.length, 0);

  return (
    <DetailSection
      title="Integrantes"
      isBordered
      isFlush
      action={total > 0 && <p className="text-sm text-muted-foreground">{pluralizePeople(total)}</p>}
    >
      {/* Sin integrantes, la tabla muestra solo su fila «⊕ Agregar integrante». */}
      <MemberTable
        families={families}
        onEditMember={onEditMember}
        onRemoveMember={onRemoveMember}
        onDeleteFamily={onDeleteFamily}
        onAddMember={onAddMember}
      />
      <MemberCompactList
        families={families}
        onEditMember={onEditMember}
        onRemoveMember={onRemoveMember}
        onDeleteFamily={onDeleteFamily}
        onAddMember={onAddMember}
      />
    </DetailSection>
  );
}

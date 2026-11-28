import { Button } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import type { IDwellingDetailResource } from "@juveco/shared/dwellings";
import {
  type IFamilyMemberResource,
  type IFamilyResource,
} from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import Loadable from "@/common/components/loadable";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import PageBox from "@/common/components/page-box";
import PageContainer from "@/common/components/page-container";
import PageHeader from "@/common/components/page-header";
import { useBoolean } from "@/common/hooks/use-boolean";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import DwellingFormModal from "@/modules/dwellings/components/dwelling-form-modal";
import DwellingInfoCard from "@/modules/dwellings/components/dwelling-info-card";
import FamilyCard from "@/modules/dwellings/components/family-card";
import FamilyFormModal from "@/modules/dwellings/components/family-form-modal";
import MemberFormModal from "@/modules/dwellings/components/member-form-modal";
import { useDeleteFamily } from "@/modules/dwellings/hooks/use-delete-family";
import { useDeleteMember } from "@/modules/dwellings/hooks/use-delete-member";
import { useGetDwelling } from "@/modules/dwellings/hooks/use-get-dwelling";
import { dwellingCountsLabel } from "@/modules/dwellings/utils/dwellings";
import { useListUsers } from "@/modules/users/hooks/use-list-users";

export const Route = createFileRoute("/_app/viviendas/$dwellingId")({
  component: DwellingPage,
});

/* El mismo corte que el `sm:` de Tailwind. */
const DESKTOP_QUERY = "(min-width: 640px)";

interface IMemberTarget {
  family: IFamilyResource;
  member: IFamilyMemberResource;
}

/**
 * Detalle de una vivienda: sus datos y una card por familia. Cada escritura (familia o
 * integrante) responde la vivienda completa y la pantalla se reemplaza, sin recargar.
 */
function DwellingPage() {
  const { dwellingId } = Route.useParams();
  const navigate = useNavigate();
  const GetDwelling = useGetDwelling();
  const ListUsers = useListUsers();
  const DeleteFamily = useDeleteFamily();
  const DeleteMember = useDeleteMember();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  const showDwellingForm = useBoolean();
  const showFamilyForm = useBoolean();
  const showMemberForm = useBoolean();
  const [familyTarget, setFamilyTarget] = useState<IFamilyResource | undefined>();
  const [memberFamily, setMemberFamily] = useState<IFamilyResource | null>(null);
  const [memberTarget, setMemberTarget] = useState<IFamilyMemberResource | undefined>();
  const [deleteFamilyTarget, setDeleteFamilyTarget] = useState<IFamilyResource | null>(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<IMemberTarget | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    GetDwelling.handler(dwellingId, controller.signal);
    ListUsers.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dwellingId]);

  const { dwelling } = GetDwelling;
  const isLoading = GetDwelling.loading && dwelling === null;
  const goBack = () => navigate({ to: "/viviendas" });

  /* La familia abierta en una modal se busca en la vivienda ya actualizada. */
  const freshFamily = (family: IFamilyResource | null): IFamilyResource | null =>
    family ? (dwelling?.families.find((item) => item.id === family.id) ?? family) : null;

  const openAddFamily = () => {
    setFamilyTarget(undefined);
    showFamilyForm.on();
  };

  const openEditFamily = (family: IFamilyResource) => {
    setFamilyTarget(family);
    showFamilyForm.on();
  };

  const openAddMember = (family: IFamilyResource) => {
    setMemberFamily(family);
    setMemberTarget(undefined);
    showMemberForm.on();
  };

  const openEditMember = (family: IFamilyResource, member: IFamilyMemberResource) => {
    setMemberFamily(family);
    setMemberTarget(member);
    showMemberForm.on();
  };

  const handleSaved = (saved: IDwellingDetailResource) => GetDwelling.onReplace(saved);

  const confirmDeleteFamily = async () => {
    if (!deleteFamilyTarget) {
      return;
    }
    const saved = await DeleteFamily.handler(deleteFamilyTarget);
    if (saved) {
      handleSaved(saved);
    }
    setDeleteFamilyTarget(null);
  };

  const confirmDeleteMember = async () => {
    if (!deleteMemberTarget) {
      return;
    }
    const saved = await DeleteMember.handler(deleteMemberTarget.family, deleteMemberTarget.member);
    if (saved) {
      handleSaved(saved);
    }
    setDeleteMemberTarget(null);
  };

  const handleUserCreated = (user: IUserResource) => ListUsers.onUpsert(user);

  /* La única acción primaria: en escritorio a la derecha del título; en el celular, en su fila, a todo el ancho. */
  const addFamilyButton = (
    <Button type="button" size="lg" className={isDesktop ? undefined : "w-full"} onClick={openAddFamily}>
      <Plus />
      Agregar familia
    </Button>
  );

  return (
    <PageContainer>
      <PageBox>
        <PageHeader
          title={dwelling?.code ?? "Vivienda"}
          isTitleNowrap
          back={{ label: "Volver a las viviendas", onClick: goBack }}
          isLoadingSubtitle={isLoading}
          subtitle={dwelling && <NeighborhoodBadge neighborhood={dwelling.neighborhood} hasIcon={false} />}
          titleAction={
            dwelling && (
              <IconButton label="Editar vivienda" isBordered onClick={showDwellingForm.on}>
                <Pencil />
              </IconButton>
            )
          }
          action={isDesktop ? addFamilyButton : undefined}
        />
        {!isDesktop && <div className="mt-3">{addFamilyButton}</div>}
      </PageBox>

      <PageBox isFill>
        <Loadable
          isLoading={isLoading}
          className="space-y-4"
          skeleton={
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-sm" />
              <Skeleton className="h-64 w-full rounded-sm" />
            </div>
          }
        >
          {dwelling && (
            <>
              <DwellingInfoCard dwelling={dwelling} />

              {dwelling.families.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Todavía no hay familias"
                  description="Agrega la primera con su jefe de hogar."
                  action={
                    <Button type="button" variant="link" onClick={openAddFamily}>
                      Agregar familia
                    </Button>
                  }
                />
              ) : (
                <section className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h2 className="font-heading text-lg font-semibold text-foreground">Familias</h2>
                    <p className="text-sm text-muted-foreground">{dwellingCountsLabel(dwelling)}</p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {dwelling.families.map((family) => (
                      <FamilyCard
                        key={family.id}
                        family={family}
                        onAddMember={openAddMember}
                        onEditFamily={openEditFamily}
                        onDeleteFamily={setDeleteFamilyTarget}
                        onEditMember={openEditMember}
                        onDeleteMember={(targetFamily, member) =>
                          setDeleteMemberTarget({ family: targetFamily, member })
                        }
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </Loadable>
      </PageBox>

      <DwellingFormModal
        open={showDwellingForm.active}
        dwelling={dwelling ?? undefined}
        onSaved={handleSaved}
        onClose={showDwellingForm.off}
      />

      <FamilyFormModal
        open={showFamilyForm.active}
        dwellingId={dwellingId}
        family={freshFamily(familyTarget ?? null) ?? undefined}
        users={ListUsers.users}
        onUserCreated={handleUserCreated}
        onSaved={handleSaved}
        onClose={showFamilyForm.off}
      />

      <MemberFormModal
        open={showMemberForm.active}
        family={freshFamily(memberFamily)}
        member={memberTarget}
        users={ListUsers.users}
        onUserCreated={handleUserCreated}
        onSaved={handleSaved}
        onClose={showMemberForm.off}
      />

      <ConfirmModal
        open={deleteFamilyTarget !== null}
        title="¿Eliminar la familia?"
        description="Se quita la familia y sus integrantes de esta vivienda. Las personas siguen en Usuarios. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteFamily.loading}
        onConfirm={confirmDeleteFamily}
        onCancel={() => setDeleteFamilyTarget(null)}
      />

      <ConfirmModal
        open={deleteMemberTarget !== null}
        title={`¿Quitar a «${deleteMemberTarget ? fullName(deleteMemberTarget.member) : ""}» de la familia?`}
        description="La persona sigue en Usuarios con sus datos."
        confirmLabel="Quitar"
        variant="destructive"
        loading={DeleteMember.loading}
        onConfirm={confirmDeleteMember}
        onCancel={() => setDeleteMemberTarget(null)}
      />
    </PageContainer>
  );
}

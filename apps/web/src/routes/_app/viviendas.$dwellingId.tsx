import { buttonVariants } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import {
  DWELLING_COORDINATE_DECIMALS,
  type IDwellingDetailResource,
  mapsUrlOf,
  wallMaterialText,
} from "@juveco/shared/dwellings";
import { type IFamilyMemberResource, type IFamilyResource, familyNameOf } from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrickWall, MapPin, Pencil, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import { DetailList, DetailRow, DetailSection } from "@/common/components/detail-section";
import Loadable from "@/common/components/loadable";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import PageBox from "@/common/components/page-box";
import PageContainer from "@/common/components/page-container";
import PageHeader from "@/common/components/page-header";
import { useBoolean } from "@/common/hooks/use-boolean";
import DwellingFormModal from "@/modules/dwellings/components/dwelling-form-modal";
import DwellingStatusBadge from "@/modules/dwellings/components/dwelling-status-badge";
import MemberFormModal from "@/modules/dwellings/components/member-form-modal";
import MemberList from "@/modules/dwellings/components/member-list";
import { useDeleteFamily } from "@/modules/dwellings/hooks/use-delete-family";
import { useDeleteMember } from "@/modules/dwellings/hooks/use-delete-member";
import { useGetDwelling } from "@/modules/dwellings/hooks/use-get-dwelling";
import { headOf } from "@/modules/dwellings/utils/member-form";

export const Route = createFileRoute("/_app/viviendas/$dwellingId")({
  component: DwellingPage,
});

/* Los datos en 1 columna en celular, 2 en escritorio y 3 en pantallas anchas (cada par etiqueta · valor). */
const DATA_LIST_COLUMNS =
  "md:grid-cols-[repeat(2,max-content_minmax(0,1fr))] md:gap-x-8 xl:grid-cols-[repeat(3,max-content_minmax(0,1fr))]";

/**
 * Detalle de una vivienda: sus datos a todo el ancho arriba y, debajo, los integrantes (tabla en
 * escritorio, vista compacta en celular). Cada escritura (integrante o familia) responde la vivienda
 * completa y la pantalla se reemplaza, sin recargar.
 */
function DwellingPage() {
  const { dwellingId } = Route.useParams();
  const navigate = useNavigate();
  const GetDwelling = useGetDwelling();
  const DeleteFamily = useDeleteFamily();
  const DeleteMember = useDeleteMember();

  const showDwellingForm = useBoolean();
  const showMemberForm = useBoolean();
  const [memberTarget, setMemberTarget] = useState<IFamilyMemberResource | null>(null);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<IFamilyMemberResource | null>(null);
  const [deleteFamilyTarget, setDeleteFamilyTarget] = useState<IFamilyResource | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    GetDwelling.handler(dwellingId, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dwellingId]);

  const { dwelling } = GetDwelling;
  const isLoading = GetDwelling.loading && dwelling === null;
  const goBack = () => navigate({ to: "/viviendas" });

  const openAddMember = () => {
    setMemberTarget(null);
    showMemberForm.on();
  };

  const openEditMember = (member: IFamilyMemberResource) => {
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

  const confirmRemoveMember = async () => {
    if (!removeMemberTarget || !dwelling) {
      return;
    }
    const saved = await DeleteMember.handler(dwelling.id, removeMemberTarget);
    if (saved) {
      handleSaved(saved);
    }
    setRemoveMemberTarget(null);
  };

  const mapsUrl = dwelling ? mapsUrlOf(dwelling.latitude, dwelling.longitude) : null;
  const coordinates =
    dwelling && dwelling.latitude !== null && dwelling.longitude !== null
      ? `${dwelling.latitude.toFixed(DWELLING_COORDINATE_DECIMALS)}, ${dwelling.longitude.toFixed(DWELLING_COORDINATE_DECIMALS)}`
      : null;

  return (
    <PageContainer>
      {/* Cabecera: código, estado y barrio. Los demás datos van en su lista, en el cuerpo. */}
      <PageBox>
        <PageHeader
          title={dwelling?.code ?? "Vivienda"}
          isTitleNowrap
          titleAction={dwelling && <DwellingStatusBadge status={dwelling.status} />}
          back={{ label: "Volver a las viviendas", onClick: goBack }}
          isLoadingSubtitle={!dwelling}
          subtitle={dwelling && <NeighborhoodBadge neighborhood={dwelling.neighborhood} hasIcon={false} />}
          action={
            dwelling && (
              /* Agregar integrantes va en la fila «⊕» al pie de la tabla; aquí solo editar la vivienda. */
              <IconButton label="Editar vivienda" size="md" isBordered onClick={showDwellingForm.on}>
                <Pencil />
              </IconButton>
            )
          }
        />
      </PageBox>

      <PageBox isFill>
        <Loadable
          isLoading={isLoading}
          skeleton={
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-sm" />
              <Skeleton className="h-64 w-full rounded-sm" />
            </div>
          }
        >
          {dwelling && (
            /* Los datos arriba y los integrantes debajo, los dos a todo el ancho. */
            <div className="space-y-4">
              <DetailSection
                title="Datos"
                isBordered
                action={
                  mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <MapPin />
                      Maps
                    </a>
                  )
                }
              >
                <DetailList className={DATA_LIST_COLUMNS}>
                  <DetailRow icon={Zap} label="Medidor">
                    {dwelling.meterNumber}
                  </DetailRow>
                  <DetailRow icon={BrickWall} label="Paredes">
                    {wallMaterialText(dwelling.wallMaterial, dwelling.wallMaterialOther)}
                  </DetailRow>
                  <DetailRow icon={MapPin} label="Ubicación">
                    {coordinates}
                  </DetailRow>
                </DetailList>
                {dwelling.note && (
                  <p className="mt-2 border-t border-border pt-3 text-sm whitespace-pre-line text-foreground">{dwelling.note}</p>
                )}
              </DetailSection>

              <MemberList
                families={dwelling.families}
                onEditMember={openEditMember}
                onRemoveMember={setRemoveMemberTarget}
                onDeleteFamily={setDeleteFamilyTarget}
                onAddMember={openAddMember}
              />
            </div>
          )}
        </Loadable>
      </PageBox>

      <DwellingFormModal
        open={showDwellingForm.active}
        dwelling={dwelling ?? undefined}
        onSaved={handleSaved}
        onClose={showDwellingForm.off}
      />

      <MemberFormModal
        open={showMemberForm.active}
        dwelling={dwelling}
        member={memberTarget}
        onSaved={handleSaved}
        onClose={showMemberForm.off}
      />

      <ConfirmModal
        open={deleteFamilyTarget !== null}
        title={`¿Eliminar la «${deleteFamilyTarget ? familyNameOf(headOf(deleteFamilyTarget)) : "familia"}»?`}
        description="Se quita la familia y sus integrantes de esta vivienda. Las personas siguen en Usuarios. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteFamily.loading}
        onConfirm={confirmDeleteFamily}
        onCancel={() => setDeleteFamilyTarget(null)}
      />

      <ConfirmModal
        open={removeMemberTarget !== null}
        title={`¿Quitar a «${removeMemberTarget ? fullName(removeMemberTarget) : ""}» de la vivienda?`}
        description="La persona sigue en Usuarios con sus datos. Si es el único de su familia, la familia también se quita."
        confirmLabel="Quitar"
        variant="destructive"
        loading={DeleteMember.loading}
        onConfirm={confirmRemoveMember}
        onCancel={() => setRemoveMemberTarget(null)}
      />
    </PageContainer>
  );
}

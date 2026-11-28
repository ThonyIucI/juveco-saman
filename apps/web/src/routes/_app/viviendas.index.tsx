import { Button } from "@juveco/ui/components/button";
import type { IDwellingDetailResource, IDwellingResource } from "@juveco/shared/dwellings";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { House, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import ListPagination, { ResultsCounter } from "@/common/components/list-pagination";
import Loadable from "@/common/components/loadable";
import PageBox from "@/common/components/page-box";
import PageContainer from "@/common/components/page-container";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import { useBoolean } from "@/common/hooks/use-boolean";
import { usePagination } from "@/common/hooks/use-pagination";
import DwellingCardList from "@/modules/dwellings/components/dwelling-card-list";
import DwellingFormModal from "@/modules/dwellings/components/dwelling-form-modal";
import DwellingTable from "@/modules/dwellings/components/dwelling-table";
import { useDeleteDwelling } from "@/modules/dwellings/hooks/use-delete-dwelling";
import { useListDwellings } from "@/modules/dwellings/hooks/use-list-dwellings";

export const Route = createFileRoute("/_app/viviendas/")({
  component: DwellingsPage,
});

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

/**
 * Viviendas del empadronamiento: lista simple. «Nueva vivienda» abre el formulario y, al
 * guardar, lleva al detalle para cargar las familias enseguida. Tocar una fila abre el detalle.
 */
function DwellingsPage() {
  const navigate = useNavigate();
  const ListDwellings = useListDwellings();
  const DeleteDwelling = useDeleteDwelling();
  const showForm = useBoolean();
  const [editTarget, setEditTarget] = useState<IDwellingResource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<IDwellingResource | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    ListDwellings.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { dwellings } = ListDwellings;
  const isLoading = ListDwellings.loading && dwellings.length === 0;
  const pager = usePagination(dwellings, { initialPageSize: PAGE_SIZE_OPTIONS[0] });
  const hasContent = !isLoading && dwellings.length > 0;

  const openDetail = (dwelling: IDwellingResource) =>
    navigate({ to: "/viviendas/$dwellingId", params: { dwellingId: dwelling.id } });

  const openCreate = () => {
    setEditTarget(undefined);
    showForm.on();
  };

  const openEdit = (dwelling: IDwellingResource) => {
    setEditTarget(dwelling);
    showForm.on();
  };

  /* Nueva: al detalle, a cargar sus familias. Editada: la lista se actualiza. */
  const handleSaved = (saved: IDwellingDetailResource) => {
    if (editTarget) {
      ListDwellings.onUpsert(saved);
      return;
    }
    navigate({ to: "/viviendas/$dwellingId", params: { dwellingId: saved.id } });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const deleted = await DeleteDwelling.handler(deleteTarget);
    if (deleted) {
      ListDwellings.onRemove(deleted.id);
    }
    setDeleteTarget(null);
  };

  const buildActions = (dwelling: IDwellingResource): IRowAction[] => [
    { icon: Pencil, label: "Editar", inline: true, onClick: () => openEdit(dwelling) },
    { icon: Trash2, label: "Eliminar", variant: "destructive", onClick: () => setDeleteTarget(dwelling) },
  ];

  const pagination = (
    <ListPagination
      currentPage={pager.currentPage}
      totalPages={pager.totalPages}
      onPageChange={pager.setPage}
      pageSize={pager.pageSize}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      onPageSizeChange={pager.changePageSize}
    />
  );

  return (
    <PageContainer>
      <PageBox>
        <PageHeader
          title="Viviendas"
          subtitle={dwellings.length > 0 ? pluralize(dwellings.length, "vivienda", "viviendas") : undefined}
          isLoadingSubtitle={isLoading}
          action={
            <Button type="button" size="lg" onClick={openCreate}>
              <Plus />
              Nueva vivienda
            </Button>
          }
        />
      </PageBox>

      <PageBox isFill>
        <Loadable
          isLoading={isLoading}
          className="space-y-4"
          skeleton={
            <div className="space-y-1.5">
              <ResultsCounter from={0} to={0} total={0} isLoading className="text-xs" />
              <DwellingTable dwellings={[]} isLoading buildActions={buildActions} onOpen={openDetail} />
              <DwellingCardList dwellings={[]} isLoading buildActions={buildActions} onOpen={openDetail} />
            </div>
          }
        >
          {!isLoading && dwellings.length === 0 && (
            <EmptyState
              icon={House}
              title="Todavía no hay viviendas"
              description="Registra cada vivienda donde viva alguien, con sus familias y personas."
              action={
                <Button type="button" variant="link" onClick={openCreate}>
                  Registrar la primera
                </Button>
              }
            />
          )}

          {hasContent && (
            <div className="space-y-1.5">
              <ResultsCounter
                from={pager.rangeStart}
                to={pager.rangeEnd}
                total={pager.totalItems}
                className="text-xs"
              />
              <DwellingTable
                dwellings={pager.pagedItems}
                isLoading={false}
                buildActions={buildActions}
                onOpen={openDetail}
                footer={pagination}
              />
              <DwellingCardList
                dwellings={pager.pagedItems}
                isLoading={false}
                buildActions={buildActions}
                onOpen={openDetail}
              />
              <div className="rounded-xl bg-card px-4 py-3 shadow-card md:hidden">{pagination}</div>
            </div>
          )}
        </Loadable>
      </PageBox>

      <DwellingFormModal
        open={showForm.active}
        dwelling={editTarget}
        onSaved={handleSaved}
        onClose={showForm.off}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title={`¿Eliminar la vivienda ${deleteTarget?.code ?? ""}?`}
        description="Solo se puede si no tiene familias. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteDwelling.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}

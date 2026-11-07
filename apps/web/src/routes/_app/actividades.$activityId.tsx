import { Button } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import { activityItemLabels } from "@juveco/shared/activities";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { formatSoles } from "@juveco/shared/money";
import { createFileRoute } from "@tanstack/react-router";
import { ChartColumn, HandCoins, Pencil, Plus, RefreshCw, Search, Ticket, Trash2 } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import FloatingActionButton from "@/common/components/floating-action-button";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import SearchInput from "@/common/components/search-input";
import StickyToolbar from "@/common/components/sticky-toolbar";
import { useBoolean } from "@/common/hooks/use-boolean";
import { formatShortDate } from "@/common/utils/format-date";
import ActivityItemDetailPanel from "@/modules/activities/components/activity-item-detail-panel";
import ActivityItemFormModal from "@/modules/activities/components/activity-item-form-modal";
import ActivityItemGrid from "@/modules/activities/components/activity-item-grid";
import ActivitySummaryModal from "@/modules/activities/components/activity-summary-modal";
import ItemPaymentFormModal from "@/modules/activities/components/item-payment-form-modal";
import { useDeleteActivityItem } from "@/modules/activities/hooks/use-delete-activity-item";
import { useGetActivity } from "@/modules/activities/hooks/use-get-activity";
import { useListActivityItems } from "@/modules/activities/hooks/use-list-activity-items";
import {
  collectionOf,
  compareBySerial,
  countSerials,
  matchesActivityItemSearch,
} from "@/modules/activities/utils/activity-items";
import { useListUsers } from "@/modules/users/hooks/use-list-users";

export const Route = createFileRoute("/_app/actividades/$activityId")({
  component: ActivityPage,
});

/* Mientras carga la actividad todavía no se sabe su tipo. */
const FALLBACK_ITEM_LABEL = { singular: "venta", plural: "ventas" };

/**
 * Una actividad y lo vendido en ella (en un bingo, las cartillas), en cards también en
 * escritorio y ordenadas por serie. Cualquier administrador vende, edita y elimina.
 * Sincronizar trae lo que vendió otro admin.
 */
function ActivityPage() {
  const { activityId } = Route.useParams();
  const GetActivity = useGetActivity();
  const ListActivityItems = useListActivityItems();
  const ListUsers = useListUsers();
  const DeleteActivityItem = useDeleteActivityItem();
  const showForm = useBoolean();
  const showSummary = useBoolean();

  const [editTarget, setEditTarget] = useState<IActivityItemResource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<IActivityItemResource | null>(null);
  const [term, setTerm] = useState("");
  /* Por id y no el objeto: así el detalle y el pago ven el ítem al día tras cada cambio. */
  const [detailId, setDetailId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);

  /* Las personas también: el comprador se elige de ahí y su barrio pudo cambiar. */
  const loadAll = (signal?: AbortSignal) =>
    Promise.all([
      GetActivity.handler(activityId, signal),
      ListActivityItems.handler(activityId, signal),
      ListUsers.handler(signal),
    ]);

  useEffect(() => {
    const controller = new AbortController();
    loadAll(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const { activity } = GetActivity;
  const { items } = ListActivityItems;
  const itemLabel = activity ? activityItemLabels[activity.type] : FALLBACK_ITEM_LABEL;
  const isLoading = ListActivityItems.loading && items.length === 0;
  const isSyncing = GetActivity.loading || ListActivityItems.loading || ListUsers.loading;

  const detailItem = items.find((item) => item.id === detailId) ?? null;
  const payItem = items.find((item) => item.id === payId) ?? null;

  const serialCounts = countSerials(items);
  const normalizedTerm = term.trim().toLowerCase();
  const visible = items
    .filter((item) => !normalizedTerm || matchesActivityItemSearch(item, normalizedTerm))
    .sort(compareBySerial);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => setTerm(event.target.value);

  const openCreate = () => {
    setEditTarget(undefined);
    showForm.on();
  };

  const openEdit = (item: IActivityItemResource) => {
    setEditTarget(item);
    showForm.on();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const deleted = await DeleteActivityItem.handler(deleteTarget);
    if (deleted) {
      ListActivityItems.onRemove(deleted.id);
    }
    setDeleteTarget(null);
  };

  /* El acceso directo al pago va suelto junto al `⋯`, solo mientras falte cobrar (acordado 2026-11-07). */
  const buildActions = (item: IActivityItemResource): IRowAction[] => [
    ...(collectionOf(item).pending > 0
      ? [{ icon: HandCoins, label: "Registrar pago", inline: true, onClick: () => setPayId(item.id) }]
      : []),
    { icon: Pencil, label: "Editar", onClick: () => openEdit(item) },
    { icon: Trash2, label: "Eliminar", variant: "destructive", onClick: () => setDeleteTarget(item) },
  ];

  /* Sin cuántos se vendieron: eso va en los KPIs (Thony, 2026-11-07). */
  const subtitle = activity
    ? `${formatShortDate(activity.eventDate)} · ${formatSoles(activity.defaultPrice)}`
    : undefined;

  const searchInput = (
    <SearchInput
      placeholder={`Buscar ${itemLabel.singular}…`}
      aria-label={`Buscar ${itemLabel.singular} por serie, comprador o barrio`}
      value={term}
      onChange={handleSearchChange}
    />
  );

  const syncButton = (
    <IconButton label="Sincronizar" tone="muted" onClick={() => loadAll()}>
      <RefreshCw className={cn(isSyncing && "animate-spin motion-reduce:animate-none")} />
    </IconButton>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
      {activity ? (
        <PageHeader
          title={activity.name}
          titleAction={syncButton}
          subtitle={subtitle}
          isLoadingSubtitle={isLoading}
          action={
            <div className="flex items-center gap-3">
              {/* En celular, el resumen es el botón flotante. */}
              <Button type="button" variant="outline" className="hidden md:inline-flex" onClick={showSummary.on}>
                <ChartColumn />
                Resumen
              </Button>
              {/* En escritorio el buscador va junto al botón para ahorrar una fila. */}
              {items.length > 0 && <div className="hidden w-72 md:block">{searchInput}</div>}
              <Button type="button" onClick={openCreate}>
                <Plus />
                Agregar
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-md" />
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>
      )}

      {/* En celular no entra junto al botón: queda en su barra fija. */}
      {items.length > 0 && <StickyToolbar className="md:hidden">{searchInput}</StickyToolbar>}

      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={Ticket}
          title={`Todavía no hay ${itemLabel.plural}`}
          description={`Registra cada ${itemLabel.singular} vendida con su serie y quién la compró.`}
          action={
            <Button type="button" variant="link" onClick={openCreate}>
              Agregar la primera
            </Button>
          }
        />
      )}

      {!isLoading && items.length > 0 && visible.length === 0 && (
        <EmptyState icon={Search} title={`Sin resultados para "${term.trim()}"`} />
      )}

      {(isLoading || visible.length > 0) && (
        <ActivityItemGrid
          items={visible}
          isLoading={isLoading}
          serialCounts={serialCounts}
          buildActions={buildActions}
          onOpen={(item) => setDetailId(item.id)}
        />
      )}

      {activity && <FloatingActionButton label="Resumen" icon={ChartColumn} onClick={showSummary.on} />}

      {activity && (
        <ActivityItemFormModal
          open={showForm.active}
          activity={activity}
          item={editTarget}
          items={items}
          users={ListUsers.users}
          onUserCreated={ListUsers.onUpsert}
          onSaved={ListActivityItems.onUpsert}
          onClose={showForm.off}
        />
      )}

      <ActivityItemDetailPanel
        item={detailItem}
        backLabel={activity?.name ?? "Volver"}
        buildActions={buildActions}
        onPay={(item) => setPayId(item.id)}
        onItemChanged={ListActivityItems.onUpsert}
        onClose={() => setDetailId(null)}
      />

      <ItemPaymentFormModal
        item={payItem}
        onSaved={(change) => ListActivityItems.onUpsert(change.item)}
        onClose={() => setPayId(null)}
      />

      {activity && <ActivitySummaryModal open={showSummary.active} activity={activity} onClose={showSummary.off} />}

      <ConfirmModal
        open={deleteTarget !== null}
        title={`¿Eliminar la serie «${deleteTarget?.serial ?? ""}»?`}
        description={`Se borra de ${activity?.name ?? "la actividad"}. Esto no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteActivityItem.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

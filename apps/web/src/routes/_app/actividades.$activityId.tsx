import { Button } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import { activityItemLabels } from "@juveco/shared/activities";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { formatSoles } from "@juveco/shared/money";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChartColumn,
  HandCoins,
  LayoutGrid,
  Pencil,
  Plus,
  RefreshCw,
  Rows3,
  Search,
  Ticket,
  Trash2,
} from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import FilterButton from "@/common/components/filter-button";
import FloatingActionButton from "@/common/components/floating-action-button";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import SearchInput from "@/common/components/search-input";
import StickyToolbar from "@/common/components/sticky-toolbar";
import { useBoolean } from "@/common/hooks/use-boolean";
import { formatShortDate } from "@/common/utils/format-date";
import ActivityItemDetailPanel from "@/modules/activities/components/activity-item-detail-panel";
import ActivityItemFormModal from "@/modules/activities/components/activity-item-form-modal";
import {
  ActivityItemFilterFields,
  ActivityItemFiltersModal,
} from "@/modules/activities/components/activity-item-filters";
import ActivityItemCompactList from "@/modules/activities/components/activity-item-compact-list";
import ActivityItemGrid from "@/modules/activities/components/activity-item-grid";
import ActivityItemTable from "@/modules/activities/components/activity-item-table";
import ItemPaymentFormModal from "@/modules/activities/components/item-payment-form-modal";
import { useDeleteActivityItem } from "@/modules/activities/hooks/use-delete-activity-item";
import { useGetActivity } from "@/modules/activities/hooks/use-get-activity";
import { useListActivityItems } from "@/modules/activities/hooks/use-list-activity-items";
import {
  EMPTY_ITEM_FILTERS,
  type IActivityItemFilters,
  collectionOf,
  compareBySerial,
  countActiveFilters,
  countSerials,
  matchesActivityItemSearch,
  matchesItemFilters,
  sellersOf,
} from "@/modules/activities/utils/activity-items";
import { useListUsers } from "@/modules/users/hooks/use-list-users";

/*
  La vista de celular se recuerda en este navegador. Por defecto, la compacta; el botón pasa a
  cards (Thony, 2026-11-08). Solo un «false» guardado deja las cards.
*/
const COMPACT_VIEW_KEY = "juveco:activity-items-compact";

const readCompactView = (): boolean => {
  try {
    return localStorage.getItem(COMPACT_VIEW_KEY) !== "false";
  } catch {
    return true;
  }
};

const saveCompactView = (isCompact: boolean): void => {
  try {
    localStorage.setItem(COMPACT_VIEW_KEY, String(isCompact));
  } catch {
    /* Sin almacenamiento, la vista vale solo mientras dure la página. */
  }
};

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
  const { user } = Route.useRouteContext();
  const GetActivity = useGetActivity();
  const ListActivityItems = useListActivityItems();
  const ListUsers = useListUsers();
  const DeleteActivityItem = useDeleteActivityItem();
  const showForm = useBoolean();
  const navigate = useNavigate();
  const showFilters = useBoolean();

  const [editTarget, setEditTarget] = useState<IActivityItemResource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<IActivityItemResource | null>(null);
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState<IActivityItemFilters>(EMPTY_ITEM_FILTERS);
  /* Por id y no el objeto: así el detalle y el pago ven el ítem al día tras cada cambio. */
  const [detailId, setDetailId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);
  const [isCompactView, setIsCompactView] = useState(readCompactView);

  const toggleCompactView = () => {
    const next = !isCompactView;
    setIsCompactView(next);
    saveCompactView(next);
  };

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
  const activeFilterCount = countActiveFilters(filters);
  const visible = items
    .filter((item) => !normalizedTerm || matchesActivityItemSearch(item, normalizedTerm))
    .filter((item) => matchesItemFilters(item, filters))
    .sort(compareBySerial);
  /* KPIs, balance, premios y gastos van en su propia página (acordado 2026-11-07). */
  const openSummary = () => navigate({ to: "/actividades/$activityId/resumen", params: { activityId } });

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
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      {activity ? (
        <PageHeader
          title={activity.name}
          titleAction={syncButton}
          subtitle={subtitle}
          isLoadingSubtitle={isLoading}
          action={
            <div className="flex items-center gap-3">
              {/*
                Resumen en gris, también en celular, donde ocupa el lugar de «Agregar»: agregar
                pasa al botón flotante «+» y el título gana espacio (Thony, 2026-11-07).
                `lg`: el mismo alto que el buscador (h-13), para que la fila se vea pareja.
              */}
              {/* En celular, solo el ícono (Thony, 2026-11-07). */}
              <IconButton label="Resumen" size="lg" tone="neutral" isFilled className="md:hidden" onClick={openSummary}>
                <ChartColumn />
              </IconButton>
              <Button
                type="button"
                size="lg"
                variant="ghost"
                className="hidden bg-muted hover:bg-accent md:inline-flex"
                onClick={openSummary}
              >
                <ChartColumn />
                Resumen
              </Button>
              {/* En escritorio el buscador va junto al botón para ahorrar una fila. */}
              {items.length > 0 && <div className="hidden w-72 md:block">{searchInput}</div>}
              <Button type="button" size="lg" className="hidden md:inline-flex" onClick={openCreate}>
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

      {/* Escritorio: los filtros directos, en su propia fila debajo del encabezado (acordado 2026-11-07). */}
      {items.length > 0 && (
        <div className="hidden max-w-4xl md:block">
          <ActivityItemFilterFields filters={filters} sellers={sellersOf(items)} onChange={setFilters} isRow />
        </div>
      )}

      {/* Celular: el buscador en su barra fija y, a su derecha, el botón que abre los filtros. */}
      {items.length > 0 && (
        <StickyToolbar className="md:hidden">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">{searchInput}</div>
            <FilterButton activeCount={activeFilterCount} onClick={showFilters.on} />
          </div>
        </StickyToolbar>
      )}

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
        <EmptyState
          icon={Search}
          title={normalizedTerm ? `Sin resultados para "${term.trim()}"` : "Ninguna coincide con los filtros"}
          action={
            activeFilterCount > 0 && (
              <Button type="button" variant="link" onClick={() => setFilters(EMPTY_ITEM_FILTERS)}>
                Quitar filtros
              </Button>
            )
          }
        />
      )}

      {(isLoading || visible.length > 0) && (
        <>
          <ActivityItemTable
            items={visible}
            isLoading={isLoading}
            serialCounts={serialCounts}
            buildActions={buildActions}
            onOpen={(item) => setDetailId(item.id)}
          />
          {isCompactView ? (
            <ActivityItemCompactList
              items={visible}
              isLoading={isLoading}
              serialCounts={serialCounts}
              onPay={(item) => setPayId(item.id)}
              onOpen={(item) => setDetailId(item.id)}
            />
          ) : (
            <ActivityItemGrid
              items={visible}
              isLoading={isLoading}
              serialCounts={serialCounts}
              buildActions={buildActions}
              onOpen={(item) => setDetailId(item.id)}
            />
          )}
        </>
      )}

      {/* Encima del «+», del mismo tamaño y en gris, a 12 px: cambia entre cards y vista compacta. */}
      <FloatingActionButton
        label={isCompactView ? "Ver en cards" : "Ver en vista compacta"}
        icon={isCompactView ? LayoutGrid : Rows3}
        onClick={toggleCompactView}
        className="bottom-[calc(8.5rem+env(safe-area-inset-bottom))] border border-border bg-card text-foreground sm:bottom-[5.5rem]"
      />
      {activity && <FloatingActionButton label={`Agregar ${itemLabel.singular}`} icon={Plus} onClick={openCreate} />}

      {activity && (
        <ActivityItemFormModal
          open={showForm.active}
          activity={activity}
          currentUserId={user.personId}
          item={editTarget}
          items={items}
          users={ListUsers.users}
          onUserCreated={ListUsers.onUpsert}
          onSaved={ListActivityItems.onUpsert}
          onClose={showForm.off}
        />
      )}

      <ActivityItemFiltersModal
        open={showFilters.active}
        filters={filters}
        sellers={sellersOf(items)}
        resultCount={visible.length}
        onChange={setFilters}
        onClose={showFilters.off}
      />

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

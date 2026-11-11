import { Button } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import { activityItemLabels } from "@juveco/shared/activities";
import type { IActivityItemChangeResult, IActivityItemResource } from "@juveco/shared/activity-items";
import { roundSoles } from "@juveco/shared/money";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChartColumn,
  HandCoins,
  LayoutGrid,
  Pencil,
  Plus,
  RefreshCw,
  Repeat,
  Rows3,
  Search,
  Ticket,
  Trash2,
} from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import CountTabs, { type ICountTabOption } from "@/common/components/count-tabs";
import EmptyState from "@/common/components/empty-state";
import FilterButton from "@/common/components/filter-button";
import FloatingActionButton from "@/common/components/floating-action-button";
import PageBox from "@/common/components/page-box";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import SearchInput from "@/common/components/search-input";
import StickyToolbar from "@/common/components/sticky-toolbar";
import { useBoolean } from "@/common/hooks/use-boolean";
import ActivityItemDetailPanel from "@/modules/activities/components/activity-item-detail-panel";
import ActivityItemFormModal from "@/modules/activities/components/activity-item-form-modal";
import {
  ActivityItemFilterFields,
  ActivityItemFiltersModal,
} from "@/modules/activities/components/activity-item-filters";
import ActivityItemCompactList from "@/modules/activities/components/activity-item-compact-list";
import ActivityItemGrid from "@/modules/activities/components/activity-item-grid";
import ActivityItemTable from "@/modules/activities/components/activity-item-table";
import ActivityItemTotals from "@/modules/activities/components/activity-item-totals";
import ActivityMeta from "@/modules/activities/components/activity-meta";
import ItemChangeFormModal from "@/modules/activities/components/item-change-form-modal";
import ItemPaymentFormModal from "@/modules/activities/components/item-payment-form-modal";
import { useDeleteActivityItem } from "@/modules/activities/hooks/use-delete-activity-item";
import { useGetActivity } from "@/modules/activities/hooks/use-get-activity";
import { useGetActivityBalance } from "@/modules/activities/hooks/use-get-activity-balance";
import { useListActivityItems } from "@/modules/activities/hooks/use-list-activity-items";
import {
  EMPTY_ITEM_FILTERS,
  type IActivityItemFilters,
  type TPaymentTab,
  changedSerials,
  collectionOf,
  compareBySerial,
  countActiveFilters,
  countSerials,
  matchesActivityItemSearch,
  matchesItemFilters,
  paymentTabLabels,
  paymentTabOf,
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
  const GetActivityBalance = useGetActivityBalance();
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
  /* Abre en «Por pagar»: es lo que queda por hacer. */
  const [paymentTab, setPaymentTab] = useState<TPaymentTab>("PENDING");
  /* Por id y no el objeto: así el detalle y el pago ven el ítem al día tras cada cambio. */
  const [detailId, setDetailId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);
  const [changeId, setChangeId] = useState<string | null>(null);
  const [isCompactView, setIsCompactView] = useState(readCompactView);

  const toggleCompactView = () => {
    const next = !isCompactView;
    setIsCompactView(next);
    saveCompactView(next);
  };

  /*
    Las personas también: el comprador se elige de ahí y su barrio pudo cambiar. El balance,
    solo por lo gastado en premios y gastos (ver `profit`).
  */
  const loadAll = (signal?: AbortSignal) =>
    Promise.all([
      GetActivity.handler(activityId, signal),
      GetActivityBalance.handler(activityId, signal),
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
  const isSyncing =
    GetActivity.loading || GetActivityBalance.loading || ListActivityItems.loading || ListUsers.loading;

  /*
    Cobrado y ganancia encima del listado (Thony, 2026-11-11). Lo cobrado sale de las cartillas
    ya cargadas, así cada pago, cambio o eliminación lo actualiza sin volver a pedir nada; del
    balance solo se toma lo gastado en premios y gastos, que no cambia en esta página. Las
    anuladas no suman: sus pagos pasaron a la nueva.
  */
  const collected = roundSoles(
    items.filter((item) => !item.voidedAt).reduce((sum, item) => sum + item.paidAmount, 0),
  );
  const { balance } = GetActivityBalance;
  const profit = balance ? roundSoles(collected - balance.purchasedPrizes - balance.expenses) : null;

  const detailItem = items.find((item) => item.id === detailId) ?? null;
  const payItem = items.find((item) => item.id === payId) ?? null;
  const changeItem = items.find((item) => item.id === changeId) ?? null;

  const serialCounts = countSerials(items);
  const normalizedTerm = term.trim().toLowerCase();
  const activeFilterCount = countActiveFilters(filters);
  /* Búsqueda y filtros primero: los contadores de los tabs cuentan sobre lo que queda. */
  const matching = items
    .filter((item) => !normalizedTerm || matchesActivityItemSearch(item, normalizedTerm))
    .filter((item) => matchesItemFilters(item, filters));
  const tabCounts: Record<TPaymentTab, number> = { PAID: 0, PENDING: 0, VOIDED: 0 };
  for (const item of matching) {
    tabCounts[paymentTabOf(item)] += 1;
  }
  /* «Anuladas» solo aparece si hay alguna en la actividad (Thony, 2026-11-11). */
  const hasVoided = items.some((item) => item.voidedAt);
  const tabs: TPaymentTab[] = hasVoided ? ["PAID", "PENDING", "VOIDED"] : ["PAID", "PENDING"];
  const currentTab: TPaymentTab = tabs.includes(paymentTab) ? paymentTab : "PENDING";
  const visible = matching.filter((item) => paymentTabOf(item) === currentTab).sort(compareBySerial);
  /* En pagadas y anuladas «Por cobrar» no dice nada: en su lugar va el cambio de cartilla. */
  const isChangeColumn = currentTab !== "PENDING";
  const relatedSerials = changedSerials(items);
  /* Los contadores de los tabs reemplazan al «N de M» de encima del listado (Thony, 2026-11-11). */
  const paymentTabOptions: ICountTabOption<TPaymentTab>[] = tabs.map((tab) => ({
    value: tab,
    label: paymentTabLabels[tab],
    count: tabCounts[tab],
  }));
  /* Si en este tab no hay nada de lo buscado, el primer otro tab donde sí haya. */
  const otherTabWithResults = tabs.find((tab) => tab !== currentTab && tabCounts[tab] > 0);
  const paymentTabs = (className: string) => (
    <CountTabs
      label="Estado de pago"
      options={paymentTabOptions}
      value={currentTab}
      onChange={setPaymentTab}
      className={className}
    />
  );
  /* Celular: el cambio de vista pasa del botón flotante a la barra, a la izquierda de los filtros. */
  const viewToggle = (
    <IconButton
      size="lg"
      isBordered
      label={isCompactView ? "Ver en cards" : "Ver en vista compacta"}
      onClick={toggleCompactView}
    >
      {isCompactView ? <LayoutGrid className="size-5" /> : <Rows3 className="size-5" />}
    </IconButton>
  );
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

  const handleChanged = (result: IActivityItemChangeResult) => {
    ListActivityItems.onUpsert(result.voided);
    ListActivityItems.onUpsert(result.replacement);
  };

  /*
    La acción directa va suelta junto al `⋯` (acordado 2026-11-07): mientras falte cobrar,
    registrar el pago; pagada, cambiar la cartilla, que es lo más probable en una pagada
    (Thony, 2026-11-11). Una anulada queda como está: sin acciones.
  */
  const buildActions = (item: IActivityItemResource): IRowAction[] => {
    if (item.voidedAt) {
      return [];
    }
    const isPending = collectionOf(item).pending > 0;
    return [
      ...(isPending
        ? [{ icon: HandCoins, label: "Registrar pago", inline: true, onClick: () => setPayId(item.id) }]
        : []),
      { icon: Pencil, label: "Editar", onClick: () => openEdit(item) },
      { icon: Repeat, label: "Cambiar cartilla", inline: !isPending, onClick: () => setChangeId(item.id) },
      { icon: Trash2, label: "Eliminar", variant: "destructive", onClick: () => setDeleteTarget(item) },
    ];
  };

  /* Sin cuántos se vendieron: eso va en los KPIs (Thony, 2026-11-07). */
  const subtitle = activity ? <ActivityMeta activity={activity} /> : undefined;

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
      {/*
        Escritorio, como Clientes de id-pos (Thony, 2026-11-09): el encabezado y el cuerpo en
        dos cajas separadas, con radio de 12 px. En celular no hay cajas.
      */}
      <PageBox>
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
                `lg`: el mismo alto que el buscador (`h-control-lg`), para que la fila se vea pareja.
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
      </PageBox>

      <PageBox className="space-y-4">
      {/* Encima de la barra: se van al bajar y la barra con los tabs sigue fija. */}
      {items.length > 0 && <ActivityItemTotals collected={collected} profit={profit} />}

      {/*
        Escritorio: el buscador a la izquierda; a la derecha, los dos filtros y los tabs de pago,
        alineados abajo.
      */}
      {items.length > 0 && (
        <div className="hidden items-end justify-between gap-4 md:flex">
          <div className="w-full max-w-sm">{searchInput}</div>
          <div className="flex min-w-0 items-end gap-3">
            <div className="w-full max-w-md min-w-80">
              <ActivityItemFilterFields filters={filters} sellers={sellersOf(items)} onChange={setFilters} isRow />
            </div>
            {paymentTabs("h-control-lg shrink-0")}
          </div>
        </div>
      )}

      {/*
        Celular: en la barra fija, el buscador con el cambio de vista y los filtros a su derecha,
        y debajo los tabs de pago, que también quedan fijos.
      */}
      {items.length > 0 && (
        <StickyToolbar className="md:hidden">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">{searchInput}</div>
              {viewToggle}
              <FilterButton activeCount={activeFilterCount} onClick={showFilters.on} />
            </div>
            {paymentTabs("w-full")}
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
          title={
            normalizedTerm
              ? `Sin resultados para "${term.trim()}" en ${paymentTabLabels[currentTab]}`
              : activeFilterCount > 0
                ? `Ninguna en ${paymentTabLabels[currentTab]} coincide con los filtros`
                : `Ninguna en ${paymentTabLabels[currentTab]}`
          }
          action={
            /* Lo buscado puede estar en otro tab: se ofrece ir ahí antes que quitar filtros. */
            otherTabWithResults && (normalizedTerm || activeFilterCount > 0) ? (
              <Button type="button" variant="link" onClick={() => setPaymentTab(otherTabWithResults)}>
                Ver {tabCounts[otherTabWithResults]} en {paymentTabLabels[otherTabWithResults]}
              </Button>
            ) : (
              activeFilterCount > 0 && (
                <Button type="button" variant="link" onClick={() => setFilters(EMPTY_ITEM_FILTERS)}>
                  Quitar filtros
                </Button>
              )
            )
          }
        />
      )}

      {(isLoading || visible.length > 0) && (
        <div>
          <ActivityItemTable
            items={visible}
            isLoading={isLoading}
            serialCounts={serialCounts}
            tab={currentTab}
            relatedSerials={relatedSerials}
            buildActions={buildActions}
            onOpen={(item) => setDetailId(item.id)}
          />
          {isCompactView ? (
            <ActivityItemCompactList
              items={visible}
              isLoading={isLoading}
              serialCounts={serialCounts}
              tab={currentTab}
              relatedSerials={relatedSerials}
              onPay={(item) => setPayId(item.id)}
              onChangeItem={(item) => setChangeId(item.id)}
              onOpen={(item) => setDetailId(item.id)}
            />
          ) : (
            <ActivityItemGrid
              items={visible}
              isLoading={isLoading}
              serialCounts={serialCounts}
              isChangeColumn={isChangeColumn}
              relatedSerials={relatedSerials}
              buildActions={buildActions}
              onOpen={(item) => setDetailId(item.id)}
            />
          )}
        </div>
      )}
      </PageBox>

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
        relatedSerial={detailItem ? relatedSerials.get(detailItem.id) : undefined}
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

      <ItemChangeFormModal
        item={changeItem}
        items={items}
        onSaved={handleChanged}
        onClose={() => setChangeId(null)}
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

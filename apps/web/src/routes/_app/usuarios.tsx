import { Button } from "@juveco/ui/components/button";
import type { IUserResource } from "@juveco/shared/users";
import { fullName } from "@juveco/shared/people";
import { EUserRole } from "@juveco/shared/roles";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import ListPagination, { ResultsCounter } from "@/common/components/list-pagination";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import SearchInput from "@/common/components/search-input";
import StickyToolbar from "@/common/components/sticky-toolbar";
import { useBoolean } from "@/common/hooks/use-boolean";
import { usePagination } from "@/common/hooks/use-pagination";
import AccessFormModal from "@/modules/users/components/access-form-modal";
import UserDetailPanel from "@/modules/users/components/user-detail-panel";
import UserFormModal from "@/modules/users/components/user-form-modal";
import UserMobileList from "@/modules/users/components/user-mobile-list";
import UserTable from "@/modules/users/components/user-table";
import { useDeleteUser } from "@/modules/users/hooks/use-delete-user";
import { useListUsers } from "@/modules/users/hooks/use-list-users";
import { matchesUserSearch } from "@/modules/users/utils/user-search";

interface IUsersSearch {
  /** El usuario abierto en el detalle lateral: así se puede recargar o compartir el link. */
  usuario?: string;
}

export const Route = createFileRoute("/_app/usuarios")({
  validateSearch: (search: Record<string, unknown>): IUsersSearch => ({
    usuario: typeof search.usuario === "string" ? search.usuario : undefined,
  }),
  component: UsersPage,
});

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

/**
 * Usuarios: todas las personas de Juveco. Los administradores las registran y editan; solo el
 * superadmin da acceso a la app. A quien entra a la app no se le elimina desde acá.
 */
function UsersPage() {
  const { user: me } = Route.useRouteContext();
  const isSuperadmin = me.role === EUserRole.SUPERADMIN;
  const ListUsers = useListUsers();
  const DeleteUser = useDeleteUser();
  const showForm = useBoolean();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [editTarget, setEditTarget] = useState<IUserResource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<IUserResource | null>(null);
  const [accessTarget, setAccessTarget] = useState<IUserResource | null>(null);
  const [term, setTerm] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    ListUsers.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { users } = ListUsers;
  const isLoading = ListUsers.loading && users.length === 0;

  /* Se busca en la lista ya cargada: abrir un link con `?usuario=` no pide nada más. */
  const openUser = users.find((item) => item.id === search.usuario) ?? null;

  const normalizedTerm = term.trim().toLowerCase();
  const visible = users
    .filter((user) => !normalizedTerm || matchesUserSearch(user, normalizedTerm))
    .sort((first, second) => fullName(first).localeCompare(fullName(second), "es"));
  const pager = usePagination(visible, { initialPageSize: PAGE_SIZE_OPTIONS[0] });
  const hasContent = !isLoading && visible.length > 0;

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTerm(event.target.value);
    pager.resetPage();
  };

  const openDetail = (user: IUserResource) => navigate({ search: { usuario: user.id } });
  const closeDetail = () => navigate({ search: {} });

  const openCreate = () => {
    setEditTarget(undefined);
    showForm.on();
  };

  const openEdit = (user: IUserResource) => {
    setEditTarget(user);
    showForm.on();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const deleted = await DeleteUser.handler(deleteTarget);
    if (deleted) {
      ListUsers.onRemove(deleted.id);
      if (search.usuario === deleted.id) {
        closeDetail();
      }
    }
    setDeleteTarget(null);
  };

  const buildActions = (user: IUserResource): IRowAction[] => {
    const isPlainUser = user.role === EUserRole.USER;
    const edit: IRowAction = { icon: Pencil, label: "Editar", onClick: () => openEdit(user) };
    const grantAccess: IRowAction = { icon: KeyRound, label: "Dar acceso", onClick: () => setAccessTarget(user) };
    const remove: IRowAction = {
      icon: Trash2,
      label: "Eliminar",
      variant: "destructive",
      onClick: () => setDeleteTarget(user),
    };
    if (!isPlainUser) {
      return [edit];
    }
    return isSuperadmin ? [edit, grantAccess, remove] : [edit, remove];
  };

  const searchInput = (
    <SearchInput
      placeholder="Buscar usuario…"
      aria-label="Buscar usuario por nombre, barrio, número, usuario o nota"
      value={term}
      onChange={handleSearchChange}
    />
  );

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
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
      <PageHeader
        title="Usuarios"
        subtitle={users.length > 0 ? pluralize(users.length, "usuario", "usuarios") : undefined}
        isLoadingSubtitle={isLoading}
        action={
          <div className="flex items-center gap-3">
            {/* En escritorio el buscador va junto al botón para ahorrar una fila. */}
            {users.length > 0 && <div className="hidden w-72 md:block">{searchInput}</div>}
            <Button type="button" onClick={openCreate}>
              <Plus />
              Agregar
            </Button>
          </div>
        }
      />

      {/* En celular no entra junto al botón: queda en su barra fija. */}
      {users.length > 0 && (
        <StickyToolbar className="md:hidden">{searchInput}</StickyToolbar>
      )}

      {!isLoading && users.length === 0 && (
        <EmptyState
          icon={Users}
          title="Todavía no hay usuarios"
          description="Registra a las personas de Juveco con su barrio y su WhatsApp."
          action={
            <Button type="button" variant="link" onClick={openCreate}>
              Agregar el primero
            </Button>
          }
        />
      )}

      {!isLoading && users.length > 0 && visible.length === 0 && (
        <EmptyState icon={Search} title={`Sin resultados para "${term.trim()}"`} />
      )}

      {(isLoading || visible.length > 0) && (
        <>
          <ResultsCounter
            from={pager.rangeStart}
            to={pager.rangeEnd}
            total={pager.totalItems}
            isLoading={isLoading}
            className="lg:text-right"
          />
          <UserTable
            users={pager.pagedItems}
            isLoading={isLoading}
            buildActions={buildActions}
            onOpen={openDetail}
            footer={hasContent ? pagination : undefined}
          />
          <UserMobileList
            users={pager.pagedItems}
            isLoading={isLoading}
            buildActions={buildActions}
            onOpen={openDetail}
          />
          {hasContent && (
            <div className="rounded-xl bg-card px-4 py-3 shadow-card md:hidden">{pagination}</div>
          )}
        </>
      )}

      {/* Editar desde acá actualiza la lista, y el panel lee de la lista: se refresca solo. */}
      <UserDetailPanel
        user={openUser}
        buildActions={buildActions}
        onClose={closeDetail}
      />

      <UserFormModal
        open={showForm.active}
        user={editTarget}
        canGrantAccess={isSuperadmin}
        onSaved={ListUsers.onUpsert}
        onClose={showForm.off}
      />

      <AccessFormModal user={accessTarget} onSaved={ListUsers.onUpsert} onClose={() => setAccessTarget(null)} />

      <ConfirmModal
        open={deleteTarget !== null}
        title={`¿Eliminar a «${deleteTarget ? fullName(deleteTarget) : ""}»?`}
        description="Se borra de la lista de usuarios. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteUser.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

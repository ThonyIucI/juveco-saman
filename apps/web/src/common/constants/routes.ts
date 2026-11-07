import { LayoutDashboard, Users } from "lucide-react";
import type { ComponentType } from "react";

import type { TUserRole } from "@juveco/shared/roles";

/**
 * Las rutas se listan como literales y no como `string` porque el `to` de TanStack Router
 * está tipado: un enlace a una ruta inexistente tiene que romper el build, no la página.
 */
export type TNavPath = "/dashboard" | "/usuarios";

export interface INavItem {
  to: TNavPath;
  label: string;
  /** Etiqueta corta para la barra inferior, donde no entra la larga. */
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
}

/** Un grupo del menú lateral, con sus módulos como submenú. */
export interface INavGroup {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: readonly INavItem[];
}

export type TSidebarEntry = INavItem | INavGroup;

export const isNavGroup = (entry: TSidebarEntry): entry is INavGroup => "items" in entry;

const DASHBOARD: INavItem = { to: "/dashboard", label: "Panel", shortLabel: "Panel", icon: LayoutDashboard };
const USERS: INavItem = { to: "/usuarios", label: "Usuarios", shortLabel: "Usuarios", icon: Users };

/* Por ahora todos los roles ven lo mismo; dar acceso lo frena la pantalla (y el server). */
const APP_NAV: readonly INavItem[] = [DASHBOARD, USERS];

/** Los enlaces de la sesión. Sin sesión, ninguno. */
export const navItemsForRole = (role: TUserRole | null): readonly INavItem[] => (role ? APP_NAV : []);

/** La barra inferior (acceso rápido). Sin sesión, ninguno. */
export const quickAccessItemsForRole = (role: TUserRole | null): readonly INavItem[] =>
  role ? APP_NAV : [];

/** El menú lateral. Sin sesión, nada. */
export const sidebarEntriesForRole = (role: TUserRole | null): readonly TSidebarEntry[] =>
  role ? APP_NAV : [];

/** Con sesión, todos tienen menú lateral: el layout le deja su espacio. */
export const hasSidebarForRole = (role: TUserRole | null): boolean =>
  sidebarEntriesForRole(role).length > 0;

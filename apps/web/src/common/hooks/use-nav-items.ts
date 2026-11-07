import {
  hasSidebarForRole,
  navItemsForRole,
  quickAccessItemsForRole,
} from "@/common/constants/routes";
import { useSessionRole } from "@/common/hooks/use-session-role";

/**
 * Enlaces de navegación de la sesión actual. Sin sesión es una lista vacía, y de eso
 * dependen la barra inferior **y** el espacio que se le reserva debajo del contenido.
 */
export const useNavItems = () => navItemsForRole(useSessionRole());

/** Los de la barra inferior: solo lo más usado; el resto, en el menú lateral. */
export const useQuickAccessItems = () => quickAccessItemsForRole(useSessionRole());

/** Si la sesión tiene menú lateral (dueño y superadmin). */
export const useHasSidebar = () => hasSidebarForRole(useSessionRole());

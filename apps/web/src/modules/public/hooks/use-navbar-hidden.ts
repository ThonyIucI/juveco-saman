import { useScrollDirection } from "@/common/hooks/use-scroll-direction";

/**
 * Si el navbar debe esconderse: al bajar (pasados ~80 px) se va y al subir vuelve. Con el menú
 * móvil abierto se queda. Comparte el listener de scroll de la app (`useScrollDirection`).
 * Con movimiento reducido también se esconde, pero sin transición (lo resuelve la clase).
 */
export const useNavbarHidden = (isMenuOpen: boolean): boolean => {
  const direction = useScrollDirection();
  return direction === "down" && !isMenuOpen;
};

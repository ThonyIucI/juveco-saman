import { IconButton } from "@juveco/ui/components/icon-button";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

/**
 * Un solo toque cambia al tema opuesto. Sin desplegable: es una preferencia binaria y
 * el aspecto (sol ↔ luna) ya dice en cuál está. Al entrar por primera vez se respeta
 * el tema del sistema; el primer toque lo fija.
 */
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <IconButton
      size="md"
      isBordered
      label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </IconButton>
  );
}

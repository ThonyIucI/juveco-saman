import { Button, buttonVariants } from "@juveco/ui/components/button";
import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import ErrorScreen from "@/components/error-screen";
import { isStaleVersionError, reloadForNewVersion } from "@/lib/new-version";

/**
 * Pantalla de error de las rutas, en español (la de TanStack sale en inglés). Si el error
 * es por una versión vieja de la web abierta tras un deploy, recarga sola una vez.
 */
export default function RouteError({ error }: ErrorComponentProps) {
  const isStaleVersion = isStaleVersionError(error);
  const [isReloading, setIsReloading] = useState(isStaleVersion);

  useEffect(() => {
    if (isStaleVersion) {
      setIsReloading(reloadForNewVersion());
    }
  }, [isStaleVersion]);

  if (isReloading) {
    return (
      <ErrorScreen
        icon={RefreshCw}
        isIconSpinning
        title="Hay una versión nueva"
        description="Estamos cargándola, un momento."
      />
    );
  }

  return (
    <ErrorScreen
      icon={TriangleAlert}
      title="Algo salió mal"
      description="No pudimos mostrar esta pantalla. Recarga la página; si sigue pasando, avísanos."
    >
      <Button type="button" size="lg" onClick={() => window.location.reload()}>
        <RefreshCw />
        Recargar
      </Button>
      <Link to="/" className={buttonVariants({ variant: "ghost", size: "lg" })}>
        Volver al inicio
      </Link>
    </ErrorScreen>
  );
}

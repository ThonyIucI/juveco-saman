import { buttonVariants } from "@juveco/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPinOff } from "lucide-react";

import ErrorScreen from "./error-screen";

/**
 * La 404: cualquier dirección que no existe. «Volver al inicio» va a `/`, que manda al panel
 * (y el panel a /login si no hay sesión): una sola salida sirve con o sin sesión.
 */
export default function NotFound() {
  return (
    <ErrorScreen
      icon={MapPinOff}
      title="Esta página no existe"
      description="La dirección a la que intentaste entrar no está disponible o fue movida."
    >
      <Link to="/" className={buttonVariants({ size: "lg" })}>
        <ArrowLeft />
        Volver al inicio
      </Link>
    </ErrorScreen>
  );
}

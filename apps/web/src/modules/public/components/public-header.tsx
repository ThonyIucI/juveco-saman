import { buttonVariants } from "@juveco/ui/components/button";
import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

import { useSessionRole } from "@/common/hooks/use-session-role";
import { ModeToggle } from "@/components/mode-toggle";

/** Encabezado de la portada: el logo, el tema y la entrada para los administradores. */
export default function PublicHeader() {
  const hasSession = useSessionRole() !== null;

  return (
    <header className="sticky top-0 z-20 bg-card/90 shadow-edge-bottom backdrop-blur">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg font-extrabold text-primary">
          <img src="/logo.png" alt="" className="size-9" />
          Juveco Samán
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <ModeToggle />
          <Link to={hasSession ? "/dashboard" : "/login"} className={buttonVariants({ variant: "outline" })}>
            <LogIn />
            {hasSession ? "Ir al panel" : "Ingresar"}
          </Link>
        </div>
      </div>
      {/* Firma: las seis manos del logo. */}
      <div aria-hidden className="rainbow-band h-1" />
    </header>
  );
}

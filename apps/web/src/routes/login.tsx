import { createFileRoute, redirect } from "@tanstack/react-router";

import { ModeToggle } from "@/components/mode-toggle";
import SignInForm from "@/components/sign-in-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  /* Quien ya tiene sesión no ve el formulario. */
  beforeLoad: async () => {
    const session = await authClient.getSession();

    if (session.data) {
      throw redirect({ to: "/dashboard" });
    }
  },

  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      {/* Luz de fondo del diseño de Stitch: un halo del azul de la cinta detrás del logo. */}
      <div aria-hidden className="login-glow pointer-events-none absolute inset-0" />

      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="relative w-full max-w-[430px]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Logo de Juveco Samán" className="size-28 drop-shadow-xl" />
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">Juveco Samán</h1>
            <p className="mt-1 text-muted-foreground">Junta Vecinal Comunal Samán</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-card shadow-sheet ring-1 ring-border">
          <div aria-hidden className="rainbow-band h-1" />
          <div className="p-7 sm:p-8">
            <SignInForm />
          </div>
        </div>

        <p className="mt-8 text-center text-xs font-medium tracking-wide text-muted-foreground">
          Gestión 2026 – 2028
        </p>
      </div>
    </div>
  );
}

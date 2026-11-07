import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

/** Cierra la sesión y vuelve al login. Lo usan el menú del usuario y el menú lateral. */
export const useSignOut = () => {
  const navigate = useNavigate();

  return () =>
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/login" });
        },
        onError: () => {
          toast.error("No pudimos cerrar la sesión. Inténtalo de nuevo.");
        },
      },
    });
};

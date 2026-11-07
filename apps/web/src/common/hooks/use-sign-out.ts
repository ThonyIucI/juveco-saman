import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

const SIGN_OUT_FAILED_MESSAGE = "No pudimos cerrar la sesión. Inténtalo de nuevo.";

/** Cierra la sesión y vuelve al login. Lo usan el menú del usuario y el menú lateral. */
export const useSignOut = () => {
  const navigate = useNavigate();

  return async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            navigate({ to: "/login" });
          },
          onError: () => {
            toast.error(SIGN_OUT_FAILED_MESSAGE);
          },
        },
      });
    } catch (error) {
      /* Sin respuesta del servidor `signOut` lanza en vez de llamar a `onError`. */
      console.error("[sign-out]", error);
      toast.error(SIGN_OUT_FAILED_MESSAGE);
    }
  };
};

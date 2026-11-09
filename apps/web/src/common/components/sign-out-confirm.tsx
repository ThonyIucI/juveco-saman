import { useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import { useSignOut } from "@/common/hooks/use-sign-out";

interface ISignOutConfirmProps {
  open: boolean;
  onCancel: () => void;
}

/**
 * Confirma antes de cerrar la sesión (Thony, 2026-11-09): salir por error obliga a volver a
 * escribir correo y contraseña. La usan el menú del usuario y el menú lateral.
 */
export default function SignOutConfirm({ open, onCancel }: ISignOutConfirmProps) {
  const signOut = useSignOut();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const confirm = async () => {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  return (
    <ConfirmModal
      open={open}
      title="¿Cerrar sesión?"
      description="Para volver a entrar vas a necesitar tu correo y contraseña."
      confirmLabel="Cerrar sesión"
      cancelLabel="Seguir aquí"
      variant="destructive"
      loading={isSigningOut}
      onConfirm={confirm}
      onCancel={onCancel}
    />
  );
}

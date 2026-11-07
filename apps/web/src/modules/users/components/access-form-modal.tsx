import { Button } from "@juveco/ui/components/button";
import { fullName } from "@juveco/shared/people";
import { USER_MIN_PASSWORD_LENGTH, type IUserResource } from "@juveco/shared/users";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import Modal from "@/common/components/modal";
import TextField from "@/common/components/text-field";
import { useGrantAccess } from "@/modules/users/hooks/use-grant-access";

const FORM_ID = "access-form";
const DEFAULTS = { email: "", password: "" };

const formSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(USER_MIN_PASSWORD_LENGTH, "La contraseña debe tener al menos 8 caracteres"),
});

interface IAccessFormModalProps {
  /** A quién se le da acceso; `null` cierra la modal. */
  user: IUserResource | null;
  onSaved: (user: IUserResource) => void;
  onClose: () => void;
}

/**
 * Dar acceso a la app (solo el superadmin): el correo y la contraseña con los que entrará.
 * La contraseña se ve en claro a propósito: la elige el superadmin y se la pasa.
 */
export default function AccessFormModal({ user, onSaved, onClose }: IAccessFormModalProps) {
  const GrantAccess = useGrantAccess();

  const form = useForm({
    defaultValues: DEFAULTS,
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      if (!user) {
        return;
      }
      const saved = await GrantAccess.handler(user.id, {
        email: value.email.trim().toLowerCase(),
        password: value.password,
      });
      if (saved) {
        onSaved(saved);
        onClose();
      }
    },
  });

  useEffect(() => {
    if (user) {
      form.reset(DEFAULTS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <Modal
      open={user !== null}
      title="Dar acceso"
      description={user ? `${fullName(user)} entrará como administrador. Pásale estos datos.` : undefined}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={FORM_ID}>
                {isSubmitting && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                Dar acceso
              </Button>
            )}
          </form.Subscribe>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          /* El botón nunca se apaga: un segundo clic mientras guarda no hace nada. */
          if (!form.state.isSubmitting) {
            form.handleSubmit();
          }
        }}
        className="space-y-4"
      >
        <form.Field name="email">
          {(field) => (
            <TextField
              id={field.name}
              label="Correo para entrar"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="Ingresa el correo"
              value={field.state.value}
              errors={field.state.meta.errors}
              onBlur={field.handleBlur}
              onValueChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <TextField
              id={field.name}
              label="Contraseña"
              type="text"
              autoComplete="new-password"
              placeholder="Ingresa la contraseña"
              value={field.state.value}
              errors={field.state.meta.errors}
              onBlur={field.handleBlur}
              onValueChange={field.handleChange}
            />
          )}
        </form.Field>
      </form>
    </Modal>
  );
}

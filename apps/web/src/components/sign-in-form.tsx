import { Button } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { Input } from "@juveco/ui/components/input";
import { Label } from "@juveco/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

const MIN_PASSWORD_LENGTH = 8;

/** Acceso por correo y contraseña. */
export default function SignInForm() {
  const navigate = useNavigate({ from: "/" });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        { email: value.email, password: value.password },
        {
          onSuccess: () => {
            navigate({ to: "/dashboard" });
            toast.success("Sesión iniciada");
          },
          onError: (error) => {
            toast.error(error.error.message || "No se pudo iniciar sesión.");
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Correo inválido"),
        password: z
          .string()
          .min(MIN_PASSWORD_LENGTH, "La contraseña debe tener al menos 8 caracteres"),
      }),
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        /* El botón nunca se apaga: con errores, el clic los muestra; mientras entra, no repite. */
        if (!form.state.isSubmitting) {
          form.handleSubmit();
        }
      }}
      className="space-y-5"
    >
      <form.Field name="email">
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;

          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Correo</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="Ingresa tu correo"
                  aria-invalid={hasError}
                  className="pl-12"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm font-semibold text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          );
        }}
      </form.Field>

      <form.Field name="password">
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;

          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={field.name}
                  name={field.name}
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  aria-invalid={hasError}
                  className="px-12"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <IconButton
                  tone="muted"
                  label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                >
                  {isPasswordVisible ? <EyeOff /> : <Eye />}
                </IconButton>
              </div>
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm font-semibold text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          );
        }}
      </form.Field>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" size="xl">
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin motion-reduce:animate-none" />
                Ingresando…
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

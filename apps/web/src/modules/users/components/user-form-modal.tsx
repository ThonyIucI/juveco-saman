import { Input } from "@juveco/ui/components/input";
import { Label } from "@juveco/ui/components/label";
import { Switch } from "@juveco/ui/components/switch";
import { Textarea } from "@juveco/ui/components/textarea";
import { USER_MIN_PASSWORD_LENGTH, type IUserResource } from "@juveco/shared/users";
import { EUserRole, userRoleLabels } from "@juveco/shared/roles";
import { NEIGHBORHOODS } from "@juveco/shared/neighborhoods";
import { PERSON_NAME_MAX_LENGTH, PERSON_NOTE_MAX_LENGTH } from "@juveco/shared/people";
import { useForm, useStore } from "@tanstack/react-form";
import { useRouteContext } from "@tanstack/react-router";
import { AtSign, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import FormSubmitButtons from "@/common/components/form-submit-buttons";
import Modal from "@/common/components/modal";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import PhoneInput from "@/common/components/phone-input";
import SegmentedTabs, { type ISegmentedTabOption } from "@/common/components/segmented-tabs";
import Select, { type IOption } from "@/common/components/select";
import TextField from "@/common/components/text-field";
import {
  type IPersonInitialValues,
  type TWhatsAppMode,
  USERNAME_INPUT_MAX_LENGTH,
  buildPersonDefaults,
  initialWhatsAppMode,
  personFormSchema,
  readLastNeighborhood,
  rememberNeighborhood,
  toPersonPayload,
} from "@/common/utils/person-form";
import { useCreateUser } from "@/modules/users/hooks/use-create-user";
import { useUpdateUser } from "@/modules/users/hooks/use-update-user";
import type { IGrantAccessPayload } from "@/modules/users/services/user.service";

const FORM_ID = "user-form";

/* Hoy el único rol que se puede dar al crear es administrador; el superadmin es solo Thony. */
const ASSIGNABLE_ROLES = [EUserRole.ADMIN] as const;
const ROLE_OPTIONS: IOption[] = ASSIGNABLE_ROLES.map((role) => ({ value: role, label: userRoleLabels[role] }));

const ACCESS_DEFAULTS = { hasAccess: false, role: EUserRole.ADMIN as string, email: "", password: "" };

/* Con el switch encendido, el correo y la contraseña pasan a ser obligatorios. */
const formSchema = personFormSchema
  .extend({ hasAccess: z.boolean(), role: z.string(), email: z.string(), password: z.string() })
  .superRefine((value, context) => {
    if (!value.hasAccess) {
      return;
    }
    if (!ROLE_OPTIONS.some((option) => option.value === value.role)) {
      context.addIssue({ code: "custom", path: ["role"], message: "Elige el rol" });
    }
    if (!z.email().safeParse(value.email.trim()).success) {
      context.addIssue({ code: "custom", path: ["email"], message: "Correo inválido" });
    }
    if (value.password.length < USER_MIN_PASSWORD_LENGTH) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "La contraseña debe tener al menos 8 caracteres",
      });
    }
  });

const WHATSAPP_LABELS: Record<TWhatsAppMode, string> = {
  phone: "Número de WhatsApp (opcional)",
  username: "Usuario de WhatsApp (opcional)",
};

/* El campo que corresponde a cada modo, para saber a cuál saltar si tiene un error. */
const WHATSAPP_FIELD_BY_MODE = { phone: "phone", username: "whatsappUsername" } as const;

/* Los barrios salen de las constantes, nunca de una petición. */
const NEIGHBORHOOD_OPTIONS: IOption[] = NEIGHBORHOODS.map(({ id, name }) => ({ value: id, label: name }));

interface IWhatsAppFilled {
  hasPhone: boolean;
  hasUsername: boolean;
}

const buildWhatsAppOptions = ({ hasPhone, hasUsername }: IWhatsAppFilled): ISegmentedTabOption<TWhatsAppMode>[] => [
  { value: "phone", icon: Phone, label: "Número de WhatsApp", hasValue: hasPhone },
  { value: "username", icon: AtSign, label: "Usuario de WhatsApp", hasValue: hasUsername },
];

interface IUserFormModalProps {
  open: boolean;
  /** Sin usuario: alta. Con usuario: edición. */
  user?: IUserResource;
  /** Solo al crear: lo que se escribió en el buscador. */
  initialValues?: IPersonInitialValues;
  /** Solo el superadmin: muestra el switch para dar acceso a la app al crear. */
  canGrantAccess?: boolean;
  onSaved: (user: IUserResource) => void;
  onClose: () => void;
}

/** Alta y edición de una persona: nombres, apellidos, barrio, WhatsApp y una nota. */
export default function UserFormModal({
  open,
  user,
  initialValues,
  canGrantAccess = false,
  onSaved,
  onClose,
}: IUserFormModalProps) {
  const isEdit = Boolean(user);
  const canShowAccess = canGrantAccess && !isEdit;
  const CreateUser = useCreateUser();
  const UpdateUser = useUpdateUser();
  const [whatsappMode, setWhatsappMode] = useState<TWhatsAppMode>("phone");
  /* El administrador con sesión: el último barrio se recuerda por cada uno. */
  const { user: sessionUser } = useRouteContext({ from: "/_app" });
  /* «Crear y seguir creando»: guarda y deja el formulario abierto para el siguiente. */
  const keepOpenRef = useRef(false);

  /* Una persona nueva arranca con el último barrio usado, salvo que llegue otro. */
  const buildCreateValues = (): IPersonInitialValues => ({
    neighborhoodId: readLastNeighborhood(sessionUser.personId),
    ...initialValues,
  });

  const resetForm = (values?: IPersonInitialValues) => {
    const defaults = buildPersonDefaults(user, values);
    form.reset({ ...defaults, ...ACCESS_DEFAULTS });
    setWhatsappMode(initialWhatsAppMode(defaults));
  };

  const form = useForm({
    defaultValues: { ...buildPersonDefaults(user), ...ACCESS_DEFAULTS },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = toPersonPayload(value);
      const access: IGrantAccessPayload | undefined =
        canShowAccess && value.hasAccess
          ? { role: EUserRole.ADMIN, email: value.email.trim().toLowerCase(), password: value.password }
          : undefined;
      const saved = user
        ? await UpdateUser.handler(user.id, payload)
        : await CreateUser.handler({ ...payload, access });

      if (!saved) {
        return;
      }
      if (!user) {
        rememberNeighborhood(sessionUser.personId, saved.neighborhood?.id);
      }
      onSaved(saved);
      if (keepOpenRef.current) {
        /* El siguiente arranca vacío, con el barrio recién usado (no con lo del buscador). */
        resetForm({ neighborhoodId: readLastNeighborhood(sessionUser.personId) });
        return;
      }
      onClose();
    },
    /* Si el error está en el WhatsApp que no se ve, se cambia a ese para mostrarlo. */
    onSubmitInvalid: ({ formApi }) => {
      const hiddenMode: TWhatsAppMode = whatsappMode === "phone" ? "username" : "phone";
      const hiddenErrors = formApi.getFieldMeta(WHATSAPP_FIELD_BY_MODE[hiddenMode])?.errors ?? [];
      const visibleErrors = formApi.getFieldMeta(WHATSAPP_FIELD_BY_MODE[whatsappMode])?.errors ?? [];

      if (hiddenErrors.length > 0 && visibleErrors.length === 0) {
        setWhatsappMode(hiddenMode);
      }
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  useEffect(() => {
    if (open) {
      resetForm(user ? undefined : buildCreateValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  return (
    <Modal
      isDirty={isDirty}
      open={open}
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
      width="lg"
      onClose={onClose}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormSubmitButtons
              formId={FORM_ID}
              isSubmitting={isSubmitting}
              label={isEdit ? "Guardar cambios" : "Crear"}
              onSubmitAndContinue={
                isEdit
                  ? undefined
                  : () => {
                      keepOpenRef.current = true;
                      form.handleSubmit();
                    }
              }
            />
          )}
        </form.Subscribe>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          /* Enter o el botón principal: guarda y cierra. «Crear y seguir creando» no pasa por acá. */
          keepOpenRef.current = false;
          /* El botón nunca se apaga: un segundo clic mientras guarda no hace nada. */
          if (!form.state.isSubmitting) {
            form.handleSubmit();
          }
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="firstName">
            {(field) => (
              <TextField
                id={field.name}
                label="Nombres"
                autoCapitalize="words"
                maxLength={PERSON_NAME_MAX_LENGTH}
                placeholder="Ingresa los nombres"
                value={field.state.value}
                errors={field.state.meta.errors}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
              />
            )}
          </form.Field>

          <form.Field name="lastName">
            {(field) => (
              <TextField
                id={field.name}
                label="Apellidos (opcional)"
                autoCapitalize="words"
                maxLength={PERSON_NAME_MAX_LENGTH}
                placeholder="Ingresa los apellidos"
                value={field.state.value}
                errors={field.state.meta.errors}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
              />
            )}
          </form.Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="neighborhoodId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Barrio (opcional)</Label>
                <Select
                  inputId={field.name}
                  options={NEIGHBORHOOD_OPTIONS}
                  placeholder="Elige el barrio"
                  isClearable
                  isSearchable={false}
                  isInvalid={field.state.meta.errors.length > 0}
                  /* Cada barrio en su color, en el menú y en lo elegido. */
                  formatOptionLabel={(option) => (
                    <NeighborhoodBadge neighborhood={{ id: option.value, name: option.label }} hasIcon={false} />
                  )}
                  value={NEIGHBORHOOD_OPTIONS.find((option) => option.value === field.state.value) ?? null}
                  onBlur={field.handleBlur}
                  onChange={(option) => field.handleChange(option?.value ?? "")}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          {/* Un solo campo: número o usuario de WhatsApp. El otro no se borra al cambiar. */}
          <form.Subscribe
            selector={(state) => ({
              hasPhone: state.values.phone.number !== "",
              hasUsername: state.values.whatsappUsername.trim() !== "",
            })}
          >
            {({ hasPhone, hasUsername }) => (
              <div className="space-y-2">
                {/* Mismo alto que el label de Barrio: los tabs no empujan el campo hacia abajo. */}
                <div className="flex h-5 items-center justify-between gap-2">
                  <Label htmlFor={WHATSAPP_FIELD_BY_MODE[whatsappMode]}>{WHATSAPP_LABELS[whatsappMode]}</Label>
                  <SegmentedTabs
                    className="-my-1.5"
                    label="Cómo se escribe el WhatsApp"
                    options={buildWhatsAppOptions({ hasPhone, hasUsername })}
                    value={whatsappMode}
                    onChange={setWhatsappMode}
                  />
                </div>

                {whatsappMode === "phone" ? (
                  <form.Field name="phone">
                    {(field) => (
                      <>
                        <PhoneInput
                          id={field.name}
                          value={field.state.value}
                          isInvalid={field.state.meta.errors.length > 0}
                          onBlur={field.handleBlur}
                          onChange={field.handleChange}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </>
                    )}
                  </form.Field>
                ) : (
                  <form.Field name="whatsappUsername">
                    {(field) => (
                      <>
                        <Input
                          id={field.name}
                          name={field.name}
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          maxLength={USERNAME_INPUT_MAX_LENGTH}
                          placeholder="Ingresa el usuario de WhatsApp"
                          aria-invalid={field.state.meta.errors.length > 0}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </>
                    )}
                  </form.Field>
                )}
              </div>
            )}
          </form.Subscribe>
        </div>

        {canShowAccess && (
          <div className="space-y-4 border-y border-border py-4">
            <form.Field name="hasAccess">
              {(field) => (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor={field.name} className="font-bold">Crear usuario</Label>
                    <p className="text-sm text-muted-foreground">Puede acceder y utilizar las funcionalidades del sistema según su rol.</p>
                  </div>
                  <Switch
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.hasAccess}>
              {(hasAccess) =>
                hasAccess && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <form.Field name="email">
                      {(field) => (
                        <TextField
                          id={field.name}
                          label="Correo"
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
                    <form.Field name="role">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Rol</Label>
                          <Select
                            inputId={field.name}
                            options={ROLE_OPTIONS}
                            placeholder="Elige el rol"
                            isSearchable={false}
                            value={ROLE_OPTIONS.find((option) => option.value === field.state.value) ?? null}
                            onBlur={field.handleBlur}
                            onChange={(option) => field.handleChange(option?.value ?? "")}
                          />
                          <FieldError errors={field.state.meta.errors} />
                        </div>
                      )}
                    </form.Field>
                  </div>
                )
              }
            </form.Subscribe>
          </div>
        )}

        <form.Field name="note">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nota (opcional)</Label>
              <Textarea
                id={field.name}
                name={field.name}
                rows={3}
                maxLength={PERSON_NOTE_MAX_LENGTH}
                placeholder="Ingresa una nota"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="min-h-24 rounded-lg border border-border bg-field px-4 py-3 text-sm font-medium focus-visible:ring-4 focus-visible:ring-ring/30 md:text-sm"
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}

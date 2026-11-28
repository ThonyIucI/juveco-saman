import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import { PERSON_NAME_MAX_LENGTH, fullName } from "@juveco/shared/people";
import {
  CONDITION_NOTE_MAX_LENGTH,
  DOCUMENT_NUMBER_LENGTH,
  EGender,
  type IPersonMatchResource,
  genderLabels,
  isGender,
} from "@juveco/shared/user-profiles";
import type { ReactFormExtendedApi } from "@tanstack/react-form";
import { IdCard, Mars, TriangleAlert, Venus } from "lucide-react";

import FieldError from "@/common/components/field-error";
import OptionCards, { type IOptionCard } from "@/common/components/option-cards";
import TextField from "@/common/components/text-field";
import { formatWrittenDateInput } from "@/common/utils/person-form";

import ConditionChips from "./condition-chips";

/**
 * Los campos de una persona que comparten el formulario de usuario y el de integrante de una
 * vivienda, uno por uno para que cada formulario los agrupe como le toca. Reciben el formulario
 * del padre; sus nombres de campo son los de `personFormSchema`.
 */

/* El formulario del padre trae además sus propios campos: solo se usan los de la persona. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TPersonFormApi = ReactFormExtendedApi<any, any, any, any, any, any, any, any, any, any, any, any>;

const CONDITIONS_LABEL_ID = "person-conditions-label";
const GENDER_LABEL_ID = "person-gender-label";
const BIRTH_DATE_INPUT_LENGTH = 10;
const GENDER_OPTIONS: IOptionCard<EGender>[] = [
  { value: EGender.FEMALE, label: genderLabels[EGender.FEMALE], icon: Venus },
  { value: EGender.MALE, label: genderLabels[EGender.MALE], icon: Mars },
];

interface IPersonFieldsProps {
  form: TPersonFormApi;
}

/**
 * Nombres, apellido paterno y apellido materno. `isFlat`: los tres sueltos, para que el padre
 * los acomode en su propia grilla (el de integrante, en dos columnas como id-pos).
 */
export function PersonNameFields({ form, isFlat = false }: IPersonFieldsProps & { isFlat?: boolean }) {
  return (
    <>
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

      <div className={isFlat ? "contents" : "grid gap-4 sm:grid-cols-2"}>
        <form.Field name="paternalLastName">
          {(field) => (
            <TextField
              id={field.name}
              label="Apellido paterno (opcional)"
              autoCapitalize="words"
              maxLength={PERSON_NAME_MAX_LENGTH}
              placeholder="Ingresa el apellido paterno"
              value={field.state.value}
              errors={field.state.meta.errors}
              onBlur={field.handleBlur}
              onValueChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="maternalLastName">
          {(field) => (
            <TextField
              id={field.name}
              label="Apellido materno (opcional)"
              autoCapitalize="words"
              maxLength={PERSON_NAME_MAX_LENGTH}
              placeholder="Ingresa el apellido materno"
              value={field.state.value}
              errors={field.state.meta.errors}
              onBlur={field.handleBlur}
              onValueChange={field.handleChange}
            />
          )}
        </form.Field>
      </div>
    </>
  );
}

interface IPersonDocumentFieldProps extends IPersonFieldsProps {
  /** Quien ya tiene ese DNI (bloquea el guardado). */
  documentMatch: IPersonMatchResource | null;
  /** «Ver persona»: lleva a su registro. */
  onViewMatch?: (id: string) => void;
  /** Con él, en vez de «Ver persona» se ofrece «Usar esta persona» (elegirla en lugar de crearla). */
  onUseMatch?: (id: string) => void;
  /** El DNI solo y grande, como primer paso. */
  isLarge?: boolean;
}

/** El DNI (opcional) y, si ya existe, quién lo tiene. */
export function PersonDocumentField({ form, documentMatch, onViewMatch, onUseMatch, isLarge = false }: IPersonDocumentFieldProps) {
  const matchAction = onUseMatch
    ? { label: "Usar esta persona", run: onUseMatch }
    : onViewMatch
      ? { label: "Ver persona", run: onViewMatch }
      : null;

  return (
    <form.Field name="documentNumber">
      {(field) => (
        <div className="space-y-2">
          <TextField
            id={field.name}
            label="DNI"
            icon={IdCard}
            inputMode="numeric"
            autoComplete="off"
            maxLength={DOCUMENT_NUMBER_LENGTH}
            placeholder="Ingresa el DNI"
            className={isLarge ? "h-control-lg text-lg tracking-widest tabular-nums" : undefined}
            value={field.state.value}
            errors={field.state.meta.errors}
            onBlur={field.handleBlur}
            onValueChange={(value) => field.handleChange(value.replace(/\D/g, ""))}
          />
          {documentMatch && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              «{fullName(documentMatch)}» ya tiene este DNI.{" "}
              {matchAction && (
                <button
                  type="button"
                  onClick={() => matchAction.run(documentMatch.id)}
                  className="cursor-pointer underline underline-offset-2"
                >
                  {matchAction.label}
                </button>
              )}
            </p>
          )}
        </div>
      )}
    </form.Field>
  );
}

/** Fecha de nacimiento, escrita «día/mes/año». */
export function PersonBirthDateField({ form }: IPersonFieldsProps) {
  return (
    <form.Field name="birthDate">
      {(field) => (
        <TextField
          id={field.name}
          label="Fecha de nacimiento (día/mes/año)"
          inputMode="numeric"
          autoComplete="off"
          maxLength={BIRTH_DATE_INPUT_LENGTH}
          placeholder="Ingresa la fecha"
          value={field.state.value}
          errors={field.state.meta.errors}
          onBlur={field.handleBlur}
          onValueChange={(value) => field.handleChange(formatWrittenDateInput(value))}
        />
      )}
    </form.Field>
  );
}

/** Quienes tienen el mismo nombre y fecha de nacimiento: solo avisa, se deja guardar igual. */
export function NameMatchesWarning({ nameMatches }: { nameMatches: IPersonMatchResource[] }) {
  if (nameMatches.length === 0) {
    return null;
  }
  return (
    <p role="status" className="flex items-start gap-1.5 text-sm font-medium text-yellow">
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      Ya hay alguien con ese nombre y fecha de nacimiento: {nameMatches.map((match) => fullName(match)).join(", ")}.
      Puedes guardar igual.
    </p>
  );
}

/** Femenino o masculino, en botones; opcional: tocar el elegido lo desmarca. */
export function PersonGenderField({ form }: IPersonFieldsProps) {
  return (
    <form.Field name="gender">
      {(field) => (
        <div className="space-y-2">
          <Label id={GENDER_LABEL_ID}>Género (opcional)</Label>
          <OptionCards
            labelledBy={GENDER_LABEL_ID}
            options={GENDER_OPTIONS}
            value={isGender(field.state.value) ? field.state.value : ""}
            onChange={field.handleChange}
            onClear={() => field.handleChange("")}
          />
          <FieldError errors={field.state.meta.errors} />
        </div>
      )}
    </form.Field>
  );
}

/** Condiciones de prioridad (chips) y su detalle. Todo opcional. */
export function PersonConditionFields({ form }: IPersonFieldsProps) {
  return (
    <>
      <form.Field name="conditions">
        {(field) => (
          <div className="space-y-2">
            <Label id={CONDITIONS_LABEL_ID}>Condiciones de prioridad (opcional)</Label>
            <ConditionChips labelledBy={CONDITIONS_LABEL_ID} value={field.state.value} onChange={field.handleChange} />
          </div>
        )}
      </form.Field>

      <form.Field name="conditionNote">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Detalle de las condiciones (opcional)</Label>
            <Textarea
              id={field.name}
              name={field.name}
              rows={2}
              maxLength={CONDITION_NOTE_MAX_LENGTH}
              placeholder="Ingresa el detalle"
              aria-invalid={field.state.meta.errors.length > 0}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              className="min-h-20 rounded-lg border border-field-border bg-field px-4 py-3 dark:bg-field text-sm font-medium focus-visible:ring-4 focus-visible:ring-ring/30 md:text-sm"
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
    </>
  );
}

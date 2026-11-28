import { Label } from "@juveco/ui/components/label";
import { Textarea } from "@juveco/ui/components/textarea";
import { PERSON_NAME_MAX_LENGTH, fullName } from "@juveco/shared/people";
import {
  CONDITION_NOTE_MAX_LENGTH,
  DOCUMENT_NUMBER_LENGTH,
  type IPersonMatchResource,
  genderLabels,
} from "@juveco/shared/user-profiles";
import type { ReactFormExtendedApi } from "@tanstack/react-form";
import { TriangleAlert } from "lucide-react";

import FieldError from "@/common/components/field-error";
import Select, { type IOption } from "@/common/components/select";
import TextField from "@/common/components/text-field";
import { formatWrittenDateInput } from "@/common/utils/person-form";

import ConditionChips from "./condition-chips";

/**
 * Los campos de una persona que comparten el formulario de usuario y el de integrante de una
 * vivienda: nombres y apellidos, y los datos del censo (DNI, nacimiento, género, condiciones).
 * Reciben el formulario del padre; sus nombres de campo son los de `personFormSchema`.
 */

/* El formulario del padre trae además sus propios campos: solo se usan los de la persona. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TPersonFormApi = ReactFormExtendedApi<any, any, any, any, any, any, any, any, any, any, any, any>;

const CONDITIONS_LABEL_ID = "person-conditions-label";
const BIRTH_DATE_INPUT_LENGTH = 10;
const GENDER_OPTIONS: IOption[] = Object.entries(genderLabels).map(([value, label]) => ({ value, label }));

interface IPersonFieldsProps {
  form: TPersonFormApi;
}

/** Nombres, apellido paterno y apellido materno. */
export function PersonNameFields({ form }: IPersonFieldsProps) {
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

      <div className="grid gap-4 sm:grid-cols-2">
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

interface IPersonCensusFieldsProps extends IPersonFieldsProps {
  /** Quien ya tiene ese DNI (bloquea el guardado). */
  documentMatch: IPersonMatchResource | null;
  /** Quienes tienen el mismo nombre y fecha de nacimiento (solo avisa). */
  nameMatches: IPersonMatchResource[];
  /** «Ver persona»: lleva a su registro. */
  onViewMatch: (id: string) => void;
}

/** DNI, fecha de nacimiento, género, condiciones de prioridad y su detalle. Todo opcional. */
export function PersonCensusFields({ form, documentMatch, nameMatches, onViewMatch }: IPersonCensusFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="documentNumber">
          {(field) => (
            <div className="space-y-2">
              <TextField
                id={field.name}
                label="DNI"
                inputMode="numeric"
                autoComplete="off"
                maxLength={DOCUMENT_NUMBER_LENGTH}
                placeholder="Ingresa el DNI"
                value={field.state.value}
                errors={field.state.meta.errors}
                onBlur={field.handleBlur}
                onValueChange={(value) => field.handleChange(value.replace(/\D/g, ""))}
              />
              {documentMatch && (
                <p role="alert" className="text-sm font-semibold text-destructive">
                  «{fullName(documentMatch)}» ya tiene este DNI.{" "}
                  <button
                    type="button"
                    onClick={() => onViewMatch(documentMatch.id)}
                    className="cursor-pointer underline underline-offset-2"
                  >
                    Ver persona
                  </button>
                </p>
              )}
            </div>
          )}
        </form.Field>

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
      </div>

      {/* Se deja guardar igual: solo se avisa (mismo tono que la serie repetida). */}
      {nameMatches.length > 0 && (
        <p role="status" className="flex items-start gap-1.5 text-sm font-medium text-yellow">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          Ya hay alguien con ese nombre y fecha de nacimiento: {nameMatches.map((match) => fullName(match)).join(", ")}.
          Puedes guardar igual.
        </p>
      )}

      <form.Field name="gender">
        {(field) => (
          <div className="space-y-2 sm:max-w-[calc(50%-0.5rem)]">
            <Label htmlFor={field.name}>Género (opcional)</Label>
            <Select
              inputId={field.name}
              options={GENDER_OPTIONS}
              placeholder="Elige el género"
              isClearable
              isSearchable={false}
              isInvalid={field.state.meta.errors.length > 0}
              value={GENDER_OPTIONS.find((option) => option.value === field.state.value) ?? null}
              onBlur={field.handleBlur}
              onChange={(option) => field.handleChange(option?.value ?? "")}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

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

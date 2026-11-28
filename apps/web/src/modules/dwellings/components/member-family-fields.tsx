import { Label } from "@juveco/ui/components/label";
import { Switch } from "@juveco/ui/components/switch";
import {
  FAMILY_CONTACT_NAME_MAX_LENGTH,
  type IFamilyResource,
  MEMBER_RELATIONSHIPS,
  NEW_FAMILY,
  familyNameOf,
  familyRelationshipLabels,
} from "@juveco/shared/families";
import { Star } from "lucide-react";

import FieldError from "@/common/components/field-error";
import PhoneInput from "@/common/components/phone-input";
import Select, { type IOption } from "@/common/components/select";
import TextField from "@/common/components/text-field";
import type { TPersonFormApi } from "@/modules/users/components/person-fields";
import { headOf } from "@/modules/dwellings/utils/member-form";

const RELATIONSHIP_OPTIONS: IOption[] = MEMBER_RELATIONSHIPS.map((relationship) => ({
  value: relationship,
  label: familyRelationshipLabels[relationship],
}));

interface IMemberFamilyFieldsProps {
  form: TPersonFormApi;
  /** Las familias que la vivienda ya tiene. */
  families: IFamilyResource[];
  isEdit: boolean;
  /** La estrella no se puede apagar: lo explica `headHint`. */
  isHeadLocked: boolean;
  headHint: string | null;
  isFamilyPickerOpen: boolean;
  onOpenFamilyPicker: () => void;
}

/**
 * Lo que pone a la persona en la vivienda: la estrella de jefe(a), el parentesco con el jefe,
 * el contacto alternativo si el jefe no tiene celular y, escondida, la familia.
 */
export default function MemberFamilyFields({
  form,
  families,
  isEdit,
  isHeadLocked,
  headHint,
  isFamilyPickerOpen,
  onOpenFamilyPicker,
}: IMemberFamilyFieldsProps) {
  const familyOptions: IOption[] = [
    ...families.map((family) => ({ value: family.id, label: familyNameOf(headOf(family)) })),
    { value: NEW_FAMILY, label: "Nueva familia" },
  ];
  /* Con 2 o más familias hay que elegir una: el selector no se esconde. */
  const isFamilyPickerShown = !isEdit && families.length > 0 && (isFamilyPickerOpen || families.length >= 2);
  const canOfferFamilyPicker = !isEdit && families.length === 1 && !isFamilyPickerShown;

  return (
    <>
      <form.Field name="isHead">
        {(field) => (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={field.name} className="flex items-center gap-2 font-semibold">
                <Star aria-hidden className="size-4.5 fill-primary text-primary" />
                Es jefe(a) de hogar
              </Label>
              <Switch
                id={field.name}
                checked={field.state.value}
                disabled={isHeadLocked}
                onCheckedChange={field.handleChange}
              />
            </div>
            {headHint && <p className="text-sm text-muted-foreground">{headHint}</p>}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.isHead as boolean}>
        {(isHead) =>
          !isHead && (
            <form.Field name="relationship">
              {(field) => (
                <div className="space-y-2 sm:max-w-[calc(50%-0.5rem)]">
                  <Label htmlFor={field.name}>Parentesco con el jefe(a)</Label>
                  <Select
                    inputId={field.name}
                    options={RELATIONSHIP_OPTIONS}
                    placeholder="Elige el parentesco"
                    isSearchable={false}
                    isInvalid={field.state.meta.errors.length > 0}
                    value={RELATIONSHIP_OPTIONS.find((option) => option.value === field.state.value) ?? null}
                    onBlur={field.handleBlur}
                    onChange={(option) => field.handleChange(option?.value ?? "")}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>
          )
        }
      </form.Subscribe>

      {/* El contacto alternativo solo se pide al jefe sin celular, y nunca bloquea. */}
      <form.Subscribe selector={(state) => state.values.isHead && state.values.phone.number.trim() === ""}>
        {(isContactAsked) =>
          isContactAsked && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                El jefe(a) no tiene celular. Si hay un vecino o familiar que reciba los avisos, escribe su número y a
                quién pertenece. Puedes dejarlo vacío.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="contactName">
                  {(field) => (
                    <TextField
                      id={field.name}
                      label="A quién pertenece el número"
                      autoComplete="off"
                      maxLength={FAMILY_CONTACT_NAME_MAX_LENGTH}
                      placeholder="Ingresa el nombre del contacto"
                      value={field.state.value}
                      errors={field.state.meta.errors}
                      onBlur={field.handleBlur}
                      onValueChange={field.handleChange}
                    />
                  )}
                </form.Field>

                <form.Field name="contactPhone">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Teléfono del contacto</Label>
                      <PhoneInput
                        id={field.name}
                        value={field.state.value}
                        isInvalid={field.state.meta.errors.length > 0}
                        onBlur={field.handleBlur}
                        onChange={field.handleChange}
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </div>
                  )}
                </form.Field>
              </div>
            </div>
          )
        }
      </form.Subscribe>

      {canOfferFamilyPicker && (
        <button
          type="button"
          onClick={onOpenFamilyPicker}
          className="cursor-pointer text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          ¿Es de otra familia de esta casa?
        </button>
      )}

      {isFamilyPickerShown && (
        <form.Field name="familyChoice">
          {(field) => (
            <div className="space-y-2 sm:max-w-[calc(50%-0.5rem)]">
              <Label htmlFor={field.name}>Familia</Label>
              <Select
                inputId={field.name}
                options={familyOptions}
                placeholder="Elige la familia"
                isSearchable={false}
                isInvalid={field.state.meta.errors.length > 0}
                value={
                  familyOptions.find(
                    (option) => option.value === (field.state.value || (families.length === 1 ? families[0]?.id : "")),
                  ) ?? null
                }
                onBlur={field.handleBlur}
                onChange={(option) => {
                  const next = option?.value ?? "";
                  /* Una familia nueva empieza con su jefe(a); al volver a una existente, la estrella se apaga. */
                  if (next === NEW_FAMILY) {
                    form.setFieldValue("isHead", true);
                  } else if (field.state.value === NEW_FAMILY) {
                    form.setFieldValue("isHead", false);
                  }
                  field.handleChange(next);
                }}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      )}
    </>
  );
}

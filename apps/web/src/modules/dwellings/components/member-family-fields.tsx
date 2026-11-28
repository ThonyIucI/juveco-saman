import { Label } from "@juveco/ui/components/label";
import { Switch } from "@juveco/ui/components/switch";
import { MEMBER_RELATIONSHIPS, familyRelationshipLabels } from "@juveco/shared/families";

import FieldError from "@/common/components/field-error";
import Select, { type IOption } from "@/common/components/select";
import type { TPersonFormApi } from "@/modules/users/components/person-fields";

export const RELATIONSHIP_OPTIONS: IOption[] = MEMBER_RELATIONSHIPS.map((relationship) => ({
  value: relationship,
  label: familyRelationshipLabels[relationship],
}));

interface IMemberFamilyFieldsProps {
  form: TPersonFormApi;
  /** La estrella no se puede apagar: lo explica `headHint`. */
  isHeadLocked: boolean;
  headHint: string | null;
}

/** Lo que pone a la persona en su familia, al editarla: la estrella de jefe(a) y el parentesco con el jefe. */
export default function MemberFamilyFields({ form, isHeadLocked, headHint }: IMemberFamilyFieldsProps) {
  return (
    <>
      {/* Una celda de la grilla, del alto de los campos: va al lado del celular. */}
      <form.Field name="isHead">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Jefe(a) de hogar</Label>
            <div className="flex h-control items-center gap-3">
              <Switch
                id={field.name}
                checked={field.state.value}
                disabled={isHeadLocked}
                onCheckedChange={field.handleChange}
              />
              <span className="text-sm text-muted-foreground">
                {headHint ?? (field.state.value ? "Sí, responde por la familia" : "No")}
              </span>
            </div>
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.isHead as boolean}>
        {(isHead) =>
          !isHead && (
            <form.Field name="relationship">
              {(field) => (
                <div className="space-y-2">
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
    </>
  );
}

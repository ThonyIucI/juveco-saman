import { Label } from "@juveco/ui/components/label";
import { Switch } from "@juveco/ui/components/switch";
import { MEMBER_RELATIONSHIPS, familyRelationshipLabels } from "@juveco/shared/families";
import { Star } from "lucide-react";

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
    </>
  );
}

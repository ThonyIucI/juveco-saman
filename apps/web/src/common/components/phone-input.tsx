import {
  type IPhone,
  PHONE_MAX_DIGITS,
  countryOfPhone,
  formatNationalPhone,
  onlyDigits,
  parseFullPhone,
  prefixOfCountry,
} from "@juveco/shared/phones";
import { cn } from "@juveco/ui/lib/utils";
import type { CountryCode } from "libphonenumber-js";
import { ChevronDown } from "lucide-react";
import { type ChangeEvent, type ClipboardEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactSelect, { components, type DropdownIndicatorProps } from "react-select";

import { COUNTRY_OPTIONS, type ICountryOption, matchesCountry } from "@/common/utils/countries";

import CountryFlag from "./country-flag";

/* Por encima de la modal (z-50) y de la confirmación (z-60), como `Select`. */
const MENU_Z_INDEX = 70;
const MENU_WIDTH = "20rem";

interface IPhoneInputProps {
  id?: string;
  value: IPhone;
  onChange: (phone: IPhone) => void;
  onBlur?: () => void;
  isInvalid?: boolean;
  disabled?: boolean;
}

const PHONE_PLACEHOLDER = "Ingresa el número";

/** Posición en el texto formateado justo después de `digitCount` dígitos («987 6|54» → 5). */
const caretAfterDigits = (formattedText: string, digitCount: number): number => {
  if (digitCount <= 0) {
    return 0;
  }
  let seen = 0;
  for (let index = 0; index < formattedText.length; index += 1) {
    if (/\d/.test(formattedText.charAt(index))) {
      seen += 1;
      if (seen === digitCount) {
        return index + 1;
      }
    }
  }
  return formattedText.length;
};

function Chevron(props: DropdownIndicatorProps<ICountryOption, false>) {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown
        className={cn(
          "size-4 transition-transform duration-200",
          props.selectProps.menuIsOpen && "rotate-180",
        )}
      />
    </components.DropdownIndicator>
  );
}

/**
 * Teléfono con país, como el `PhoneInput` de id-pos: bandera y prefijo a la izquierda (con
 * buscador de países), y el número a la derecha, con el formato del país mientras se
 * escribe. Guarda el prefijo («51») y el número en dígitos («987654321») por separado.
 *
 * El país va con react-select, como el resto de listas que crecen: búsqueda, teclado y
 * lector de pantalla resueltos.
 */
export default function PhoneInput({ id, value, onChange, onBlur, isInvalid, disabled }: IPhoneInputProps) {
  /*
    El país se guarda acá y no se deduce siempre del prefijo: +1 son EE. UU., Canadá y
    otros, y la bandera tiene que ser la que se eligió.
  */
  const [country, setCountry] = useState<CountryCode>(() =>
    countryOfPhone(value.countryPrefix, value.number),
  );

  /* Si el valor cambia desde afuera (abrir otro proveedor), se vuelve a deducir el país. */
  useEffect(() => {
    if (prefixOfCountry(country) !== value.countryPrefix) {
      setCountry(countryOfPhone(value.countryPrefix, value.number));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.countryPrefix]);

  const selected = COUNTRY_OPTIONS.find((option) => option.value === country) ?? null;
  const maxDigits = PHONE_MAX_DIGITS - value.countryPrefix.length;

  const formatted = formatNationalPhone(value.number, country);
  const inputRef = useRef<HTMLInputElement | null>(null);
  /* Dígitos que van antes del cursor tras la última tecla; `null` si no hay que moverlo. */
  const pendingCaretRef = useRef<number | null>(null);

  /*
    El campo se reescribe con el formato en cada tecla y el navegador manda el cursor al
    final. Se guarda cuántos dígitos quedan antes del cursor y, ya formateado, se vuelve a
    poner ahí (sin esto, borrar en medio del número saltaba al final).
  */
  useLayoutEffect(() => {
    const input = inputRef.current;
    const digitsBeforeCaret = pendingCaretRef.current;
    if (!input || digitsBeforeCaret === null) {
      return;
    }
    pendingCaretRef.current = null;
    const position = caretAfterDigits(input.value, digitsBeforeCaret);
    input.setSelectionRange(position, position);
  });

  const handleNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const typed = event.target.value;
    const caret = event.target.selectionStart ?? typed.length;
    let digits = onlyDigits(typed);
    let digitsBeforeCaret = onlyDigits(typed.slice(0, caret)).length;

    /*
      Borrar un carácter del formato (el espacio de «987 654») no cambia los dígitos y el
      campo volvería a ponerlo: se queda trabado. Se borra la cifra pegada a lo que se borró
      (la de antes con Retroceso, la de después con Suprimir), no la última.
    */
    if (digits === value.number && typed.length < formatted.length) {
      const isForwardDelete = (event.nativeEvent as InputEvent).inputType === "deleteContentForward";
      const removeAt = isForwardDelete ? digitsBeforeCaret : digitsBeforeCaret - 1;
      if (removeAt >= 0) {
        digits = digits.slice(0, removeAt) + digits.slice(removeAt + 1);
        digitsBeforeCaret = removeAt;
      }
    }

    pendingCaretRef.current = Math.min(digitsBeforeCaret, maxDigits);
    onChange({ countryPrefix: value.countryPrefix, number: digits.slice(0, maxDigits) });
  };

  /* Un número completo pegado («+51 944 745 676») cambia el país y deja solo el número. */
  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    const parsed = parseFullPhone(pasted, country);
    if (!parsed) {
      return;
    }
    event.preventDefault();
    setCountry(parsed.country);
    onChange({ countryPrefix: parsed.countryPrefix, number: parsed.number });
  };

  const handleCountryChange = (option: ICountryOption | null) => {
    if (!option) {
      return;
    }
    setCountry(option.value);
    onChange({ countryPrefix: option.prefix, number: value.number });
  };

  return (
    <div
      className={cn(
        "flex h-control w-full items-stretch rounded-lg border bg-field transition-colors",
        disabled && "cursor-not-allowed opacity-60",
        isInvalid
          ? "border-destructive ring-4 ring-destructive/20"
          : "border-border focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/30",
      )}
    >
      <ReactSelect<ICountryOption, false>
        unstyled
        aria-label="País del número"
        options={COUNTRY_OPTIONS}
        value={selected}
        onChange={handleCountryChange}
        isDisabled={disabled}
        filterOption={(option, search) => matchesCountry(option.data, search)}
        menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
        menuPlacement="auto"
        noOptionsMessage={() => "No encontramos ese país"}
        placeholder=""
        components={{ DropdownIndicator: Chevron, IndicatorSeparator: null }}
        formatOptionLabel={(option, { context }) =>
          context === "menu" ? (
            <span className="flex items-center gap-2.5">
              <CountryFlag country={option.value} />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              <span className="font-semibold text-muted-foreground">+{option.prefix}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CountryFlag country={option.value} />
              <span className="font-semibold">+{option.prefix}</span>
            </span>
          )
        }
        /* Aun con `unstyled`, emotion pone sus medidas: las que tienen que ganar van acá. */
        styles={{
          control: (base) => ({ ...base, minHeight: "100%" }),
          menu: (base) => ({ ...base, width: MENU_WIDTH }),
          menuPortal: (base) => ({ ...base, zIndex: MENU_Z_INDEX }),
        }}
        classNames={{
          container: () => "shrink-0",
          control: () => "h-full cursor-pointer rounded-l-[0.4375rem] pr-1 pl-3 text-sm hover:bg-muted/60",
          valueContainer: () => "gap-1",
          singleValue: () => "text-foreground",
          input: () => "w-14 text-foreground",
          dropdownIndicator: ({ isFocused }) =>
            cn("px-1 transition-colors", isFocused ? "text-primary" : "text-muted-foreground"),
          menu: () => "mt-2 overflow-hidden rounded-2xl bg-popover p-1.5 shadow-elevated",
          menuList: () => "max-h-64",
          option: ({ isFocused, isSelected }) =>
            cn(
              "cursor-pointer rounded-lg px-3 py-2.5 text-sm",
              isSelected
                ? "bg-primary/10 font-semibold text-primary"
                : isFocused
                  ? "bg-muted text-foreground"
                  : "text-foreground",
            ),
          noOptionsMessage: () => "px-3 py-3 text-sm text-muted-foreground",
        }}
      />

      <span aria-hidden className="my-3 w-px shrink-0 bg-border" />

      <input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        aria-invalid={isInvalid}
        placeholder={PHONE_PLACEHOLDER}
        value={formatted}
        onBlur={onBlur}
        onPaste={handlePaste}
        onChange={handleNumberChange}
        className="min-w-0 flex-1 rounded-r-[0.4375rem] bg-transparent px-3 text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}

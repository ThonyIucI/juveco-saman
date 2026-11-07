import { type IPhone, countryOfPhone, formatNationalPhone, toFullPhone } from "@juveco/shared/phones";

import CopyButton from "@/common/components/copy-button";
import CountryFlag from "@/common/components/country-flag";
import LongPressCopy from "@/common/components/long-press-copy";

interface IPhoneValueProps {
  phone: IPhone | null;
}

/**
 * Un número como valor: bandera y número sin prefijo (la bandera ya dice el país). Se copia
 * completo, con prefijo: en el celular manteniéndolo presionado y en escritorio con el
 * copiar a su izquierda, como en el detalle de la cuenta. Sin número, «—».
 */
export default function PhoneValue({ phone }: IPhoneValueProps) {
  if (!phone) {
    return <span className="text-muted-foreground">—</span>;
  }

  const country = countryOfPhone(phone.countryPrefix, phone.number);
  const fullPhone = toFullPhone(phone.countryPrefix, phone.number);

  return (
    <span className="flex min-w-0 items-center gap-2">
      <CopyButton
        label={`Copiar el número ${fullPhone}`}
        getText={() => fullPhone}
        className="-ml-1.5 hidden md:inline-flex"
      />
      <CountryFlag country={country} />
      <LongPressCopy
        getText={() => fullPhone}
        successMessage="Número copiado"
        className="truncate font-semibold text-foreground tabular-nums"
      >
        {formatNationalPhone(phone.number, country)}
      </LongPressCopy>
    </span>
  );
}

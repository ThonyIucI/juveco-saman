import type { IUserResource } from "@juveco/shared/users";
import { formatWhatsAppUsername } from "@juveco/shared/whatsapp";

import CopyButton from "@/common/components/copy-button";
import LongPressCopy from "@/common/components/long-press-copy";
import PhoneValue from "@/common/components/phone-value";

interface IUserWhatsAppValueProps {
  user: IUserResource;
}

/**
 * El WhatsApp del usuario en la card y la tabla: el número con `PhoneValue`; si no tiene
 * número, «@usuario», que se copia igual (RF-04). Sin ninguno, «—».
 */
export default function UserWhatsAppValue({ user }: IUserWhatsAppValueProps) {
  const { phone, whatsappUsername } = user;
  if (phone || !whatsappUsername) {
    return <PhoneValue phone={phone} />;
  }

  const username = formatWhatsAppUsername(whatsappUsername);

  return (
    <span className="flex min-w-0 items-center gap-2">
      <CopyButton
        label={`Copiar el usuario ${username}`}
        getText={() => username}
        className="-ml-1.5 hidden md:inline-flex"
      />
      <LongPressCopy
        getText={() => username}
        successMessage="Usuario copiado"
        className="truncate font-semibold text-foreground"
      >
        {username}
      </LongPressCopy>
    </span>
  );
}

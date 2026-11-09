import { type IPhone, toFullPhone, whatsAppUrl } from "@juveco/shared/phones";
import { formatWhatsAppUsername, whatsAppUsernameUrl } from "@juveco/shared/whatsapp";
import { iconButtonVariants } from "@juveco/ui/components/icon-button";

import WhatsAppIcon from "@/common/components/icons/whatsapp-icon";

interface IWhatsAppButtonProps {
  phone: IPhone | null;
  /** Usuario de WhatsApp sin «@». Se usa solo si no hay número (acordado 2026-10-30). */
  username?: string | null;
  isBordered?: boolean;
}

/** El chat por el número; si no hay, por el usuario. Sin ninguno, `null`. */
export const whatsAppChatTarget = (phone: IPhone | null, username?: string | null) => {
  if (phone) {
    return {
      href: whatsAppUrl(phone.countryPrefix, phone.number),
      label: toFullPhone(phone.countryPrefix, phone.number),
    };
  }
  if (username) {
    return { href: whatsAppUsernameUrl(username), label: formatWhatsAppUsername(username) };
  }
  return null;
};

/**
 * Abre el chat de WhatsApp, en el lugar donde cuentas tiene «enviar»: verde, al lado del
 * `⋯` (acordado 2026-10-30). Es lo único que abre el chat; tocar el número no. Con número,
 * `wa.me/<prefijo><número>`; sin número, `wa.me/<usuario>`. Sin ninguno, no se muestra.
 */
export default function WhatsAppButton({ phone, username, isBordered = false }: IWhatsAppButtonProps) {
  const target = whatsAppChatTarget(phone, username);
  if (!target) {
    return null;
  }

  return (
    <a
      href={target.href}
      target="_blank"
      rel="noreferrer"
      title="Escribir por WhatsApp"
      aria-label={`Escribir por WhatsApp a ${target.label}`}
      className={iconButtonVariants({ tone: "success", isBordered, isFilled: !isBordered })}
      /* No abre la fila o la card que lo contiene. */
      onClick={(event) => event.stopPropagation()}
    >
      <WhatsAppIcon className="size-5" />
    </a>
  );
}

import { cn } from "@juveco/ui/lib/utils";
import { ImageOff } from "lucide-react";
import { useState } from "react";

interface ISiteImageProps {
  src: string;
  alt: string;
  className?: string;
  /** La primera foto de la página carga de una; el resto, cuando se acerca. */
  isPriority?: boolean;
  /** Sin foto, el ícono de «sin imagen»; de fondo (el carrusel) va solo el azul. */
  hasIconFallback?: boolean;
}

/**
 * Una foto de la portada. Si todavía no está en `public/portada/`, muestra el azul de la
 * cinta con un ícono en vez de una imagen rota.
 */
export default function SiteImage({
  src,
  alt,
  className,
  isPriority = false,
  hasIconFallback = true,
}: ISiteImageProps) {
  const [hasFailed, setHasFailed] = useState(false);

  if (hasFailed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("flex items-center justify-center bg-linear-to-br from-primary to-[#14214A]", className)}
      >
        {hasIconFallback && <ImageOff aria-hidden className="size-10 text-primary-foreground/40" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={isPriority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setHasFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}

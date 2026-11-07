import { cn } from "@juveco/ui/lib/utils";

const MAX_INITIALS = 2;

/** «Yeremi Vil» → «YV»; «Alain» → «A». Las primeras letras de las dos primeras palabras. */
export const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, MAX_INITIALS)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

const COLOR_CLASSES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  orange: "bg-orange/10 text-orange",
  yellow: "bg-yellow/10 text-yellow",
  destructive: "bg-destructive/10 text-destructive",
} as const;

export type TInitialsAvatarColor = keyof typeof COLOR_CLASSES;

const AVATAR_COLORS = Object.keys(COLOR_CLASSES) as TInitialsAvatarColor[];

/**
 * Un color que sale del nombre, siempre el mismo para el mismo nombre (acordado
 * 2026-10-30): las personas se distinguen de un vistazo.
 */
export const avatarColorOf = (name: string): TInitialsAvatarColor => {
  const key = name.trim().toLowerCase();
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
};

interface IInitialsAvatarProps {
  name: string;
  color?: TInitialsAvatarColor;
  className?: string;
}

/**
 * Avatar de una persona con sus iniciales. Los proveedores van en el color primario
 * (acordado 2026-10-30); las personas, con `color={avatarColorOf(name)}`.
 */
export default function InitialsAvatar({ name, color = "primary", className }: IInitialsAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full font-heading font-bold",
        COLOR_CLASSES[color],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

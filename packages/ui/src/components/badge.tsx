import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@juveco/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/*
  Badge `color × variant`, copiado del saas (`front/src/components/ui/badge.tsx`, 2026-10-30):
  - `color`: el color, **nunca una funcionalidad** (`orange`, no `today`). Qué significa
    cada color lo decide el módulo que lo usa (p. ej. `modules/accounts/utils/expiry.ts`).
  - `variant`: cómo se aplica (`solid`, `soft`, `outline`, `ghost`).
  Cambios frente al saas: sin `water` ni `aurora` (Yiya no los tiene), con `orange` y
  `yellow`, y sin el tamaño `sm` (10 px, debajo del mínimo de 12 px de Yiya).
*/
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent font-semibold leading-none whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
  {
    variants: {
      size: {
        md: "h-5 px-2 py-0.5 text-xs [&>svg]:size-3!",
        lg: "h-6 px-2.5 py-1 text-sm [&>svg]:size-3.5!",
      },
      /*
        `--btn`: el color lleno · `--btn-fg`: el texto sobre el lleno · `--btn-on`: el texto
        sobre fondo claro (soft, outline, ghost) · `--btn-soft-bg`: el fondo del soft si no
        es el color al 15 %.
      */
      color: {
        primary: "[--btn:var(--primary)] [--btn-fg:var(--primary-foreground)] [--btn-on:var(--primary)]",
        neutral:
          "[--btn:var(--muted-foreground)] [--btn-fg:var(--card)] [--btn-on:var(--muted-foreground)] [--btn-soft-bg:var(--muted)]",
        success: "[--btn:var(--success)] [--btn-fg:var(--success-foreground)] [--btn-on:var(--success)]",
        /* `--destructive` no llega a 4.5:1 como texto: sobre fondo claro va el rojo oscuro. */
        destructive:
          "[--btn:var(--destructive)] [--btn-fg:var(--destructive-foreground)] [--btn-on:var(--destructive-on-muted)]",
        orange: "[--btn:var(--orange)] [--btn-fg:var(--orange-foreground)] [--btn-on:var(--orange)]",
        yellow: "[--btn:var(--yellow)] [--btn-fg:var(--yellow-foreground)] [--btn-on:var(--yellow)]",
      },
      variant: {
        solid: "bg-(--btn) text-(--btn-fg)",
        soft: "bg-[var(--btn-soft-bg,color-mix(in_srgb,var(--btn)_15%,transparent))] text-(--btn-on)",
        outline: "border-(--btn-on) text-(--btn-on)",
        ghost: "text-(--btn-on)",
      },
    },
    defaultVariants: {
      size: "md",
      color: "neutral",
      variant: "soft",
    },
  },
);

type TBadgeColor = NonNullable<VariantProps<typeof badgeVariants>["color"]>;
type TBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
type TBadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>;

interface IBadgeProps extends useRender.ComponentProps<"span"> {
  color?: TBadgeColor;
  variant?: TBadgeVariant;
  size?: TBadgeSize;
}

/** Píldora de estado con texto (el color nunca es el único indicador). 12 px por defecto. */
function Badge({ className, variant, color, size, render, ...props }: IBadgeProps) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ color, variant, size }), className) },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant: variant ?? "soft",
      color: color ?? "neutral",
      size: size ?? "md",
    },
  });
}

export { Badge, badgeVariants };
export type { TBadgeColor, TBadgeVariant, TBadgeSize };

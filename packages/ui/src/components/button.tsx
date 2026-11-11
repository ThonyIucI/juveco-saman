import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@juveco/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/*
  Escala (heredada de electrolitos): targets táctiles ≥ 44 px (primarios 56 px con size="xl"), radios
  generosos y "sombra sticker" que se hunde al presionar. Colores solo por token.
*/
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg leading-none border border-transparent bg-clip-padding font-heading text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]",
        gold:
          "bg-gold text-gold-foreground hover:brightness-105 active:scale-[0.98]",
        outline:
          "border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:brightness-105 active:scale-[0.98]",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110 active:scale-[0.98]",
        link: "font-sans text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-control gap-2 px-4",
        xs: "h-8 gap-1 rounded-lg px-2.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        sm: "h-9 gap-1.5 rounded-lg px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-control-lg gap-2 px-5 text-base",
        xl: "h-14 w-full gap-2 px-6 text-xl",
        /* Los `icon*` quedan para los componentes internos de `ui`. En la app, IconButton. */
        icon: "size-control",
        "icon-xs": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-9 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-control-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

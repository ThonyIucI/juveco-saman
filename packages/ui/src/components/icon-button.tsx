import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@juveco/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/*
  Botón de solo ícono (acordado 2026-10-22): todo botón de ícono sale de acá, nunca de
  `Button` + clases sueltas. Se elige por tres ejes:
  - `tone`: el color (`neutral`, `muted`, `primary`, `success`, `destructive`).
  - `size`: `xs` 32 px · `sm` 36 px · `md` 44 px · `lg` 52 px (el alto de los campos).
  - `isBordered`: borde fino y fondo de card (p. ej. las acciones de la tabla).
  - `isFilled`: fondo suave del color del tono (p. ej. «enviar» en verde).
*/
const iconButtonCva = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center disabled:cursor-not-allowed justify-center border border-transparent bg-clip-padding transition-all outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent",
        muted: "text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent",
        primary: "text-primary hover:bg-primary/10",
        success: "text-success hover:bg-success/15",
        /* Neutro en reposo y rojo al pasar: eliminar no grita desde la fila. */
        destructive: "text-foreground hover:bg-destructive/10 hover:text-destructive",
      },
      size: {
        /* Redondeo suave (8 px; 12 px en los grandes): con más, el botón se ve casi circular. */
        xs: "size-8 rounded-md [&_svg:not([class*='size-'])]:size-4",
        sm: "size-9 rounded-md [&_svg:not([class*='size-'])]:size-4",
        md: "size-11 rounded-lg [&_svg:not([class*='size-'])]:size-5",
        lg: "size-13 rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
      isBordered: {
        true: "border-border bg-card",
        false: "",
      },
      isFilled: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      { isFilled: true, tone: "neutral", className: "bg-muted" },
      { isFilled: true, tone: "muted", className: "bg-muted" },
      { isFilled: true, tone: "primary", className: "bg-primary/10 hover:bg-primary/20" },
      { isFilled: true, tone: "success", className: "bg-success/15 hover:bg-success/25" },
      { isFilled: true, tone: "destructive", className: "bg-destructive/10 text-destructive" },
    ],
    defaultVariants: {
      tone: "neutral",
      size: "sm",
      isBordered: false,
      isFilled: false,
    },
  },
);

type TIconButtonVariants = VariantProps<typeof iconButtonCva>;

/*
  Siempre pasa por `cn`: la base trae `border-transparent` y `isBordered` agrega
  `border-border`. Sin el merge quedan las dos y gana la que Tailwind escriba después.
*/
const iconButtonVariants = (variants: TIconButtonVariants = {}) => cn(iconButtonCva(variants));

interface IIconButtonProps extends Omit<ButtonPrimitive.Props, "className">, TIconButtonVariants {
  /** Lo que hace, para el lector de pantalla y el tooltip («Copiar correo»). Obligatorio: no hay texto. */
  label: string;
  className?: string;
}

function IconButton({
  label,
  tone,
  size,
  isBordered,
  isFilled,
  className,
  type = "button",
  ...props
}: IIconButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="icon-button"
      type={type}
      title={label}
      aria-label={label}
      className={cn(iconButtonVariants({ tone, size, isBordered, isFilled }), className)}
      {...props}
    />
  );
}

export { IconButton, iconButtonVariants, type TIconButtonVariants };

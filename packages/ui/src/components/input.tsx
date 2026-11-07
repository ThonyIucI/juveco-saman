import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@juveco/ui/lib/utils";
import * as React from "react";

/* 52 px de alto y texto de 18 px: cómodo con el pulgar y sin zoom automático en iOS. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-13 w-full min-w-0 rounded-xl border-2 border-input bg-field px-4 py-2 text-base md:text-sm font-medium transition-colors outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

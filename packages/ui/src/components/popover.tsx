"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@juveco/ui/lib/utils";

function Popover(props: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * La caja flotante, con la misma superficie y animación que el menú desplegable. `z-[60]`:
 * también se abre desde una modal (z-50) y tiene que quedar encima.
 */
function PopoverContent({
  className,
  align = "start",
  side = "bottom",
  sideOffset = 8,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "side" | "sideOffset">) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        className="isolate z-[60] outline-none"
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={16}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "max-h-(--available-height) origin-(--transform-origin) overflow-y-auto rounded-3xl bg-popover p-4 text-popover-foreground shadow-elevated ring-1 ring-foreground/5 outline-none",
            "duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };

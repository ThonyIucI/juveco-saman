import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@juveco/ui/components/dropdown-menu";
import { cn } from "@juveco/ui/lib/utils";
import { ChevronDown } from "lucide-react";

interface IPageSizeSelectProps {
  value: number;
  options: number[];
  onChange: (size: number) => void;
  className?: string;
}

/** Copia del `PageSizeSelect` del saas: filas por página, al pie del listado. */
export default function PageSizeSelect({ value, options, onChange, className }: IPageSizeSelectProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">Por pág.</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-card px-2.5 text-sm font-semibold text-foreground shadow-card transition-colors hover:bg-muted">
          {value}
          <ChevronDown className="size-4 text-muted-foreground" strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-14 bg-card">
          {options.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => onChange(option)}
              className={cn("cursor-pointer", option === value && "font-semibold text-primary")}
            >
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

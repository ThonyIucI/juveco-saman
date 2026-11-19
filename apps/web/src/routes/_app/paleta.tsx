import { Badge } from "@juveco/ui/components/badge";
import { Button } from "@juveco/ui/components/button";
import { Input } from "@juveco/ui/components/input";
import { Label } from "@juveco/ui/components/label";
import { IconButton } from "@juveco/ui/components/icon-button";
import { NEIGHBORHOODS, NEIGHBORHOOD_IDS } from "@juveco/shared/neighborhoods";
import { EUserRole } from "@juveco/shared/roles";
import { cn } from "@juveco/ui/lib/utils";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Banknote,
  BarChart3,
  CircleCheck,
  CircleX,
  Clock,
  EllipsisVertical,
  HandCoins,
  MapPin,
  Plus,
  Search,
  Smartphone,
  TrendingDown,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import ButtonGroup from "@/common/components/button-group";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import PageBox from "@/common/components/page-box";
import PageContainer from "@/common/components/page-container";
import PageHeader from "@/common/components/page-header";
import Select from "@/common/components/select";
import SolesInput from "@/common/components/soles-input";

/**
 * Documentación de la paleta oscura (decidida por Thony el 2026-11-19). Solo para el
 * superadmin: cualquier otro rol vuelve al panel. No va en el menú; se entra por `/paleta`.
 *
 * Por qué se eligió: con la paleta anterior las cajas eran más oscuras que el fondo y no se
 * veía dónde empezaba o terminaba cada card. Se probaron tres alternativas y quedó la de
 * Stitch por capas (fondo casi negro, cajas más claras con borde fino, botones de ícono más
 * claros que donde van), con los badges en sus colores de siempre. Los colores suaves de los
 * badges se descartaron.
 *
 * Cada tab pinta **toda la app** (menú, encabezado y fondo) pisando los tokens en `<html>`,
 * solo en modo oscuro: en claro todo se ve como siempre. Al salir de la página se restaura.
 * La estructura es la real: tabla en escritorio y cards en celular.
 *
 * El tab «Campos» (decidido el 2026-11-19) compara el fondo, el borde y el texto de ayuda de los
 * campos en oscuro: el formulario de pago con los campos elegidos al lado de los de antes.
 */
export const Route = createFileRoute("/_app/paleta")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== EUserRole.SUPERADMIN) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: PalettePreviewPage,
});

type TTokens = Record<string, string>;

/* La paleta oscura anterior (hasta 2026-11-19), tal como estaba en `globals.css`. */
const PREVIOUS_TOKENS: TTokens = {
  "--page": "#172133",
  "--background": "#0b1120",
  "--sidebar": "#0b1120",
  "--card": "#111726",
  "--popover": "#111726",
  "--muted": "#172133",
  "--secondary": "#1a2234",
  "--accent": "#1a253a",
  "--field": "#172133",
  /* Los campos usaban el borde general y el texto de ayuda de antes. */
  "--field-border": "#232f48",
  "--placeholder": "#64748b",
  "--border": "#232f48",
  "--input": "#27354d",
  /* El botón de ícono con borde era del color de la card. */
  "--raised": "#111726",
  "--raised-border": "#232f48",
  "--raised-hover": "#1a253a",
};

/* Los colores de estado con la mitad de saturación (descartados). */
const SOFT_STATUS_TOKENS: TTokens = {
  "--success": "oklch(0.78 0.08 150)",
  "--destructive": "oklch(0.76 0.07 20)",
  "--destructive-on-muted": "oklch(0.78 0.07 20)",
  "--yellow": "oklch(0.85 0.08 95)",
  "--orange": "oklch(0.78 0.07 60)",
};

/* Los barrios en oscuro con el texto apagado y el fondo más tenue (descartados); en claro, los de siempre. */
const SOFT_NEIGHBORHOOD_CLASS: Record<string, string> = {
  [NEIGHBORHOOD_IDS.NUEVA_ESPERANZA]: "bg-[#D5F4E2] text-[#1B7943] dark:bg-[#1B7943]/20 dark:text-[#a3cbb3]",
  [NEIGHBORHOOD_IDS.EL_PATIO]: "bg-[#F8DDD2] text-[#8A3A1C] dark:bg-[#8A3A1C]/25 dark:text-[#d6b3a5]",
  [NEIGHBORHOOD_IDS.RAMON_CASTILLA]: "bg-[#FFEBCC] text-[#663E00] dark:bg-[#8A5A00]/25 dark:text-[#d6c39e]",
  [NEIGHBORHOOD_IDS.MARIA_AUXILIADORA]: "bg-[#DCEFFB] text-[#1D5E85] dark:bg-[#1D5E85]/25 dark:text-[#a8c3d6]",
  [NEIGHBORHOOD_IDS.SANTA_ROSA]: "bg-[#FFE6EF] text-[#994E69] dark:bg-[#994E69]/25 dark:text-[#d4b0be]",
};

type TVariantId = "chosen" | "chosenSoft" | "previous" | "previousSoft" | "fields";

interface IVariant {
  id: TVariantId;
  label: string;
  description: string;
  isSoft: boolean;
  tokens: TTokens;
  /** La paleta anterior no tenía borde en las cajas. */
  hasBoxBorder: boolean;
}

const VARIANTS: IVariant[] = [
  {
    id: "chosen",
    label: "Elegida",
    description:
      "La de la app hoy: fondo casi negro, cajas más claras con borde fino, botones de ícono más claros que donde van y badges en sus colores de siempre.",
    isSoft: false,
    tokens: {},
    hasBoxBorder: true,
  },
  {
    id: "chosenSoft",
    label: "Elegida con colores suaves",
    description: "Descartada: la misma, con los badges de estado y de barrio a la mitad de saturación.",
    isSoft: true,
    tokens: SOFT_STATUS_TOKENS,
    hasBoxBorder: true,
  },
  {
    id: "previous",
    label: "Anterior",
    description: "Hasta el 2026-11-19: las cajas más oscuras que el fondo y sin borde; no se veía dónde terminaba cada card.",
    isSoft: false,
    tokens: PREVIOUS_TOKENS,
    hasBoxBorder: false,
  },
  {
    id: "previousSoft",
    label: "Anterior con colores suaves",
    description: "Descartada: la anterior, con los badges a la mitad de saturación.",
    isSoft: true,
    tokens: { ...PREVIOUS_TOKENS, ...SOFT_STATUS_TOKENS },
    hasBoxBorder: false,
  },
  {
    id: "fields",
    label: "Campos",
    description:
      "Decidido el 2026-11-19, como en Telegram: en oscuro, el campo con el mismo fondo que la modal, un borde claro que lo marca y el texto de ayuda más legible. Antes iban hundidos, más oscuros que la modal, y se veían toscos. En claro no cambió nada.",
    isSoft: false,
    tokens: {},
    hasBoxBorder: true,
  },
];

/*
  Los campos de antes (hasta 2026-11-19), solo en oscuro y solo dentro de donde va esta clase:
  los tokens son variables CSS y `@theme inline` las lee donde se usan.
*/
const FIELD_PREVIOUS_CLASS = "dark:[--field:#0f1522] dark:[--field-border:#222c3f] dark:[--placeholder:#64748b]";

const COLLECTOR_OPTIONS = [
  { value: "thony", label: "Thony DEV" },
  { value: "francisca", label: "Francisca Sandoval Gonzales" },
];

const ROWS = [
  { serial: "0001", buyer: "Hilda Farías Farías", hood: NEIGHBORHOOD_IDS.NUEVA_ESPERANZA, status: "UNPAID" },
  { serial: "0002", buyer: "Gilberto Yacila Farías", hood: NEIGHBORHOOD_IDS.EL_PATIO, status: "PARTIAL" },
  { serial: "0003", buyer: "Sabina Abalo Mena", hood: NEIGHBORHOOD_IDS.MARIA_AUXILIADORA, status: "PAID" },
  { serial: "0004", buyer: "Isabel Castro Ipanaqué", hood: NEIGHBORHOOD_IDS.RAMON_CASTILLA, status: "UNPAID" },
  { serial: "0005", buyer: "Adán Romero Mejía", hood: NEIGHBORHOOD_IDS.SANTA_ROSA, status: "PAID" },
] as const;

const SELLER = "Francisca Sandoval Gonzales";

const STATUS_BADGE = {
  PAID: { color: "success", icon: CircleCheck, text: "S/ 0.00" },
  PARTIAL: { color: "yellow", icon: Clock, text: "S/ 5.00" },
  UNPAID: { color: "destructive", icon: CircleX, text: "S/ 10.00" },
} as const;

/**
 * Pinta toda la app con la paleta del tab, pisando los tokens en `<html>`, solo mientras el
 * tema es oscuro: si se cambia a claro (o vuelve a oscuro) con el botón del encabezado, se
 * quitan (o se ponen) al instante. Al cambiar de tab o salir de la página, deja todo como estaba.
 */
const useAppliedPalette = (tokens: TTokens) => {
  useEffect(() => {
    const root = document.documentElement;
    const entries = Object.entries(tokens);

    const clear = () => {
      for (const [name] of entries) {
        root.style.removeProperty(name);
      }
    };
    const sync = () => {
      if (!root.classList.contains("dark")) {
        clear();
        return;
      }
      for (const [name, value] of entries) {
        root.style.setProperty(name, value);
      }
    };

    sync();
    /* El tema lo cambia `next-themes` tocando la clase de `<html>`. */
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      clear();
    };
  }, [tokens]);
};

function HoodBadge({ id, isSoft }: { id: string; isSoft: boolean }) {
  const neighborhood = NEIGHBORHOODS.find((item) => item.id === id) ?? null;
  if (!isSoft || !neighborhood) {
    return <NeighborhoodBadge neighborhood={neighborhood} />;
  }
  return (
    <Badge className={SOFT_NEIGHBORHOOD_CLASS[id]}>
      <MapPin aria-hidden />
      {neighborhood.name}
    </Badge>
  );
}

function StatusBadge({ status, label }: { status: keyof typeof STATUS_BADGE; label?: string }) {
  const { color, icon: Icon, text } = STATUS_BADGE[status];
  return (
    <Badge color={color} className="rounded-md tabular-nums">
      <Icon aria-hidden />
      {label && `${label} `}
      {text}
    </Badge>
  );
}

type TMethod = "YAPE" | "CASH";

const METHOD_OPTIONS = [
  { value: "YAPE" as const, label: "Yape", icon: Smartphone },
  { value: "CASH" as const, label: "Efectivo", icon: Banknote },
];

interface IPaymentFormMockProps {
  title: string;
  /** Pisa los tokens de los campos; sin clase, los de la app. */
  fieldsClassName?: string;
}

/** El formulario de pago real (mismos componentes), dentro de un panel como el de la modal. */
function PaymentFormMock({ title, fieldsClassName }: IPaymentFormMockProps) {
  const [amount, setAmount] = useState("10.00");
  const [method, setMethod] = useState<TMethod>("YAPE");
  const [collector, setCollector] = useState("thony");
  const [note, setNote] = useState("");
  const idPrefix = fieldsClassName ? "previous" : "current";

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-3xl bg-card shadow-sheet dark:border dark:border-border">
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <p className="font-heading text-xl font-bold text-foreground">Registrar pago</p>
            <p className="truncate text-sm text-muted-foreground">N.º 0001 · Hilda Farías Farías</p>
          </div>
          <IconButton label="Cerrar" tone="muted">
            <X />
          </IconButton>
        </div>
        <div className={cn("space-y-4 px-5 pb-5", fieldsClassName)}>
          <p className="text-sm text-muted-foreground">
            Por cobrar: <span className="font-semibold text-foreground tabular-nums">S/ 10.00</span>
          </p>
          <div className="grid grid-cols-2 items-start gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-amount`}>Monto</Label>
              <SolesInput id={`${idPrefix}-amount`} placeholder="Ingresa el monto" value={amount} onChange={setAmount} />
            </div>
            <div className="space-y-2">
              <Label id={`${idPrefix}-method`}>Cómo pagó</Label>
              <ButtonGroup labelledBy={`${idPrefix}-method`} options={METHOD_OPTIONS} value={method} onChange={setMethod} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-collector`}>Cobrado por</Label>
            <Select
              inputId={`${idPrefix}-collector`}
              options={COLLECTOR_OPTIONS}
              placeholder="Elige quién cobró"
              value={COLLECTOR_OPTIONS.find((option) => option.value === collector) ?? null}
              onChange={(option) => setCollector(option?.value ?? "")}
            />
          </div>
          {/* Vacío a propósito: para ver el texto de ayuda. */}
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-note`}>Nota (opcional)</Label>
            <Input
              id={`${idPrefix}-note`}
              placeholder="Ingresa una nota"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end bg-card px-5 pt-3 pb-4 shadow-edge-top">
          <Button type="button" size="lg" className="w-full sm:w-auto">
            Registrar pago
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Los campos elegidos y los de antes, uno al lado del otro (uno debajo del otro en celular). */
function FieldsComparison() {
  return (
    <PageBox isFill>
      <div className="grid gap-6 lg:grid-cols-2">
        <PaymentFormMock title="Elegidos" />
        <PaymentFormMock title="Antes" fieldsClassName={FIELD_PREVIOUS_CLASS} />
      </div>
    </PageBox>
  );
}

interface IVariantTabsProps {
  value: TVariantId;
  onChange: (value: TVariantId) => void;
}

function VariantTabs({ value, onChange }: IVariantTabsProps) {
  return (
    <div role="tablist" aria-label="Paletas" className="flex overflow-x-auto border-b border-border">
      {VARIANTS.map((variant) => {
        const isActive = variant.id === value;
        return (
          <button
            key={variant.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(variant.id)}
            className={cn(
              "-mb-px shrink-0 cursor-pointer border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {variant.label}
          </button>
        );
      })}
    </div>
  );
}

/** Las paletas en tabs, sobre la estructura real de la vista de una actividad. */
function PalettePreviewPage() {
  const [variantId, setVariantId] = useState<TVariantId>("chosen");
  const variant = VARIANTS.find((item) => item.id === variantId) ?? VARIANTS[0]!;
  useAppliedPalette(variant.tokens);

  /* `PageBox` ya trae el borde en oscuro: la paleta anterior se muestra sin él. */
  const boxBorder = variant.hasBoxBorder ? undefined : "dark:md:border-0";

  return (
    <PageContainer>
      <PageBox className={cn("space-y-3", boxBorder)}>
        <VariantTabs value={variantId} onChange={setVariantId} />
        <p className="text-sm text-muted-foreground">{variant.description}</p>
      </PageBox>

      {variantId === "fields" ? (
        <FieldsComparison />
      ) : (
        <>
      <PageBox className={boxBorder}>
        <PageHeader
          title="Bingo II - 2026"
          subtitle="21 nov 2026 · S/ 10.00"
          action={
            <div className="hidden items-center gap-3 md:flex">
              <Button type="button" size="lg" variant="ghost" className="bg-muted hover:bg-accent">
                <BarChart3 />
                Resumen
              </Button>
              <Button type="button" size="lg">
                <Plus />
                Agregar
              </Button>
            </div>
          }
        />
        {/* Celular: las dos acciones debajo del título, a lo ancho. */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
          <Button type="button" size="lg" variant="ghost" className="bg-muted hover:bg-accent">
            <BarChart3 />
            Resumen
          </Button>
          <Button type="button" size="lg">
            <Plus />
            Agregar
          </Button>
        </div>
      </PageBox>

      <PageBox isFill className={cn("space-y-4", boxBorder)}>
        <div className="grid grid-cols-2 gap-3 md:max-w-lg">
          <div className="rounded-lg border border-border bg-primary/10 p-3">
            <p className="flex items-center gap-1.5 text-xs text-primary">
              <Wallet className="size-3.5" />
              Cobrado
            </p>
            <p className="font-heading text-lg font-bold text-primary">S/ 45.00</p>
          </div>
          <div className="rounded-lg bg-primary p-3 text-primary-foreground">
            <p className="flex items-center gap-1.5 text-xs">
              <TrendingDown className="size-3.5" />
              Ganancia
            </p>
            <p className="font-heading text-lg font-bold">- S/ 5.00</p>
          </div>
        </div>

        <div className="flex h-control items-center gap-2.5 rounded-lg border border-input bg-field px-4 text-sm text-placeholder md:max-w-sm">
          <Search className="size-4.5" aria-hidden />
          Buscar cartilla…
        </div>

        {/* Escritorio: la tabla. */}
        <div className="hidden overflow-hidden rounded-lg border border-border md:block">
          <div className="grid grid-cols-[4rem_minmax(0,1.4fr)_auto_minmax(0,1.4fr)_5rem_auto_5rem] gap-4 bg-muted px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
            <span>Serie</span>
            <span>Comprador</span>
            <span>Barrio</span>
            <span>Vendedor</span>
            <span className="text-right">Precio</span>
            <span>Por cobrar</span>
            <span />
          </div>
          {ROWS.map((row) => (
            <div
              key={row.serial}
              className="grid grid-cols-[4rem_minmax(0,1.4fr)_auto_minmax(0,1.4fr)_5rem_auto_5rem] items-center gap-4 border-t border-border px-4 py-3 text-sm"
            >
              <span className="font-semibold text-primary tabular-nums">{row.serial}</span>
              <span className="truncate font-semibold">{row.buyer}</span>
              <HoodBadge id={row.hood} isSoft={variant.isSoft} />
              <span className="truncate">{SELLER}</span>
              <span className="text-right tabular-nums">S/ 10.00</span>
              <StatusBadge status={row.status} />
              <span className="flex justify-end gap-1.5">
                <IconButton label="Registrar pago" isBordered>
                  <HandCoins />
                </IconButton>
                <IconButton label="Más acciones" isBordered>
                  <EllipsisVertical />
                </IconButton>
              </span>
            </div>
          ))}
        </div>

        {/* Celular: las cards. */}
        <ul className="space-y-3 md:hidden">
          {ROWS.map((row) => (
            <li key={row.serial} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border bg-muted px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-semibold text-primary tabular-nums">#{row.serial}</span>
                  <HoodBadge id={row.hood} isSoft={variant.isSoft} />
                </div>
                <span className="flex shrink-0 gap-1.5">
                  <IconButton label="Registrar pago" isBordered>
                    <HandCoins />
                  </IconButton>
                  <IconButton label="Más acciones" isBordered>
                    <EllipsisVertical />
                  </IconButton>
                </span>
              </div>
              <div className="space-y-2 p-3">
                <p className="font-heading font-semibold">{row.buyer}</p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="size-3.5" aria-hidden />
                  Vendedor: <span className="text-foreground">{SELLER}</span>
                </p>
                <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-sm">
                  <span className="text-muted-foreground">
                    Precio: <span className="font-semibold text-foreground tabular-nums">S/ 10.00</span>
                  </span>
                  <StatusBadge status={row.status} label="Por cobrar:" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </PageBox>
        </>
      )}
    </PageContainer>
  );
}

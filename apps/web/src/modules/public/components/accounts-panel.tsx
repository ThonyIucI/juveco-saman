import type { IPublicAccountLine, IPublicProject } from "@juveco/shared/public";
import { formatSoles } from "@juveco/shared/money";
import { cn } from "@juveco/ui/lib/utils";
import { Wallet } from "lucide-react";

import AccountsBar, { INCOME_SOURCE_STYLES } from "./accounts-bar";
import CountUp from "./count-up";
import { Reveal, RevealGroup, RevealItem } from "./reveal";

const EXPENSE_SWATCH_CLASS = "bg-white/50";

interface IFigureProps {
  label: string;
  value: number;
  isHighlighted?: boolean;
}

/** Una de las tres cifras de arriba; la de la chocolatada va destacada en dorado. */
function Figure({ label, value, isHighlighted = false }: IFigureProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isHighlighted ? "border-gold bg-gold text-gold-foreground" : "border-white/15 bg-white/5 text-white",
      )}
    >
      <p className={cn("text-sm", isHighlighted ? "text-gold-foreground" : "text-white/80")}>{label}</p>
      <CountUp value={value} format={formatSoles} className="font-heading text-2xl font-semibold tabular-nums" />
    </div>
  );
}

interface ILinesProps {
  title: string;
  lines: { label: string; amount: number; swatchClass: string }[];
}

/** Una columna: cada concepto con su cuadrito de color y su monto a la derecha. */
function Lines({ title, lines }: ILinesProps) {
  return (
    <div>
      <h4 className="font-heading text-xl font-semibold">{title}</h4>
      {lines.length === 0 ? (
        <p className="mt-2 text-sm text-white/70">Todavía no hay movimientos.</p>
      ) : (
        <ul className="mt-2 divide-y divide-white/10 border-y border-white/10">
          {lines.map((line) => (
            <li key={line.label} className="flex items-center gap-3 py-2.5 text-sm">
              <span aria-hidden className={cn("size-3 shrink-0 rounded-sm", line.swatchClass)} />
              <span className="min-w-0 flex-1">{line.label}</span>
              <span className="shrink-0 font-medium tabular-nums">{formatSoles(line.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const withSwatch = (lines: IPublicAccountLine[], swatchClass: string) =>
  lines.map((line) => ({ ...line, swatchClass }));

/**
 * Cuentas claras (Thony, 2026-11-25): tres cifras, la barra de dónde vino la plata, cada
 * concepto con su monto y, al pie, a quién agradecer. Montos por concepto, nunca por persona.
 * Va sobre fondo azul marino.
 */
export default function AccountsPanel({ event }: { event: IPublicProject }) {
  const { accounts, supporters } = event;
  const isEmpty = accounts.incomes.length === 0 && accounts.expenses.length === 0;

  return (
    <div className="mt-12 border-t border-white/10 pt-10">
      <Reveal>
        <h3 className="font-heading text-xl font-semibold">Cuentas claras</h3>
        <p className="text-sm text-white/80">De dónde vinieron los fondos y en qué se usaron.</p>
      </Reveal>

      {isEmpty ? (
        <Reveal className="mt-6 flex items-center gap-3 rounded-lg border border-dashed border-white/25 p-5">
          <Wallet aria-hidden className="size-6 shrink-0 text-gold" />
          <p className="text-base text-white/90">Todavía no hay movimientos. Aquí verás cuánto entra y en qué se usa.</p>
        </Reveal>
      ) : (
        <>
          <RevealGroup className="mt-6 grid gap-3 sm:grid-cols-3">
            <RevealItem>
              <Figure label="Entró" value={accounts.collected} />
            </RevealItem>
            <RevealItem>
              <Figure label="Se usó" value={accounts.spent} />
            </RevealItem>
            <RevealItem>
              <Figure label="Para la chocolatada" value={accounts.remaining} isHighlighted />
            </RevealItem>
          </RevealGroup>

          <Reveal className="mt-6">
            <AccountsBar incomes={accounts.incomes} />
          </Reveal>

          <Reveal className="mt-8 grid gap-8 md:grid-cols-2 md:gap-12">
            <Lines
              title="Lo que entró"
              lines={accounts.incomes.map((line) => ({
                ...line,
                swatchClass: INCOME_SOURCE_STYLES[line.source].swatchClass,
              }))}
            />
            <Lines title="En qué se usó" lines={withSwatch(accounts.expenses, EXPENSE_SWATCH_CLASS)} />
          </Reveal>
        </>
      )}

      {supporters.length > 0 && (
        <Reveal className="mt-8">
          <p className="text-sm font-medium text-white/80">Gracias a</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {supporters.map((name) => (
              <li key={name} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                {name}
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </div>
  );
}

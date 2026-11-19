/**
 * Pagos de lo vendido en una actividad (acordado 2026-11-07): Yape o efectivo, se puede pagar
 * por partes y un pago **nunca pasa de lo que falta cobrar**. La deuda no se guarda: es el
 * precio del ítem menos la suma de sus pagos. Quien cobra es el administrador de la sesión y
 * la fecha es la del registro.
 */
import type { IActivityItemPerson } from "./activity-items";

export const EPaymentMethod = {
  YAPE: "YAPE",
  CASH: "CASH",
} as const;

export type TPaymentMethod = (typeof EPaymentMethod)[keyof typeof EPaymentMethod];

export const PAYMENT_METHODS = Object.values(EPaymentMethod) as [TPaymentMethod, ...TPaymentMethod[]];

export const paymentMethodLabels: Record<TPaymentMethod, string> = {
  [EPaymentMethod.YAPE]: "Yape",
  [EPaymentMethod.CASH]: "Efectivo",
};

export const PAYMENT_METHOD_REQUIRED_MESSAGE = "Elige cómo pagó.";
export const PAYMENT_ALREADY_PAID_MESSAGE = "Ya está pagado: no hay nada por cobrar.";

export const PAYMENT_COLLECTOR_REQUIRED_MESSAGE = "Elige quién cobró.";

/** El pago no puede pasar de lo que falta cobrar. */
export const paymentOverPendingMessage = (pending: string): string =>
  `El pago no puede pasar de lo que falta cobrar: ${pending}.`;

/** Lo común a todo pago, sea de una cartilla o de la inscripción de un equipo. */
export interface IPaymentResource {
  id: string;
  /** En soles con dos decimales (ver `money.ts`). */
  amount: number;
  method: TPaymentMethod;
  /** El administrador que lo cobró. */
  collector: IActivityItemPerson;
  createdAt: string;
}

/** Un pago de un ítem tal como lo devuelve la API. */
export interface IActivityItemPaymentResource extends IPaymentResource {
  itemId: string;
}

/** Lo que se escribe al registrar un pago. */
export interface IActivityItemPaymentInput {
  amount: number;
  method: TPaymentMethod;
  /** Quien cobró, si no fue el admin de la sesión. */
  collectorId?: string;
}

/** El ítem queda con otro «pagado»: la API lo devuelve junto con el pago. */
export interface IPaymentChange<TItem, TPayment extends IPaymentResource = IActivityItemPaymentResource> {
  payment: TPayment;
  item: TItem;
}

/** Resumen de una actividad para los KPIs. */
export interface IActivitySummary {
  /** Cuántos se vendieron. */
  itemCount: number;
  /** Lo que se cobraría si todos pagan: la suma de los precios. */
  expected: number;
  collected: number;
  collectedByMethod: Record<TPaymentMethod, number>;
  pending: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
}

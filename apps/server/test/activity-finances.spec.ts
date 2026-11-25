import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, putJson, request, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface IPrizeData {
  id: string;
  name: string;
  origin: string;
  donor: { id: string; firstName: string } | null;
  cost: number | null;
  note: string | null;
  winner: { itemId: string; serial: string; buyer: { id: string; firstName: string } } | null;
}

interface IExpenseData {
  id: string;
  concept: string;
  amount: number;
}

interface IBalanceData {
  collected: number;
  expected: number;
  incomes: number;
  purchasedPrizes: number;
  expenses: number;
  currentProfit: number;
  expectedProfit: number;
  donatedPrizeCount: number;
}

describe("premios, gastos y balance de una actividad", () => {
  let cookie = "";
  let activityId = "";
  let donorId = "";

  const path = (suffix: string) => `/api/v1/activities/${activityId}/${suffix}`;
  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;
  const dataOf = async <TData>(response: Response) => (await response.json<IBody<TData>>()).data;
  const balance = async () => dataOf<IBalanceData>(await request(path("balance"), { headers: { cookie } }));

  beforeAll(async () => {
    cookie = (await signInAsSuperadmin()).cookie;

    const activities = await request("/api/v1/activities", { headers: { cookie } });
    /* El bingo por tipo: el campeonato de la seed también está en la lista. */
    const all = await dataOf<{ id: string; type: string }[]>(activities);
    activityId = all.find((activity) => activity.type === "BINGO")?.id ?? "";

    const donor = await postJson("/api/v1/users", { firstName: "Rosa", lastName: "Donante" }, { cookie });
    donorId = (await dataOf<{ id: string }>(donor)).id;
  });

  it("crea un premio donado con su donante y sin costo", async () => {
    // Act
    const response = await postJson(
      path("prizes"),
      { name: "Licuadora", origin: "DONATED", donorId, cost: 50, note: null },
      { cookie },
    );

    // Assert
    expect(response.status).toBe(201);
    expect(await dataOf<IPrizeData>(response)).toMatchObject({
      name: "Licuadora",
      origin: "DONATED",
      donor: { id: donorId, firstName: "Rosa" },
      cost: null,
    });
  });

  it("pide donante si es donado y costo si es comprado", async () => {
    const withoutDonor = await postJson(path("prizes"), { name: "Olla", origin: "DONATED" }, { cookie });
    const withoutCost = await postJson(path("prizes"), { name: "Olla", origin: "PURCHASED" }, { cookie });

    expect(withoutDonor.status).toBe(400);
    expect(await errorOf(withoutDonor)).toBe("Elige quién lo donó.");
    expect(withoutCost.status).toBe(400);
    expect(await errorOf(withoutCost)).toBe("Escribe cuánto costó.");
  });

  it("al pasar un premio de donado a comprado, se queda sin donante", async () => {
    // Arrange
    const created = await postJson(path("prizes"), { name: "Plancha", origin: "DONATED", donorId }, { cookie });
    const { id } = await dataOf<IPrizeData>(created);

    // Act
    const response = await patchJson(
      path(`prizes/${id}`),
      { name: "Plancha", origin: "PURCHASED", donorId, cost: 45.5 },
      { cookie },
    );

    // Assert
    expect(response.status).toBe(200);
    expect(await dataOf<IPrizeData>(response)).toMatchObject({ origin: "PURCHASED", donor: null, cost: 45.5 });
  });

  it("crea, edita y elimina un gasto", async () => {
    // Arrange
    const created = await postJson(path("expenses"), { concept: " Impresión  de cartillas ", amount: 30 }, { cookie });
    const { id, concept } = await dataOf<IExpenseData>(created);

    // Act
    const updated = await patchJson(path(`expenses/${id}`), { concept, amount: 35 }, { cookie });
    const deleted = await request(path(`expenses/${id}`), { method: "DELETE", headers: { cookie } });

    // Assert
    expect(created.status).toBe(201);
    expect(concept).toBe("Impresión de cartillas");
    expect((await dataOf<IExpenseData>(updated)).amount).toBe(35);
    expect(deleted.status).toBe(200);
  });

  it("el balance resta premios comprados y gastos, y solo cuenta los donados", async () => {
    // Arrange
    const before = await balance();
    await postJson(path("prizes"), { name: "Parlante", origin: "PURCHASED", cost: 80 }, { cookie });
    await postJson(path("prizes"), { name: "Canasta", origin: "DONATED", donorId }, { cookie });
    await postJson(path("expenses"), { concept: "Alquiler de local", amount: 100 }, { cookie });

    // Act
    const after = await balance();

    // Assert
    expect(after.purchasedPrizes).toBeCloseTo(before.purchasedPrizes + 80);
    expect(after.expenses).toBeCloseTo(before.expenses + 100);
    expect(after.donatedPrizeCount).toBe(before.donatedPrizeCount + 1);
    expect(after.currentProfit).toBeCloseTo(after.collected - after.purchasedPrizes - after.expenses);
    expect(after.expectedProfit).toBeCloseTo(after.expected - after.purchasedPrizes - after.expenses);
  });

  it("no deja eliminar a una persona que donó un premio", async () => {
    const response = await request(`/api/v1/users/${donorId}`, { method: "DELETE", headers: { cookie } });

    expect(response.status).toBe(409);
  });

  it("crea, edita y elimina un ingreso, y el balance lo suma a lo cobrado y a lo esperado", async () => {
    // Arrange
    const before = await balance();

    // Act
    const created = await postJson(path("incomes"), { concept: " Inscripciones  del campeonato ", amount: 600 }, { cookie });
    const { id, concept } = await dataOf<IExpenseData>(created);
    const middle = await balance();
    const updated = await patchJson(path(`incomes/${id}`), { concept, amount: 800 }, { cookie });
    const deleted = await request(path(`incomes/${id}`), { method: "DELETE", headers: { cookie } });
    const after = await balance();

    // Assert
    expect(created.status).toBe(201);
    expect(concept).toBe("Inscripciones del campeonato");
    expect(middle.incomes).toBeCloseTo(before.incomes + 600);
    expect(middle.collected).toBeCloseTo(before.collected + 600);
    expect(middle.expected).toBeCloseTo(before.expected + 600);
    expect((await dataOf<IExpenseData>(updated)).amount).toBe(800);
    expect(deleted.status).toBe(200);
    expect(after.collected).toBeCloseTo(before.collected);
  });

  it("pide concepto y monto válido en un ingreso", async () => {
    const response = await postJson(path("incomes"), { concept: " ", amount: 10 }, { cookie });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("Escribe el concepto del ingreso.");
  });

  it("marca y quita la cartilla ganadora de un premio; el ganador es su comprador", async () => {
    // Arrange
    const prize = await dataOf<IPrizeData>(
      await postJson(path("prizes"), { name: "Bicicleta", origin: "DONATED", donorId }, { cookie }),
    );
    const buyer = await dataOf<{ id: string }>(
      await postJson("/api/v1/users", { firstName: "Lucho", lastName: "Ganador" }, { cookie }),
    );
    const item = await dataOf<{ id: string }>(
      await postJson(path("items"), { serial: "0777", buyerId: buyer.id }, { cookie }),
    );

    // Act
    const marked = await putJson(path(`prizes/${prize.id}/winner`), { itemId: item.id }, { cookie });
    const cleared = await putJson(path(`prizes/${prize.id}/winner`), { itemId: null }, { cookie });

    // Assert
    expect(marked.status).toBe(200);
    expect((await dataOf<IPrizeData>(marked)).winner).toMatchObject({
      itemId: item.id,
      serial: "0777",
      buyer: { id: buyer.id, firstName: "Lucho" },
    });
    expect((await dataOf<IPrizeData>(cleared)).winner).toBeNull();
  });

  it("no acepta como ganadora una cartilla de otra actividad", async () => {
    const prize = await dataOf<IPrizeData>(
      await postJson(path("prizes"), { name: "Olla", origin: "DONATED", donorId }, { cookie }),
    );

    const response = await putJson(path(`prizes/${prize.id}/winner`), { itemId: "no-existe" }, { cookie });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("Esa cartilla no es de esta actividad.");
  });
});

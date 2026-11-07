import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, request, signInAsSuperadmin } from "./helpers";

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
}

interface IExpenseData {
  id: string;
  concept: string;
  amount: number;
}

interface IBalanceData {
  collected: number;
  expected: number;
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
    [{ id: activityId }] = (await dataOf<{ id: string }[]>(activities)) as [{ id: string }];

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
});

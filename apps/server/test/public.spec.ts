import { beforeAll, describe, expect, it } from "vitest";

import { postJson, request, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface IPublicHomeData {
  project: {
    name: string;
    activities: {
      id: string;
      type: string;
      prizes: { name: string; donorName: string | null; winner: unknown }[];
    }[];
    accounts: {
      collected: number;
      spent: number;
      remaining: number;
      incomes: { label: string; amount: number; source: string }[];
      expenses: { label: string; amount: number }[];
    };
    supporters: string[];
  } | null;
}

describe("portada pública", () => {
  let cookie = "";
  let bingoId = "";

  const dataOf = async <TData>(response: Response) => (await response.json<IBody<TData>>()).data;
  const home = async () => dataOf<IPublicHomeData>(await request("/api/v1/public/home"));

  beforeAll(async () => {
    cookie = (await signInAsSuperadmin()).cookie;
    const all = await dataOf<{ id: string; type: string }[]>(
      await request("/api/v1/activities", { headers: { cookie } }),
    );
    bingoId = all.find((activity) => activity.type === "BINGO")?.id ?? "";
  });

  it("se ve sin sesión, con la Chocolatada y sus actividades", async () => {
    const response = await request("/api/v1/public/home");

    expect(response.status).toBe(200);
    const data = await dataOf<IPublicHomeData>(response);
    expect(data.project?.name).toBe("Chocolatada 2026");
    expect(data.project?.activities.map((activity) => activity.type).sort()).toEqual(["BINGO", "CHAMPIONSHIP"]);
  });

  it("muestra premio con donante y quienes apoyaron, sin monto por persona", async () => {
    // Arrange
    const donor = await dataOf<{ id: string }>(
      await postJson("/api/v1/users", { firstName: "Marta", paternalLastName: "Apoyo" }, { cookie }),
    );
    await postJson(
      `/api/v1/activities/${bingoId}/prizes`,
      { name: "Televisor", origin: "DONATED", donorId: donor.id },
      { cookie },
    );

    // Act
    const data = await home();

    // Assert
    const bingo = data.project?.activities.find((activity) => activity.id === bingoId);
    expect(bingo?.prizes).toContainEqual({ name: "Televisor", donorName: "Marta Apoyo", winner: null });
    expect(data.project?.supporters).toContain("Marta Apoyo");
    /* Los donantes van como nombres: ni el premio ni la lista llevan montos. */
    expect(JSON.stringify(bingo?.prizes)).not.toMatch(/"(amount|cost|price)"/);
    expect(JSON.stringify(data.project?.supporters)).not.toMatch(/\d/);
  });

  it("envía los montos de las cuentas claras por concepto y los totales cuadran", async () => {
    // Arrange
    const before = (await home()).project?.accounts;
    await postJson(`/api/v1/activities/${bingoId}/expenses`, { concept: "Toldo", amount: 120 }, { cookie });
    await postJson(`/api/v1/activities/${bingoId}/incomes`, { concept: "Venta de gaseosas", amount: 90 }, { cookie });
    await postJson(`/api/v1/activities/${bingoId}/incomes`, { concept: "venta de GASEOSAS", amount: 10 }, { cookie });

    // Act
    const accounts = (await home()).project?.accounts;

    // Assert
    expect(accounts?.expenses).toContainEqual({ label: "Toldo", amount: 120 });
    expect(accounts?.incomes).toContainEqual({ label: "Venta de gaseosas", amount: 100, source: "OTHER" });
    expect(accounts?.collected).toBeCloseTo((before?.collected ?? 0) + 100, 2);
    expect(accounts?.spent).toBeCloseTo((before?.spent ?? 0) + 120, 2);
    expect(accounts?.remaining).toBeCloseTo((accounts?.collected ?? 0) - (accounts?.spent ?? 0), 2);
    const incomesTotal = accounts?.incomes.reduce((total, line) => total + line.amount, 0) ?? 0;
    expect(incomesTotal).toBeCloseTo(accounts?.collected ?? 0, 2);
    const expensesTotal = accounts?.expenses.reduce((total, line) => total + line.amount, 0) ?? 0;
    expect(expensesTotal).toBeCloseTo(accounts?.spent ?? 0, 2);
  });

  it("suma las donaciones anotadas a mano en un solo renglón, sin nombres", async () => {
    // Arrange
    await postJson(`/api/v1/activities/${bingoId}/incomes`, { concept: "Donación de Juan Pérez", amount: 50 }, { cookie });
    await postJson(`/api/v1/activities/${bingoId}/incomes`, { concept: "Aporte de Rosa Díaz", amount: 30 }, { cookie });

    // Act
    const accounts = (await home()).project?.accounts;

    // Assert
    const donations = accounts?.incomes.filter((line) => line.source === "DONATIONS") ?? [];
    expect(donations).toHaveLength(1);
    expect(donations[0]?.label).toBe("Donaciones y apoyos");
    expect(donations[0]?.amount).toBeGreaterThanOrEqual(80);
    const text = JSON.stringify(accounts);
    expect(text).not.toContain("Juan Pérez");
    expect(text).not.toContain("Rosa Díaz");
  });
});

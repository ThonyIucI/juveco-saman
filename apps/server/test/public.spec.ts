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
      incomeConcepts: string[];
      expenseConcepts: string[];
    }[];
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

  it("muestra premio con donante, conceptos del balance sin montos y quienes apoyaron", async () => {
    // Arrange
    const donor = await dataOf<{ id: string }>(
      await postJson("/api/v1/users", { firstName: "Marta", lastName: "Apoyo" }, { cookie }),
    );
    await postJson(
      `/api/v1/activities/${bingoId}/prizes`,
      { name: "Televisor", origin: "DONATED", donorId: donor.id },
      { cookie },
    );
    await postJson(`/api/v1/activities/${bingoId}/expenses`, { concept: "Toldo", amount: 120 }, { cookie });
    await postJson(`/api/v1/activities/${bingoId}/incomes`, { concept: "Venta de gaseosas", amount: 90 }, { cookie });

    // Act
    const data = await home();

    // Assert
    const bingo = data.project?.activities.find((activity) => activity.id === bingoId);
    expect(bingo?.prizes).toContainEqual({ name: "Televisor", donorName: "Marta Apoyo", winner: null });
    expect(bingo?.expenseConcepts).toContain("Toldo");
    expect(bingo?.incomeConcepts).toContain("Venta de gaseosas");
    expect(data.project?.supporters).toContain("Marta Apoyo");
    /* Sin montos: ningún número de plata en la respuesta. */
    expect(JSON.stringify(data)).not.toMatch(/"(amount|cost|price|collected)"/);
  });
});

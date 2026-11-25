import { NEIGHBORHOOD_IDS } from "@juveco/shared/neighborhoods";
import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, request, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface IActivityData {
  id: string;
  name: string;
  type: string;
  eventDate: string;
  defaultPrice: number;
}

interface IPersonData {
  id: string;
  firstName: string;
  neighborhood: { id: string } | null;
}

interface ITeamData {
  id: string;
  name: string;
  price: number;
  paidAmount: number;
  delegate: IPersonData;
  players: IPersonData[];
  note: string | null;
}

interface IBalanceData {
  expected: number;
  collected: number;
}

describe("/activities/:id/teams", () => {
  let cookie = "";
  let championship: IActivityData;
  let bingo: IActivityData;
  const people: string[] = [];

  const teamsPath = (activityId = championship.id) => `/api/v1/activities/${activityId}/teams`;
  const paymentsPath = (teamId: string) => `${teamsPath()}/${teamId}/payments`;

  const dataOf = async <TData>(response: Response) => (await response.json<IBody<TData>>()).data;
  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;

  const createPerson = async (firstName: string) => {
    const response = await postJson(
      "/api/v1/users",
      { firstName, lastName: "Prueba", neighborhoodId: NEIGHBORHOOD_IDS.EL_PATIO },
      { cookie },
    );
    return (await dataOf<{ id: string }>(response)).id;
  };

  const createTeam = (body: unknown, activityId?: string) => postJson(teamsPath(activityId), body, { cookie });

  beforeAll(async () => {
    cookie = (await signInAsSuperadmin()).cookie;

    const activities = await dataOf<IActivityData[]>(
      await request("/api/v1/activities", { headers: { cookie } }),
    );
    championship = activities.find((activity) => activity.type === "CHAMPIONSHIP") as IActivityData;
    bingo = activities.find((activity) => activity.type === "BINGO") as IActivityData;

    /* 17 personas: alcanzan para pasar del máximo de 15 jugadores. */
    for (let index = 0; index < 17; index += 1) {
      people.push(await createPerson(`Jugador${index}`));
    }
  });

  it("la migración crea el Campeonato Relámpago 2026 con inscripción de S/ 200", () => {
    expect(championship).toMatchObject({
      name: "Campeonato Relámpago 2026",
      type: "CHAMPIONSHIP",
      eventDate: "2026-11-22",
      defaultPrice: 200,
    });
  });

  it("exige sesión", async () => {
    const response = await request(teamsPath());

    expect(response.status).toBe(401);
  });

  it("crea un equipo con delegado aparte, jugadores e inscripción de la actividad", async () => {
    const response = await createTeam({
      name: "  Los   Halcones ",
      delegateId: people[0],
      playerIds: [people[1], people[2]],
      note: "Camiseta roja",
    });

    expect(response.status).toBe(201);
    const team = await dataOf<ITeamData>(response);
    expect(team).toMatchObject({ name: "Los Halcones", price: 200, paidAmount: 0, note: "Camiseta roja" });
    expect(team.delegate.id).toBe(people[0]);
    /* El delegado no se vuelve jugador solo por ser delegado. */
    expect(team.players.map((player) => player.id).sort()).toEqual([people[1], people[2]].sort());
    expect(team.players[0]?.neighborhood?.id).toBe(NEIGHBORHOOD_IDS.EL_PATIO);
  });

  it("el delegado también puede jugar", async () => {
    const response = await createTeam({ name: "Real Samán", delegateId: people[3], playerIds: [people[3]] });

    expect(response.status).toBe(201);
    expect((await dataOf<ITeamData>(response)).players.map((player) => player.id)).toEqual([people[3]]);
  });

  it("rechaza un nombre repetido sin importar mayúsculas", async () => {
    const response = await createTeam({ name: "los halcones", delegateId: people[4] });

    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("Ya hay un equipo con ese nombre en el campeonato.");
  });

  it("rechaza a un jugador que ya está en otro equipo del campeonato", async () => {
    const response = await createTeam({ name: "Atlético El Patio", delegateId: people[4], playerIds: [people[1]] });

    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("Jugador1 Prueba ya juega en «Los Halcones».");
  });

  it("rechaza más de 15 jugadores y jugadores repetidos", async () => {
    const tooMany = await createTeam({ name: "Juventud Santa Rosa", delegateId: people[4], playerIds: people.slice(1, 17) });
    expect(tooMany.status).toBe(400);
    expect(await errorOf(tooMany)).toBe("Un equipo lleva hasta 15 jugadores.");

    const repeated = await createTeam({ name: "Juventud Santa Rosa", delegateId: people[4], playerIds: [people[5], people[5]] });
    expect(repeated.status).toBe(400);
    expect(await errorOf(repeated)).toBe("Ese jugador ya está en la lista.");
  });

  it("no crea equipos en un bingo", async () => {
    const response = await createTeam({ name: "Unión Ramón Castilla", delegateId: people[4] }, bingo.id);

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("Esta actividad no es un campeonato: no lleva equipos.");
  });

  it("al editar reemplaza los jugadores y deja conservar los suyos", async () => {
    const created = await dataOf<ITeamData>(
      await createTeam({ name: "Deportivo Nueva Esperanza", delegateId: people[6], playerIds: [people[7], people[8]] }),
    );

    const response = await patchJson(
      `${teamsPath()}/${created.id}`,
      { name: "Dep. Nueva Esperanza", delegateId: people[6], playerIds: [people[8], people[9]], note: null },
      { cookie },
    );

    expect(response.status).toBe(200);
    const updated = await dataOf<ITeamData>(response);
    expect(updated.name).toBe("Dep. Nueva Esperanza");
    expect(updated.players.map((player) => player.id).sort()).toEqual([people[8], people[9]].sort());
  });

  it("cobra la inscripción por partes, nunca más de lo que falta, y no toca el balance", async () => {
    const team = await dataOf<ITeamData>(await createTeam({ name: "Unión Ramón Castilla", delegateId: people[10] }));
    const before = await dataOf<IBalanceData>(
      await request(`/api/v1/activities/${championship.id}/balance`, { headers: { cookie } }),
    );

    const first = await postJson(paymentsPath(team.id), { amount: 80, method: "YAPE" }, { cookie });
    expect(first.status).toBe(201);
    expect((await dataOf<{ item: ITeamData }>(first)).item.paidAmount).toBe(80);

    const over = await postJson(paymentsPath(team.id), { amount: 150, method: "CASH" }, { cookie });
    expect(over.status).toBe(400);
    expect(await errorOf(over)).toBe("El pago no puede pasar de lo que falta cobrar: S/ 120.00.");

    const rest = await postJson(paymentsPath(team.id), { amount: 120, method: "CASH" }, { cookie });
    expect((await dataOf<{ item: ITeamData }>(rest)).item.paidAmount).toBe(200);

    const after = await dataOf<IBalanceData>(
      await request(`/api/v1/activities/${championship.id}/balance`, { headers: { cookie } }),
    );
    /* Lo del campeonato entra como ingreso (Thony, 2026-11-25): los pagos de equipos no suman. */
    expect(after.expected).toBe(before.expected);
    expect(after.collected).toBe(before.collected);
  });

  it("no elimina un equipo con pagos; eliminado el pago, sí", async () => {
    const team = await dataOf<ITeamData>(
      await createTeam({ name: "Juventud Santa Rosa", delegateId: people[11], playerIds: [people[12]] }),
    );
    const payment = await dataOf<{ payment: { id: string } }>(
      await postJson(paymentsPath(team.id), { amount: 50, method: "YAPE" }, { cookie }),
    );

    const blocked = await request(`${teamsPath()}/${team.id}`, { method: "DELETE", headers: { cookie } });
    expect(blocked.status).toBe(409);

    const removed = await request(`${paymentsPath(team.id)}/${payment.payment.id}`, {
      method: "DELETE",
      headers: { cookie },
    });
    expect((await dataOf<{ item: ITeamData }>(removed)).item.paidAmount).toBe(0);

    const deleted = await request(`${teamsPath()}/${team.id}`, { method: "DELETE", headers: { cookie } });
    expect(deleted.status).toBe(200);

    /* Su jugador queda libre para otro equipo. */
    const reused = await createTeam({ name: "Juventud Santa Rosa", delegateId: people[11], playerIds: [people[12]] });
    expect(reused.status).toBe(201);
  });

  it("lista los equipos con sus jugadores", async () => {
    const teams = await dataOf<ITeamData[]>(await request(teamsPath(), { headers: { cookie } }));

    const halcones = teams.find((team) => team.name === "Los Halcones");
    expect(halcones?.players).toHaveLength(2);
  });
});

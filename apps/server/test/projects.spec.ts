import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, request, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface IProjectData {
  id: string;
  type: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  goalAmount: number | null;
  beneficiaryCount: number | null;
  closedAt: string | null;
  activityCount: number;
}

interface IActivityData {
  id: string;
  type: string;
  projectId: string | null;
}

/* El bingo por tipo: el campeonato de la seed también está en la lista. */
const bingoOf = (activities: IActivityData[]) => activities.find((activity) => activity.type === "BINGO");

const PROJECTS_PATH = "/api/v1/projects";

const validProject = {
  type: "PROJECT",
  name: "Ampliación de cámaras",
  startDate: "2026-12-01",
};

describe("/projects", () => {
  let cookie = "";

  const create = (body: unknown) => postJson(PROJECTS_PATH, body, { cookie });
  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;

  const createProject = async (body: Record<string, unknown> = {}) => {
    const response = await create({ ...validProject, ...body });
    return (await response.json<IBody<IProjectData>>()).data;
  };

  beforeAll(async () => {
    cookie = (await signInAsSuperadmin()).cookie;
  });

  it("rechaza sin sesión", async () => {
    const response = await request(PROJECTS_PATH);
    expect(response.status).toBe(401);
  });

  it("crea un proyecto con los opcionales vacíos", async () => {
    const response = await create(validProject);
    expect(response.status).toBe(201);
    const { data } = await response.json<IBody<IProjectData>>();
    expect(data).toMatchObject({
      type: "PROJECT",
      name: "Ampliación de cámaras",
      description: null,
      endDate: null,
      goalAmount: null,
      beneficiaryCount: null,
      closedAt: null,
      activityCount: 0,
    });
  });

  it("guarda meta, beneficiarios y fecha de fin", async () => {
    const data = await createProject({
      type: "EVENT",
      name: "Día de la madre",
      goalAmount: 1500.5,
      beneficiaryCount: 400,
      endDate: "2026-12-02",
    });
    expect(data).toMatchObject({ goalAmount: 1500.5, beneficiaryCount: 400, endDate: "2026-12-02" });
  });

  it("rechaza nombre vacío o muy largo", async () => {
    expect((await create({ ...validProject, name: "   " })).status).toBe(400);
    const response = await create({ ...validProject, name: "a".repeat(121) });
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("El nombre va hasta 120 caracteres.");
  });

  it("rechaza tipo inválido, fecha inexistente y fin antes del inicio", async () => {
    expect((await create({ ...validProject, type: "OTRO" })).status).toBe(400);
    expect((await create({ ...validProject, startDate: "2026-02-30" })).status).toBe(400);
    const response = await create({ ...validProject, endDate: "2026-11-30" });
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("La fecha de fin no puede ser antes que la de inicio.");
  });

  it("rechaza una meta o beneficiarios que no sirven", async () => {
    expect((await create({ ...validProject, goalAmount: 0 })).status).toBe(400);
    expect((await create({ ...validProject, goalAmount: 10.123 })).status).toBe(400);
    expect((await create({ ...validProject, beneficiaryCount: 0 })).status).toBe(400);
    expect((await create({ ...validProject, beneficiaryCount: 2.5 })).status).toBe(400);
  });

  it("edita un proyecto", async () => {
    const project = await createProject();
    const response = await patchJson(
      `${PROJECTS_PATH}/${project.id}`,
      { ...validProject, name: "Ampliación de cámaras, etapa 2", goalAmount: 3000 },
      { cookie },
    );
    expect(response.status).toBe(200);
    expect((await response.json<IBody<IProjectData>>()).data).toMatchObject({
      name: "Ampliación de cámaras, etapa 2",
      goalAmount: 3000,
    });
  });

  it("responde 404 con un proyecto que no existe", async () => {
    const response = await request(`${PROJECTS_PATH}/019a0000-0000-7000-8000-000000000000`, { headers: { cookie } });
    expect(response.status).toBe(404);
  });

  it("cierra un proyecto, ya no se edita y no se cierra dos veces", async () => {
    const project = await createProject();
    const closed = await postJson(`${PROJECTS_PATH}/${project.id}/close`, {}, { cookie });
    expect(closed.status).toBe(200);
    expect((await closed.json<IBody<IProjectData>>()).data.closedAt).not.toBeNull();

    const edit = await patchJson(`${PROJECTS_PATH}/${project.id}`, validProject, { cookie });
    expect(edit.status).toBe(409);
    const again = await postJson(`${PROJECTS_PATH}/${project.id}/close`, {}, { cookie });
    expect(again.status).toBe(409);
  });

  it("el superadmin reabre un proyecto cerrado", async () => {
    const project = await createProject();
    await postJson(`${PROJECTS_PATH}/${project.id}/close`, {}, { cookie });

    const reopened = await postJson(`${PROJECTS_PATH}/${project.id}/reopen`, {}, { cookie });
    expect(reopened.status).toBe(200);
    expect((await reopened.json<IBody<IProjectData>>()).data.closedAt).toBeNull();

    const notClosed = await postJson(`${PROJECTS_PATH}/${project.id}/reopen`, {}, { cookie });
    expect(notClosed.status).toBe(409);
  });

  it("un proyecto cerrado bloquea cartillas, pagos y gastos de su actividad", async () => {
    const activities = await request("/api/v1/activities", { headers: { cookie } });
    const bingo = bingoOf((await activities.json<IBody<IActivityData[]>>()).data);
    /* La seed asigna el Bingo II a la Chocolatada 2026: si falla acá, falta esa migración. */
    expect(bingo?.projectId).toBeTruthy();
    if (!bingo?.projectId) {
      return;
    }
    const projectId = bingo.projectId;
    await postJson(`${PROJECTS_PATH}/${projectId}/close`, {}, { cookie });

    const expense = await postJson(`/api/v1/activities/${bingo.id}/expenses`, { concept: "Cartones", amount: 10 }, { cookie });
    expect(expense.status).toBe(409);
    expect(await errorOf(expense)).toBe("El proyecto está cerrado: el superadministrador tiene que reabrirlo.");

    await postJson(`${PROJECTS_PATH}/${projectId}/reopen`, {}, { cookie });
    const allowed = await postJson(`/api/v1/activities/${bingo.id}/expenses`, { concept: "Cartones", amount: 10 }, { cookie });
    expect(allowed.status).toBe(201);
  });

  it("el detalle trae las actividades con su balance y lo ganado", async () => {
    const activities = await request("/api/v1/activities", { headers: { cookie } });
    const bingo = bingoOf((await activities.json<IBody<IActivityData[]>>()).data);
    expect(bingo?.projectId).toBeTruthy();
    if (!bingo?.projectId) {
      return;
    }
    const response = await request(`${PROJECTS_PATH}/${bingo.projectId}`, { headers: { cookie } });
    expect(response.status).toBe(200);
    const { data } = await response.json<
      IBody<{ project: IProjectData; progress: { currentProfit: number }; activities: { id: string; balance: { currentProfit: number } }[] }>
    >();
    /* El Bingo II y el Campeonato Relámpago, los dos de la seed. */
    expect(data.project.activityCount).toBe(2);

    /* La lista cuenta lo mismo que el detalle (antes decía 0). */
    const list = await request(PROJECTS_PATH, { headers: { cookie } });
    const listed = (await list.json<IBody<IProjectData[]>>()).data.find((project) => project.id === bingo.projectId);
    expect(listed?.activityCount).toBe(2);
    expect(data.activities.map((activity) => activity.id)).toContain(bingo.id);
    expect(data.progress.currentProfit).toBe(
      data.activities.reduce((total, activity) => total + activity.balance.currentProfit, 0),
    );
  });
});

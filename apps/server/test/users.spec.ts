import { NEIGHBORHOOD_IDS } from "@juveco/shared/neighborhoods";
import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, request, signIn, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface IUserData {
  id: string;
  firstName: string;
  lastName: string | null;
  neighborhood: { id: string; name: string } | null;
  phone: { countryPrefix: string; number: string } | null;
  whatsappUsername: string | null;
  note: string | null;
  role: string;
  email: string | null;
}

const PERU_PHONE = { countryPrefix: "51", number: "987654321" };
const OTHER_PHONE = { countryPrefix: "51", number: "912345678" };
const ADMIN_ACCESS = { email: "rosa@test.local", password: "password123" };

describe("/users", () => {
  let superadminCookie = "";

  const create = (body: unknown, cookie = superadminCookie) => postJson("/api/v1/users", body, { cookie });

  const createUser = async (body: unknown) => (await (await create(body)).json<IBody<IUserData>>()).data;

  const update = (id: string, body: unknown, cookie = superadminCookie) =>
    patchJson(`/api/v1/users/${id}`, body, { cookie });

  const grantAccess = (id: string, body: unknown, cookie = superadminCookie) =>
    postJson(`/api/v1/users/${id}/access`, body, { cookie });

  const list = async (cookie = superadminCookie) => {
    const response = await request("/api/v1/users", { headers: { cookie } });
    return (await response.json<IBody<IUserData[]>>()).data;
  };

  const remove = (id: string, cookie = superadminCookie) =>
    request(`/api/v1/users/${id}`, { method: "DELETE", headers: { cookie } });

  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;

  beforeAll(async () => {
    superadminCookie = (await signInAsSuperadmin()).cookie;
  });

  it("exige sesión", async () => {
    const response = await request("/api/v1/users");

    expect(response.status).toBe(401);
  });

  it("crea un usuario con rol USER, su barrio y sin acceso", async () => {
    // Act
    const response = await create({
      firstName: "  Ana   María ",
      lastName: "Pérez",
      neighborhoodId: NEIGHBORHOOD_IDS.SANTA_ROSA,
      phone: PERU_PHONE,
      whatsappUsername: "Ana.pe",
      note: "Paga el domingo",
    });
    const body = await response.json<IBody<IUserData>>();

    // Assert
    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      firstName: "Ana María",
      lastName: "Pérez",
      neighborhood: { id: NEIGHBORHOOD_IDS.SANTA_ROSA, name: "Santa Rosa" },
      phone: PERU_PHONE,
      whatsappUsername: "Ana.pe",
      note: "Paga el domingo",
      role: "USER",
      email: null,
    });
  });

  it("solo los nombres son obligatorios: lo demás queda en null", async () => {
    const response = await create({ firstName: "Luis", lastName: "" });
    const body = await response.json<IBody<IUserData>>();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({ lastName: null, neighborhood: null, phone: null });
  });

  it("rechaza un barrio que no está en la lista", async () => {
    const response = await create({ firstName: "Sin barrio", neighborhoodId: "otro-id" });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("Elige un barrio de la lista.");
  });

  it("no deja repetir el número ni el usuario, y dice quién lo tiene", async () => {
    const samePhone = await create({ firstName: "Otra Ana", phone: PERU_PHONE });
    const sameUsername = await create({ firstName: "Otra Ana", whatsappUsername: "ana.PE" });

    expect(samePhone.status).toBe(409);
    expect(await errorOf(samePhone)).toBe("«Ana María Pérez» ya tiene ese número.");
    expect(sameUsername.status).toBe(409);
    expect(await errorOf(sameUsername)).toBe("«Ana María Pérez» ya tiene ese usuario de WhatsApp.");
  });

  it.each(["ab", "ana pe", "a".repeat(36)])("rechaza el usuario de WhatsApp «%s»", async (username) => {
    const response = await create({ firstName: "Con usuario", whatsappUsername: username });

    expect(response.status).toBe(400);
  });

  it("edita el barrio y deja su propio número sin chocar", async () => {
    // Arrange
    const created = await createUser({ firstName: "Diego", phone: OTHER_PHONE });

    // Act
    const response = await update(created.id, {
      neighborhoodId: NEIGHBORHOOD_IDS.EL_PATIO,
      phone: OTHER_PHONE,
    });
    const body = await response.json<IBody<IUserData>>();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.neighborhood?.name).toBe("El Patio");
  });

  it("editar sin cambios responde 400", async () => {
    const created = await createUser({ firstName: "Sin cambios" });

    const response = await update(created.id, {});

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("No hay cambios para guardar.");
  });

  it("el superadmin da acceso: pasa a ADMIN y entra con su correo", async () => {
    // Arrange
    const created = await createUser({ firstName: "Rosa", lastName: "Farias" });

    // Act
    const response = await grantAccess(created.id, ADMIN_ACCESS);
    const body = await response.json<IBody<IUserData>>();
    const adminCookie = await signIn(ADMIN_ACCESS.email, ADMIN_ACCESS.password);
    const me = await request("/api/v1/me", { headers: { cookie: adminCookie } });

    // Assert
    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ role: "ADMIN", email: ADMIN_ACCESS.email });
    expect((await me.json<IBody<IUserData>>()).data).toMatchObject({ role: "ADMIN", firstName: "Rosa" });
  });

  it("no da acceso dos veces ni con un correo ya usado", async () => {
    // Arrange
    const rosa = (await list()).find((item) => item.firstName === "Rosa")!;
    const other = await createUser({ firstName: "Pedro" });

    // Act
    const again = await grantAccess(rosa.id, { ...ADMIN_ACCESS, email: "otro@test.local" });
    const sameEmail = await grantAccess(other.id, ADMIN_ACCESS);

    // Assert
    expect(again.status).toBe(409);
    expect(await errorOf(again)).toBe("«Rosa Farias» ya tiene acceso.");
    expect(sameEmail.status).toBe(409);
    expect(await errorOf(sameEmail)).toBe("Ya hay alguien que entra con ese correo.");
  });

  it("un administrador registra usuarios pero no da acceso", async () => {
    // Arrange
    const adminCookie = await signIn(ADMIN_ACCESS.email, ADMIN_ACCESS.password);
    const target = await createUser({ firstName: "Marco" });

    // Act
    const created = await create({ firstName: "Registrado por Rosa" }, adminCookie);
    const access = await grantAccess(target.id, { email: "marco@test.local", password: "password123" }, adminCookie);

    // Assert
    expect(created.status).toBe(201);
    expect(access.status).toBe(403);
  });

  it("crea una persona con acceso desde el mismo alta", async () => {
    // Arrange
    const access = { email: "lucia@test.local", password: "password123" };

    // Act
    const response = await create({ firstName: "Lucía", access });
    const body = await response.json<IBody<IUserData>>();
    const cookie = await signIn(access.email, access.password);

    // Assert
    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({ role: "ADMIN", email: access.email });
    expect(cookie).not.toBe("");
  });

  it("no deja crear con acceso si el correo ya está en uso, ni deja a la persona a medias", async () => {
    // Arrange
    const before = (await list()).length;

    // Act
    const response = await create({ firstName: "Repetida", access: ADMIN_ACCESS });

    // Assert
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("Ya hay alguien que entra con ese correo.");
    expect(await list()).toHaveLength(before);
  });

  it("un administrador no puede crear con acceso", async () => {
    // Arrange
    const adminCookie = await signIn(ADMIN_ACCESS.email, ADMIN_ACCESS.password);

    // Act
    const response = await create(
      { firstName: "Intruso", access: { email: "intruso@test.local", password: "password123" } },
      adminCookie,
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it("elimina un usuario, pero no a un administrador", async () => {
    // Arrange
    const created = await createUser({ firstName: "Para eliminar" });
    const rosa = (await list()).find((item) => item.firstName === "Rosa")!;

    // Act
    const deleted = await remove(created.id);
    const blocked = await remove(rosa.id);
    const names = (await list()).map((item) => item.firstName);

    // Assert
    expect(deleted.status).toBe(200);
    expect(names).not.toContain("Para eliminar");
    expect(blocked.status).toBe(403);
    expect(await errorOf(blocked)).toBe("No se puede eliminar a un administrador.");
  });

  it("lista en orden alfabético", async () => {
    const names = (await list()).map((item) => item.firstName.toLowerCase());

    expect(names).toEqual([...names].sort());
  });
});

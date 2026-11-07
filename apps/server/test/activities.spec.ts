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

interface IItemData {
  id: string;
  serial: string;
  price: number;
  buyer: { id: string; firstName: string; neighborhood: { id: string; name: string } | null };
  seller: { id: string; firstName: string };
  note: string | null;
}

const BINGO_NAME = "Bingo II - 2026";
const UNKNOWN_ID = "019a0000-0000-7000-8000-000000000000";

describe("/activities", () => {
  let cookie = "";
  let bingo: IActivityData;
  let buyerId = "";

  const itemsPath = () => `/api/v1/activities/${bingo.id}/items`;

  const createItem = (body: unknown) => postJson(itemsPath(), body, { cookie });

  const listItems = async () => {
    const response = await request(itemsPath(), { headers: { cookie } });
    return (await response.json<IBody<IItemData[]>>()).data;
  };

  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;

  beforeAll(async () => {
    cookie = (await signInAsSuperadmin()).cookie;

    const activities = await request("/api/v1/activities", { headers: { cookie } });
    [bingo] = (await activities.json<IBody<IActivityData[]>>()).data as [IActivityData];

    const buyer = await postJson(
      "/api/v1/users",
      { firstName: "María", lastName: "Flores", neighborhoodId: NEIGHBORHOOD_IDS.EL_PATIO },
      { cookie },
    );
    buyerId = (await buyer.json<IBody<{ id: string }>>()).data.id;
  });

  it("exige sesión", async () => {
    const response = await request("/api/v1/activities");

    expect(response.status).toBe(401);
  });

  it("la migración crea el Bingo II del 21 de noviembre a S/ 10", () => {
    expect(bingo).toMatchObject({
      name: BINGO_NAME,
      type: "BINGO",
      eventDate: "2026-11-21",
      defaultPrice: 10,
    });
  });

  it("vende una cartilla al precio del bingo, con quien la vendió y el barrio del comprador", async () => {
    // Act
    const response = await createItem({ serial: " 0125 ", buyerId, note: null });
    const body = await response.json<IBody<IItemData>>();

    // Assert
    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      serial: "0125",
      price: 10,
      buyer: { id: buyerId, firstName: "María", neighborhood: { name: "El Patio" } },
      seller: { firstName: "Super Test" },
    });
  });

  it("deja guardar una serie repetida", async () => {
    // Arrange
    await createItem({ serial: "0300", buyerId });

    // Act
    const response = await createItem({ serial: "0300", buyerId });

    // Assert
    expect(response.status).toBe(201);
    const repeated = (await listItems()).filter((item) => item.serial === "0300");
    expect(repeated).toHaveLength(2);
  });

  it("cambia el precio de una sola cartilla", async () => {
    // Arrange
    const created = await createItem({ serial: "0410", buyerId });
    const { id } = (await created.json<IBody<IItemData>>()).data;

    // Act
    const response = await patchJson(`${itemsPath()}/${id}`, { price: 8.5 }, { cookie });

    // Assert
    expect(response.status).toBe(200);
    expect((await response.json<IBody<IItemData>>()).data.price).toBe(8.5);
  });

  it("elimina una cartilla", async () => {
    // Arrange
    const created = await createItem({ serial: "0500", buyerId });
    const { id } = (await created.json<IBody<IItemData>>()).data;

    // Act
    const response = await request(`${itemsPath()}/${id}`, { method: "DELETE", headers: { cookie } });

    // Assert
    expect(response.status).toBe(200);
    expect((await listItems()).some((item) => item.id === id)).toBe(false);
  });

  it("pide la serie y un comprador que exista", async () => {
    const withoutSerial = await createItem({ serial: "  ", buyerId });
    const unknownBuyer = await createItem({ serial: "0600", buyerId: UNKNOWN_ID });

    expect(withoutSerial.status).toBe(400);
    expect(await errorOf(withoutSerial)).toBe("Escribe la serie.");
    expect(unknownBuyer.status).toBe(400);
    expect(await errorOf(unknownBuyer)).toBe("No encontramos a quien lo compró.");
  });

  it("responde 404 si la actividad no existe", async () => {
    const response = await request(`/api/v1/activities/${UNKNOWN_ID}/items`, { headers: { cookie } });

    expect(response.status).toBe(404);
  });

  it("no deja eliminar a una persona que compró cartillas", async () => {
    const response = await request(`/api/v1/users/${buyerId}`, { method: "DELETE", headers: { cookie } });

    expect(response.status).toBe(409);
  });
});

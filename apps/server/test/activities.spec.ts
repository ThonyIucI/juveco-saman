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
  paidAmount: number;
  buyer: { id: string; firstName: string; neighborhood: { id: string; name: string } | null };
  seller: { id: string; firstName: string };
  note: string | null;
}

interface IPaymentData {
  id: string;
  amount: number;
  method: string;
  collector: { firstName: string };
}

interface ISummaryData {
  itemCount: number;
  expected: number;
  collected: number;
  collectedByMethod: { YAPE: number; CASH: number };
  pending: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
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

  describe("pagos", () => {
    const paymentsPath = (itemId: string) => `${itemsPath()}/${itemId}/payments`;

    const newItem = async (serial: string) => {
      const created = await createItem({ serial, buyerId });
      return (await created.json<IBody<IItemData>>()).data;
    };

    const pay = (itemId: string, body: unknown) => postJson(paymentsPath(itemId), body, { cookie });

    it("registra un pago parcial y el ítem queda con lo pagado", async () => {
      // Arrange
      const item = await newItem("0700");

      // Act
      const response = await pay(item.id, { amount: 4, method: "YAPE" });
      const body = await response.json<IBody<{ payment: IPaymentData; item: IItemData }>>();

      // Assert
      expect(response.status).toBe(201);
      expect(body.data.payment).toMatchObject({ amount: 4, method: "YAPE", collector: { firstName: "Super Test" } });
      expect(body.data.item.paidAmount).toBe(4);
    });

    it("no deja pagar más de lo que falta ni pagar algo ya pagado", async () => {
      // Arrange
      const item = await newItem("0710");
      await pay(item.id, { amount: 6, method: "CASH" });

      // Act
      const over = await pay(item.id, { amount: 5, method: "CASH" });
      await pay(item.id, { amount: 4, method: "CASH" });
      const alreadyPaid = await pay(item.id, { amount: 1, method: "CASH" });

      // Assert
      expect(over.status).toBe(400);
      expect(await errorOf(over)).toBe("El pago no puede pasar de lo que falta cobrar: S/ 4.00.");
      expect(alreadyPaid.status).toBe(400);
      expect(await errorOf(alreadyPaid)).toBe("Ya está pagado: no hay nada por cobrar.");
    });

    it("pide cómo pagó", async () => {
      const item = await newItem("0720");

      const response = await pay(item.id, { amount: 2, method: "TARJETA" });

      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe("Elige cómo pagó.");
    });

    it("elimina un pago y vuelve a quedar por cobrar", async () => {
      // Arrange
      const item = await newItem("0730");
      const created = await pay(item.id, { amount: 10, method: "YAPE" });
      const { payment } = (await created.json<IBody<{ payment: IPaymentData }>>()).data;

      // Act
      const response = await request(`${paymentsPath(item.id)}/${payment.id}`, {
        method: "DELETE",
        headers: { cookie },
      });

      // Assert
      expect(response.status).toBe(200);
      expect((await response.json<IBody<{ item: IItemData }>>()).data.item.paidAmount).toBe(0);
    });

    it("no deja eliminar un ítem con pagos ni bajar su precio de lo pagado", async () => {
      // Arrange
      const item = await newItem("0740");
      await pay(item.id, { amount: 6, method: "YAPE" });

      // Act
      const deleted = await request(`${itemsPath()}/${item.id}`, { method: "DELETE", headers: { cookie } });
      const cheaper = await patchJson(`${itemsPath()}/${item.id}`, { price: 5 }, { cookie });

      // Assert
      expect(deleted.status).toBe(409);
      expect(cheaper.status).toBe(400);
      expect(await errorOf(cheaper)).toBe("El precio no puede ser menor que lo que ya pagó: S/ 6.00.");
    });

    it("el resumen suma lo vendido, lo recaudado por método y lo que falta", async () => {
      // Act
      const response = await request(`/api/v1/activities/${bingo.id}/summary`, { headers: { cookie } });
      const summary = (await response.json<IBody<ISummaryData>>()).data;
      const items = await listItems();

      // Assert
      expect(response.status).toBe(200);
      const expected = items.reduce((sum, item) => sum + item.price, 0);
      const collected = items.reduce((sum, item) => sum + item.paidAmount, 0);
      expect(summary.itemCount).toBe(items.length);
      expect(summary.expected).toBeCloseTo(expected);
      expect(summary.collected).toBeCloseTo(collected);
      expect(summary.collectedByMethod.YAPE + summary.collectedByMethod.CASH).toBeCloseTo(collected);
      expect(summary.pending).toBeCloseTo(expected - collected);
      expect(summary.paidCount + summary.partialCount + summary.unpaidCount).toBe(items.length);
    });
  });

  it("no deja eliminar a una persona que compró cartillas", async () => {
    const response = await request(`/api/v1/users/${buyerId}`, { method: "DELETE", headers: { cookie } });

    expect(response.status).toBe(409);
  });
});

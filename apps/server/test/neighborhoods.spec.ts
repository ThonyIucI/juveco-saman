import { NEIGHBORHOODS } from "@juveco/shared/neighborhoods";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("barrios", () => {
  it("la migración carga exactamente los barrios de las constantes", async () => {
    // Act
    const { results } = await env.DB.prepare("SELECT id, name FROM neighborhoods ORDER BY name").all<{
      id: string;
      name: string;
    }>();

    // Assert
    const expected = [...NEIGHBORHOODS].sort((first, second) => first.name.localeCompare(second.name));
    expect(results).toEqual(expected.map(({ id, name }) => ({ id, name })));
  });
});

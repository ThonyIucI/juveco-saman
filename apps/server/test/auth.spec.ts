import { describe, expect, it } from "vitest";

import { postJson, request, seedSuperadmin, signInAsSuperadmin } from "./helpers";

describe("health", () => {
  it("responde con el sobre estándar", async () => {
    // Act
    const response = await request("/api/v1/health");
    const body = await response.json<{ success: boolean; data: { status: string } }>();

    // Assert
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
  });

  it("devuelve 404 con mensaje en español para rutas desconocidas", async () => {
    const response = await request("/api/v1/no-existe");
    const body = await response.json<{ success: boolean; error: string }>();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Recurso no encontrado.");
  });
});

describe("registro público", () => {
  it("bloquea sign-up por email", async () => {
    const response = await postJson("/api/auth/sign-up/email", {
      email: "x@test.local",
      password: "password123",
      name: "X",
    });

    expect(response.status).toBe(403);
  });
});

describe("seed de superadmin", () => {
  it("rechaza sin token", async () => {
    const response = await postJson("/api/v1/internal/seed-superadmin", {
      email: "ana@test.local",
      password: "password123",
      name: "Ana",
    });

    expect(response.status).toBe(403);
  });

  it("valida el cuerpo cuando el token es correcto", async () => {
    const response = await seedSuperadmin({ email: "no-es-correo", password: "corta", name: "B" });

    expect(response.status).toBe(400);
  });

  it("crea el superadmin, permite iniciar sesión y /me devuelve rol SUPERADMIN", async () => {
    // Arrange
    const { cookie } = await signInAsSuperadmin();
    expect(cookie).not.toBe("");

    // Act
    const response = await request("/api/v1/me", { headers: { cookie } });
    const body = await response.json<{ data: { role: string; email: string } }>();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.role).toBe("SUPERADMIN");
    expect(body.data.email).toBe("super@test.local");
  });

  it("es idempotente: segunda llamada no crea otro usuario", async () => {
    const payload = { email: "beto@test.local", password: "password123", name: "Beto" };

    const first = await seedSuperadmin(payload);
    const second = await seedSuperadmin(payload);
    const firstBody = await first.json<{ data: { id: string; created: boolean } }>();
    const secondBody = await second.json<{ data: { id: string; created: boolean } }>();

    expect(firstBody.data.created).toBe(true);
    expect(secondBody.data.created).toBe(false);
    expect(secondBody.data.id).toBe(firstBody.data.id);
  });
});

describe("errores en español", () => {
  it("traduce el error de better-auth al iniciar sesión con datos incorrectos", async () => {
    // Arrange
    await signInAsSuperadmin();

    // Act
    const response = await postJson("/api/auth/sign-in/email", {
      email: "super@test.local",
      password: "otra-contraseña",
    });
    const body = await response.json<{ code: string; message: string }>();

    // Assert
    expect(response.status).toBe(401);
    expect(body.code).toBe("INVALID_EMAIL_OR_PASSWORD");
    expect(body.message).toBe("Correo o contraseña incorrectos.");
  });

  it("un cuerpo inválido responde el sobre estándar con el mensaje del esquema", async () => {
    const response = await seedSuperadmin({ email: "no-es-correo", password: "password123", name: "Ana" });
    const body = await response.json<{ success: boolean; data: null; error: string }>();

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, data: null, error: "Correo inválido." });
  });

  it("un campo faltante sin mensaje propio sale en español", async () => {
    const response = await seedSuperadmin({ email: "ana@test.local" } as never);
    const body = await response.json<{ error: string }>();

    expect(response.status).toBe(400);
    expect(body.error).not.toMatch(/invalid|expected|required/i);
  });
});

describe("/me", () => {
  it("exige sesión", async () => {
    const response = await request("/api/v1/me");
    const body = await response.json<{ error: string }>();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Debes iniciar sesión.");
  });
});

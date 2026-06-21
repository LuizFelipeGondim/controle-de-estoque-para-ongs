import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { db } from "../database.js";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

describe("Auth Routes", () => {
  beforeAll(async () => {
    await app.ready();
    const password_hash = await bcrypt.hash("senha123", 10);
    await db("users").insert({
      id: randomUUID(),
      name: "Test User",
      email: "test@example.com",
      password_hash
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to login with valid credentials", async () => {
    const response = await request(app.server)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "senha123"
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Login realizado com sucesso!");
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("should not be able to login with wrong password", async () => {
    const response = await request(app.server)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword"
      });

    expect(response.status).toBe(401);
  });

  it("should not be able to login with non-existing email", async () => {
    const response = await request(app.server)
      .post("/auth/login")
      .send({
        email: "notfound@example.com",
        password: "senha123"
      });

    expect(response.status).toBe(401);
  });

  it("should return 400 for invalid payload", async () => {
    const response = await request(app.server)
      .post("/auth/login")
      .send({
        email: "not-an-email"
      });

    expect(response.status).toBe(400);
  });

  it("should be able to logout", async () => {
    const loginResponse = await request(app.server)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "senha123"
      });

    const cookie = (loginResponse.headers["set-cookie"] as unknown) as string[];

    const response = await request(app.server)
      .post("/auth/logout")
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
  });

  it("should block logout without session", async () => {
    const response = await request(app.server)
      .post("/auth/logout");

    expect(response.status).toBe(401);
  });
});

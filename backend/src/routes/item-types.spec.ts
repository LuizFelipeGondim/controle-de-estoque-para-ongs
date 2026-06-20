import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { db } from "../database.js";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";

describe("Item Types Routes", () => {
  let sessionId: string;

  beforeAll(async () => {
    await app.ready();
    sessionId = randomUUID();
    const password_hash = await bcrypt.hash("123", 10);
    await db("users").insert({ id: sessionId, name: "Test User", email: "itemtypes@test.com", password_hash });
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to create a new item type", async () => {
    const response = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Arroz",
        category: "cereal",
        unit_of_measure: "kg",
        min_stock_level: 10,
        is_essential: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("should fail to create with invalid data", async () => {
    const response = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "",
        category: "invalid-category"
      });

    expect(response.status).toBe(400);
  });

  it("should be able to list item types", async () => {
    await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Feijão",
        category: "grão",
        unit_of_measure: "kg",
      });

    const response = await request(app.server)
      .get("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Feijão" }),
      ])
    );
  });

  it("should be able to get an item type by id", async () => {
    const createResponse = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Macarrão",
        category: "massa",
        unit_of_measure: "kg",
      });

    const { id } = createResponse.body;

    const response = await request(app.server)
      .get(`/items/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("name", "Macarrão");
  });

  it("should return 404 for non-existing item type by id", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await request(app.server)
      .get(`/items/${fakeId}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(404);
  });

  it("should be able to edit an item type", async () => {
    const createResponse = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Leite Antigo",
        category: "laticínio",
        unit_of_measure: "litro",
        min_stock_level: 0,
        is_essential: false,
        nutritional_info: "",
        conversion_factor: 1,
      });

    const { id } = createResponse.body;

    const response = await request(app.server)
      .put(`/items/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Leite Integral",
        category: "laticínio",
        unit_of_measure: "litro",
        min_stock_level: 5,
        is_essential: true,
        nutritional_info: "Calcio",
        conversion_factor: 1,
      });

    expect(response.status).toBe(204);

    const getResponse = await request(app.server)
      .get(`/items/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(getResponse.body).toHaveProperty("name", "Leite Integral");
    expect(getResponse.body).toHaveProperty("is_essential", 1);
  });

  it("should return 404 editing non-existing item", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await request(app.server)
      .put(`/items/${fakeId}`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Leite Integral",
        category: "laticínio",
        unit_of_measure: "litro",
        min_stock_level: 5,
        is_essential: true,
        nutritional_info: "Calcio",
        conversion_factor: 1,
      });

    expect(response.status).toBe(404);
  });

  it("should be able to delete an item type", async () => {
    const createResponse = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Óleo de Soja",
        category: "óleo",
        unit_of_measure: "litro",
      });

    const { id } = createResponse.body;

    const deleteResponse = await request(app.server)
      .delete(`/items/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app.server)
      .get(`/items/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(getResponse.status).toBe(404);
  });

  it("should return 404 deleting non-existing item", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await request(app.server)
      .delete(`/items/${fakeId}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid item type id on get", async () => {
    const response = await request(app.server)
      .get("/items/invalid-uuid")
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid item type id on delete", async () => {
    const response = await request(app.server)
      .delete("/items/invalid-uuid")
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid item type id on update", async () => {
    const response = await request(app.server)
      .put("/items/invalid-uuid")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Test",
        category: "massa",
        unit_of_measure: "kg",
        min_stock_level: 5,
        is_essential: true,
        nutritional_info: "",
        conversion_factor: 1,
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid data on update", async () => {
    const fakeId = randomUUID();
    const response = await request(app.server)
      .put(`/items/${fakeId}`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "",
        category: "invalid-category",
      });

    expect(response.status).toBe(400);
  });

  it("should return 409 when trying to delete item type linked to a batch", async () => {
    const itemRes = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Tipo com Lote Vinculado",
        category: "cereal",
        unit_of_measure: "kg",
      });
    const itemId = itemRes.body.id;

    await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemId,
        initial_quantity: 10,
        expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      });

    const deleteRes = await request(app.server)
      .delete(`/items/${itemId}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(deleteRes.status).toBe(409);
  });
});

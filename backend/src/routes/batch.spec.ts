import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { db } from "../database.js";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";

describe("Batch Routes", () => {
  let itemTypeId: string;
  let sessionId: string;

  beforeAll(async () => {
    await app.ready();
    sessionId = randomUUID();
    const password_hash = await bcrypt.hash("123", 10);
    await db("users").insert({ id: sessionId, name: "Test User", email: "batch@test.com", password_hash });
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to create a batch", async () => {
    const itemTypeResponse = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Lentilha",
        category: "grão",
        unit_of_measure: "kg",
      });
    
    itemTypeId = itemTypeResponse.body.id;

    const response = await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemTypeId,
        initial_quantity: 50,
        expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("should block creating a batch with negative quantity", async () => {
    const response = await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemTypeId,
        initial_quantity: -10,
        expiration_date: new Date().toISOString()
      });

    expect(response.status).toBe(400);
  });

  it("should be able to list batches with item details", async () => {
    const response = await request(app.server)
      .get("/batch")
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          initial_quantity: 50,
          item_name: "Lentilha"
        }),
      ])
    );
  });

  it("should be able to list batches with filters", async () => {
    const response = await request(app.server)
      .get("/batch")
      .query({
        item_type_id: itemTypeId,
        status: "disponivel",
        expiration_from: new Date().toISOString(),
        expiration_to: new Date(Date.now() + 1000000000).toISOString(),
        category: "grão",
        is_essential: "false",
        nutritional_info: "ferro"
      })
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
  });

  it("should be able to get batch by id", async () => {
    const createResponse = await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemTypeId,
        initial_quantity: 100,
        expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      });

    const { id } = createResponse.body;

    const response = await request(app.server)
      .get(`/batch/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("initial_quantity", 100);
    expect(response.body).toHaveProperty("item_name", "Lentilha");
  });

  it("should be able to update batch quantity", async () => {
    const createResponse = await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemTypeId,
        initial_quantity: 10,
        expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      });

    const { id } = createResponse.body;

    const response = await request(app.server)
      .patch(`/batch/${id}/quantity`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        current_quantity: 5
      });

    expect(response.status).toBe(200);

    const getResponse = await request(app.server)
      .get(`/batch/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(getResponse.body).toHaveProperty("current_quantity", 5);
    expect(getResponse.body).toHaveProperty("status", "disponivel");
  });

  it("should mark batch as 'esgotado' when quantity reaches 0", async () => {
    const createResponse = await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemTypeId,
        initial_quantity: 10,
        expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      });

    const { id } = createResponse.body;

    await request(app.server)
      .patch(`/batch/${id}/quantity`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        current_quantity: 0
      });

    const getResponse = await request(app.server)
      .get(`/batch/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(getResponse.body).toHaveProperty("current_quantity", 0);
    expect(getResponse.body).toHaveProperty("status", "esgotado");

    const errorResponse = await request(app.server)
      .patch(`/batch/${id}/quantity`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ current_quantity: 10 });
    
    expect(errorResponse.status).toBe(403);
  });

  it("should be able to delete a batch", async () => {
    const createResponse = await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemTypeId,
        initial_quantity: 10,
        expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      });

    const { id } = createResponse.body;

    const deleteResponse = await request(app.server)
      .delete(`/batch/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app.server)
      .get(`/batch/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(getResponse.status).toBe(404);
  });

  it("should return 400 if filters are invalid", async () => {
    const response = await request(app.server)
      .get("/batch")
      .query({ status: "invalid_status" })
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(400);
  });

  it("should return 400 if batch id is invalid", async () => {
    const response = await request(app.server)
      .get("/batch/invalid-uuid")
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(400);
  });

  it("should return 404 if batch to update is not found", async () => {
    const response = await request(app.server)
      .patch(`/batch/${randomUUID()}/quantity`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ current_quantity: 5 });

    expect(response.status).toBe(404);
  });

  it("should return 400 if update quantity payload is invalid", async () => {
    const response = await request(app.server)
      .patch(`/batch/${randomUUID()}/quantity`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ current_quantity: -5 });

    expect(response.status).toBe(400);
  });

  it("should return 404 if batch to delete is not found", async () => {
    const response = await request(app.server)
      .delete(`/batch/${randomUUID()}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(404);
  });

  it("should return 400 if delete batch id is invalid", async () => {
    const response = await request(app.server)
      .delete("/batch/invalid-uuid")
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(400);
  });

  it("should return 409 if trying to delete a batch linked to donation items", async () => {
    const itemTypeResponse = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Test FK Batch",
        category: "cereal",
        unit_of_measure: "kg",
      });
    const itemId = itemTypeResponse.body.id;

    const batchRes = await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemId,
        initial_quantity: 10,
        expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      });
    const batchId = batchRes.body.id;

    const packetRes = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "Test",
        donation_date: new Date().toISOString()
      });
    const packetId = packetRes.body.id;

    await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: packetId,
        batch_id: batchId,
        quantity_removed: 5
      });

    const deleteRes = await request(app.server)
      .delete(`/batch/${batchId}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(deleteRes.status).toBe(409);
  });
});
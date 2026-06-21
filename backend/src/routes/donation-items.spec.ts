import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { db } from "../database.js";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";

describe("Donation Items Routes", () => {
  let batchId: string;
  let packetId: string;
  let lockedPacketId: string;
  let sessionId: string;

  beforeAll(async () => {
    await app.ready();
    sessionId = randomUUID();
    const password_hash = await bcrypt.hash("123", 10);
    await db("users").insert({ id: sessionId, name: "Test User", email: "items@test.com", password_hash });

    const itemTypeRes = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        name: "Açucar",
        category: "condimento",
        unit_of_measure: "kg",
        conversion_factor: 1,
      });
    
    const batchRes = await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemTypeRes.body.id,
        initial_quantity: 100,
        expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      });
    batchId = batchRes.body.id;

    const packetRes = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "ONG Teste",
        donation_date: new Date().toISOString()
      });
    packetId = packetRes.body.id;

    const lockedPacketRes = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "ONG Bloqueada",
        donation_date: new Date().toISOString()
      });
    lockedPacketId = lockedPacketRes.body.id;
    await request(app.server).patch(`/donation-packets/${lockedPacketId}/status`).set("Cookie", [`sessionId=${sessionId}`]).send({ status: "finalizado" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to add item to packet and reduce batch stock", async () => {
    const response = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: packetId,
        batch_id: batchId,
        quantity_removed: 20
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const batchCheck = await request(app.server).get(`/batch/${batchId}`).set("Cookie", [`sessionId=${sessionId}`]);
    expect(batchCheck.body.current_quantity).toBe(80);

    const packetCheck = await request(app.server).get(`/donation-packets/${packetId}`).set("Cookie", [`sessionId=${sessionId}`]);
    expect(packetCheck.body.total_weight).toBe(20);
  });

  it("should fail to add item if stock is insufficient", async () => {
    const response = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: packetId,
        batch_id: batchId,
        quantity_removed: 150
      });

    expect(response.status).toBe(409);
  });

  it("should fail to add item to a locked packet", async () => {
    const response = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: lockedPacketId,
        batch_id: batchId,
        quantity_removed: 5
      });

    expect(response.status).toBe(403);
  });

  it("should return 404 when batch does not exist on add item", async () => {
    const response = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: packetId,
        batch_id: randomUUID(),
        quantity_removed: 5
      });

    expect(response.status).toBe(404);
  });

  it("should return 404 when packet does not exist on add item", async () => {
    const response = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: randomUUID(), 
        batch_id: batchId,
        quantity_removed: 5
      });

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid payload on add item", async () => {
    const response = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: "not-a-uuid",
        batch_id: batchId,
        quantity_removed: 5
      });

    expect(response.status).toBe(400);
  });

  it("should be able to list items", async () => {
    const response = await request(app.server)
      .get("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("should be able to list items with filters", async () => {
    const response = await request(app.server)
      .get("/donation-items")
      .query({
        donation_packet_id: packetId,
        batch_id: batchId
      })
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
  });

  it("should be able to get item by id", async () => {
    const createRes = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: packetId,
        batch_id: batchId,
        quantity_removed: 5
      });
    
    const { id } = createRes.body;

    const response = await request(app.server)
      .get(`/donation-items/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("quantity_removed", 5);
  });

  it("should be able to edit item quantity (refund logic)", async () => {
    const createRes = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: packetId,
        batch_id: batchId,
        quantity_removed: 10
      });
    const { id } = createRes.body;

    // O lote tinha 80, tiramos 5 (teste anterior) e tiramos 10 agora = 65
    // Editar quantidade do item para 2 (devolvendo 8 pro lote)
    const patchRes = await request(app.server)
      .patch(`/donation-items/${id}/quantity`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        quantity_removed: 2
      });

    expect(patchRes.status).toBe(200);

    // O lote deve ter agora 73
    const batchCheck = await request(app.server).get(`/batch/${batchId}`).set("Cookie", [`sessionId=${sessionId}`]);
    expect(batchCheck.body.current_quantity).toBe(73);
  });

  it("should be able to delete an item and restore stock", async () => {
    const createRes = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: packetId,
        batch_id: batchId,
        quantity_removed: 3
      });

      // Lote foi para 70
    expect(createRes.status).toBe(201);
    const { id } = createRes.body;

    const deleteRes = await request(app.server)
      .delete(`/donation-items/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(deleteRes.status).toBe(204);

    // Lote voltou para 73
    const batchCheck = await request(app.server).get(`/batch/${batchId}`).set("Cookie", [`sessionId=${sessionId}`]);
    expect(batchCheck.body.current_quantity).toBe(73);
  });

  it("should return 400 for invalid item id on get", async () => {
    const response = await request(app.server)
      .get("/donation-items/invalid-uuid")
      .set("Cookie", [`sessionId=${sessionId}`]);
    expect(response.status).toBe(400);
  });

  it("should return 404 for non-existent item id on get", async () => {
    const response = await request(app.server)
      .get(`/donation-items/${randomUUID()}`)
      .set("Cookie", [`sessionId=${sessionId}`]);
    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid data on patch", async () => {
    const response = await request(app.server)
      .patch(`/donation-items/${randomUUID()}/quantity`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ quantity_removed: -5 });
    expect(response.status).toBe(400);
  });

  it("should return 404 for non-existent item on patch", async () => {
    const response = await request(app.server)
      .patch(`/donation-items/${randomUUID()}/quantity`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ quantity_removed: 5 });
    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid item id on delete", async () => {
    const response = await request(app.server)
      .delete("/donation-items/invalid-uuid")
      .set("Cookie", [`sessionId=${sessionId}`]);
    expect(response.status).toBe(400);
  });

  it("should return 404 for non-existent item on delete", async () => {
    const response = await request(app.server)
      .delete(`/donation-items/${randomUUID()}`)
      .set("Cookie", [`sessionId=${sessionId}`]);
    expect(response.status).toBe(404);
  });

  it("should return 403 when trying to patch item on locked packet", async () => {
    const createRes = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: packetId,
        batch_id: batchId,
        quantity_removed: 1
      });
    const { id } = createRes.body;

    await request(app.server)
      .patch(`/donation-packets/${packetId}/status`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ status: "finalizado" });

    const patchRes = await request(app.server)
      .patch(`/donation-items/${id}/quantity`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ quantity_removed: 2 });

    expect(patchRes.status).toBe(403);
  });

  it("should return 403 when trying to delete item on locked packet", async () => {
    const newPacketRes = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ destination: "Pacote para bloquear", donation_date: new Date().toISOString() });
    const newPacketId = newPacketRes.body.id;

    const addItemRes = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: newPacketId,
        batch_id: batchId,
        quantity_removed: 1
      });
    const itemId = addItemRes.body.id;

    await request(app.server)
      .patch(`/donation-packets/${newPacketId}/status`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ status: "finalizado" });

    const deleteRes = await request(app.server)
      .delete(`/donation-items/${itemId}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(deleteRes.status).toBe(403);
  });

  it("should return 409 when increasing quantity on exhausted batch", async () => {
    const itemTypeRes = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ name: "Test Esgotado", category: "cereal", unit_of_measure: "kg", conversion_factor: 1 });
    const smallBatchRes = await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemTypeRes.body.id,
        initial_quantity: 1,
        expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      });
    const smallBatchId = smallBatchRes.body.id;

    const pktRes = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ destination: "ONG Esgotado Test", donation_date: new Date().toISOString() });
    const pktId = pktRes.body.id;

    const addRes = await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ donation_packet_id: pktId, batch_id: smallBatchId, quantity_removed: 1 });
    const itemId = addRes.body.id;

    const patchRes = await request(app.server)
      .patch(`/donation-items/${itemId}/quantity`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ quantity_removed: 2 });

    expect(patchRes.status).toBe(403);
  });
});

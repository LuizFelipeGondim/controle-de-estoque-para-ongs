import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { db } from "../database.js";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";

describe("Donation Packets Routes", () => {
  let sessionId: string;

  beforeAll(async () => {
    await app.ready();
    sessionId = randomUUID();
    const password_hash = await bcrypt.hash("123", 10);
    await db("users").insert({ id: sessionId, name: "Test User", email: "packet@test.com", password_hash });
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to create a donation packet", async () => {
    const response = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "ONG XYZ",
        destination_address: "Rua A, 123",
        notes: "Urgente",
        donation_date: new Date().toISOString()
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("should fail to create without destination", async () => {
    const response = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination_address: "Rua B",
        donation_date: new Date().toISOString()
      });

    expect(response.status).toBe(400);
  });

  it("should be able to list donation packets", async () => {
    await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "Abrigo Esperança",
        donation_date: new Date().toISOString()
      });

    const response = await request(app.server)
      .get("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ destination: "Abrigo Esperança" })
      ])
    );
  });

  it("should be able to list donation packets with filters", async () => {
    const response = await request(app.server)
      .get("/donation-packets")
      .query({
        status: "preparando",
        destination: "Abrigo",
        donation_date_from: new Date(Date.now() - 10000).toISOString(),
        donation_date_to: new Date(Date.now() + 100000).toISOString()
      })
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
  });

  it("should be able to get packet by id", async () => {
    const createResponse = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "Asilo Paz",
        donation_date: new Date().toISOString()
      });

    const { id } = createResponse.body;

    const response = await request(app.server)
      .get(`/donation-packets/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("destination", "Asilo Paz");
  });

  it("should be able to update packet data", async () => {
    const createResponse = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "Asilo Paz",
        donation_date: new Date().toISOString()
      });

    const { id } = createResponse.body;

    const response = await request(app.server)
      .put(`/donation-packets/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "Asilo Alegria",
        notes: "Atualizado"
      });

    expect(response.status).toBe(200);

    const getResponse = await request(app.server)
      .get(`/donation-packets/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(getResponse.body).toHaveProperty("destination", "Asilo Alegria");
    expect(getResponse.body).toHaveProperty("notes", "Atualizado");
  });

  it("should be able to change packet status", async () => {
    const createResponse = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "Lar das Crianças",
        donation_date: new Date().toISOString()
      });

    const { id } = createResponse.body;

    const response = await request(app.server)
      .patch(`/donation-packets/${id}/status`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        status: "finalizado"
      });

    expect(response.status).toBe(200);

    const editResponse = await request(app.server)
      .put(`/donation-packets/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ destination: "Novo Nome" });
    
    expect(editResponse.status).toBe(403);
  });

  it("should be able to delete an empty packet", async () => {
    const createResponse = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "Para deletar",
        donation_date: new Date().toISOString()
      });

    const { id } = createResponse.body;

    const deleteResponse = await request(app.server)
      .delete(`/donation-packets/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(deleteResponse.status).toBe(204);
  });

  it("should block deleting a finalized packet", async () => {
    const createResponse = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "Finalizado",
        donation_date: new Date().toISOString()
      });

    const { id } = createResponse.body;

    await request(app.server)
      .patch(`/donation-packets/${id}/status`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ status: "finalizado" });

    const deleteResponse = await request(app.server)
      .delete(`/donation-packets/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(deleteResponse.status).toBe(403);
  });

  it("should return 400 for invalid filters on get", async () => {
    const response = await request(app.server)
      .get("/donation-packets")
      .query({ status: "invalid_status" })
      .set("Cookie", [`sessionId=${sessionId}`]);
    expect(response.status).toBe(400);
  });

  it("should return 404 for non-existent packet on get", async () => {
    const response = await request(app.server)
      .get(`/donation-packets/${randomUUID()}`)
      .set("Cookie", [`sessionId=${sessionId}`]);
    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid packet id on get", async () => {
    const response = await request(app.server)
      .get("/donation-packets/invalid-uuid")
      .set("Cookie", [`sessionId=${sessionId}`]);
    expect(response.status).toBe(400);
  });

  it("should return 404 for non-existent packet on patch status", async () => {
    const response = await request(app.server)
      .patch(`/donation-packets/${randomUUID()}/status`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ status: "finalizado" });
    expect(response.status).toBe(404);
  });

  it("should block changing status of a non-preparando packet", async () => {
    const createRes = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ destination: "Test", donation_date: new Date().toISOString() });
    
    const { id } = createRes.body;
    
    await request(app.server)
      .patch(`/donation-packets/${id}/status`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ status: "finalizado" });

    const patchRes = await request(app.server)
      .patch(`/donation-packets/${id}/status`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ status: "cancelado" });
    
    expect(patchRes.status).toBe(403);
  });

  it("should return 400 for invalid data on patch status", async () => {
    const response = await request(app.server)
      .patch(`/donation-packets/${randomUUID()}/status`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ status: "invalid_status" });
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid data on put", async () => {
    const response = await request(app.server)
      .put(`/donation-packets/${randomUUID()}`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ destination: "" });
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid id on delete", async () => {
    const response = await request(app.server)
      .delete("/donation-packets/invalid-uuid")
      .set("Cookie", [`sessionId=${sessionId}`]);
    expect(response.status).toBe(400);
  });

  it("should return 404 for non-existent packet on delete", async () => {
    const response = await request(app.server)
      .delete(`/donation-packets/${randomUUID()}`)
      .set("Cookie", [`sessionId=${sessionId}`]);
    expect(response.status).toBe(404);
  });

  it("should block deleting a cancelled packet", async () => {
    const createResponse = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        destination: "Cancelado para deletar",
        donation_date: new Date().toISOString()
      });
    const { id } = createResponse.body;

    await request(app.server)
      .patch(`/donation-packets/${id}/status`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ status: "cancelado" });

    const deleteResponse = await request(app.server)
      .delete(`/donation-packets/${id}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(deleteResponse.status).toBe(403);
  });

  it("should return 409 when deleting a packet with items linked to it", async () => {
    const itemTypeRes = await request(app.server)
      .post("/items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ name: "Item FK Packet", category: "cereal", unit_of_measure: "kg" });

    const batchRes = await request(app.server)
      .post("/batch")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        item_type_id: itemTypeRes.body.id,
        initial_quantity: 10,
        expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      });

    const packetRes = await request(app.server)
      .post("/donation-packets")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ destination: "Pacote com itens", donation_date: new Date().toISOString() });
    const packetId = packetRes.body.id;

    await request(app.server)
      .post("/donation-items")
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({
        donation_packet_id: packetId,
        batch_id: batchRes.body.id,
        quantity_removed: 5
      });

    const deleteRes = await request(app.server)
      .delete(`/donation-packets/${packetId}`)
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(deleteRes.status).toBe(409);
  });

  it("should be able to list packets with destination filter", async () => {
    const response = await request(app.server)
      .get("/donation-packets")
      .query({ destination: "ONG XYZ" })
      .set("Cookie", [`sessionId=${sessionId}`]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ destination: "ONG XYZ" })
      ])
    );
  });

  it("should return 404 for non-existent packet on put", async () => {
    const response = await request(app.server)
      .put(`/donation-packets/${randomUUID()}`)
      .set("Cookie", [`sessionId=${sessionId}`])
      .send({ destination: "Novo Destino" });
    expect(response.status).toBe(404);
  });
});

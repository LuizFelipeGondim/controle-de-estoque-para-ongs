import type { FastifyInstance } from "fastify";
import { db } from "../database.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists.js";

export async function donationItemsRoutes(app: FastifyInstance) {
  // POST /donation-items - Adiciona um item ao pacote
  app.post("/", { 
    preHandler: [checkSessionIdExists] 
  }, async (request, reply) => {
    const createItemSchema = z.object({
      donation_packet_id: z.uuid("ID do pacote inválido."),
      batch_id: z.uuid("ID do lote inválido."),
      quantity_removed: z.number().positive("A quantidade adicionada deve ser superior a zero."),
    });

    const trx = await db.transaction();

    try {
      const data = createItemSchema.parse(request.body);

      const packet = await trx("donation_packets").where("id", data.donation_packet_id).first();
      if (!packet) throw new Error("PACKET_NOT_FOUND");
      if (packet.status !== "preparando") throw new Error("PACKET_LOCKED");

      const batchFull = await trx("batches")
        .join("item_types", "batches.item_type_id", "=", "item_types.id")
        .where("batches.id", data.batch_id)
        .select("batches.*", "item_types.conversion_factor")
        .first();

      if (!batchFull) throw new Error("BATCH_NOT_FOUND");
      if (batchFull.status !== "disponivel") throw new Error("BATCH_UNAVAILABLE");
      if (batchFull.current_quantity < data.quantity_removed) throw new Error("INSUFFICIENT_STOCK");

      const newBatchQuantity = batchFull.current_quantity - data.quantity_removed;
      const newBatchStatus = newBatchQuantity === 0 ? "esgotado" : batchFull.status;

      await trx("batches").where("id", data.batch_id).update({
        current_quantity: newBatchQuantity,
        status: newBatchStatus,
      });

      const id = randomUUID();
      await trx("donation_items").insert({
        id,
        donation_packet_id: data.donation_packet_id,
        batch_id: data.batch_id,
        quantity_removed: data.quantity_removed,
      });

      const weightToAdd = data.quantity_removed * batchFull.conversion_factor;
      await trx("donation_packets").where("id", data.donation_packet_id).update({
        total_weight: packet.total_weight + weightToAdd
      });

      await trx.commit();
      return reply.status(201).send({ id, message: "Item atrelado ao pacote com sucesso." });
    } catch (error: any) {
      await trx.rollback();
      if (error instanceof z.ZodError) return reply.status(400).send({ message: "Dados inválidos.", errors: error.flatten() });
      if (error.message === "PACKET_NOT_FOUND") return reply.status(404).send({ message: "Pacote não encontrado." });
      if (error.message === "BATCH_NOT_FOUND") return reply.status(404).send({ message: "Lote não encontrado." });
      if (error.message === "BATCH_UNAVAILABLE") return reply.status(403).send({ message: "O lote selecionado não está mais disponível para retiradas." });
      if (error.message === "PACKET_LOCKED") return reply.status(403).send({ message: "O pacote já foi finalizado ou cancelado e não recebe mais itens." });
      if (error.message === "INSUFFICIENT_STOCK") return reply.status(409).send({ message: "Quantidade solicitada supera o estoque atual do lote." });

      return reply.status(500).send({ message: "Erro interno rotina transacional." });
    }
  });

  // GET /donation-items - Listar itens com filtros opcionais
  app.get("/", { 
    preHandler: [checkSessionIdExists] 
  }, async (request, reply) => {
    const filterSchema = z.object({
      donation_packet_id: z.uuid().optional(),
      batch_id: z.uuid().optional()
    });

    try {
      const filters = filterSchema.parse(request.query);
      let query = db("donation_items").select("*");

      if (filters.donation_packet_id) query = query.where({ donation_packet_id: filters.donation_packet_id });
      if (filters.batch_id) query = query.where({ batch_id: filters.batch_id });

      const items = await query;
      return reply.send(items);
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao listar itens de doação." });
    }
  });

  // GET /donation-items/:id - Buscar detalhes de item específico
  app.get("/:id", { 
    preHandler: [checkSessionIdExists] 
  }, async (request, reply) => {
    const paramSchema = z.object({ id: z.uuid() });
    try {
      const { id } = paramSchema.parse(request.params);
      const item = await db("donation_items").where({ id }).first();
      if (!item) return reply.status(404).send({ message: "Item não encontrado." });
      return reply.send(item);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: "ID inválido." });
      return reply.status(500).send({ message: "Erro ao buscar detalhes do item." });
    }
  });

  // PATCH /donation-items/:id/quantity - Editar a quantidade (transacional)
  app.patch("/:id/quantity", { 
    preHandler: [checkSessionIdExists] 
  }, async (request, reply) => {
    const paramSchema = z.object({ id: z.uuid() });
    const bodySchema = z.object({ quantity_removed: z.number().positive("Quantidade deve ser maior que zero.") });

    const trx = await db.transaction();
    try {
      const { id } = paramSchema.parse(request.params);
      const { quantity_removed: new_quantity } = bodySchema.parse(request.body);

      const item = await trx("donation_items").where({ id }).first();
      if (!item) throw new Error("ITEM_NOT_FOUND");

      const packet = await trx("donation_packets").where("id", item.donation_packet_id).first();
      if (packet.status !== "preparando") throw new Error("PACKET_LOCKED");

      const batchFull = await trx("batches")
        .join("item_types", "batches.item_type_id", "=", "item_types.id")
        .where("batches.id", item.batch_id)
        .select("batches.*", "item_types.conversion_factor")
        .first();

      // Verifica diferença e limites de estoque
      const diff = new_quantity - item.quantity_removed;
      // Se diff for > 0, estamos querendo pegar mais estoques do Batch. Se < 0, estamos devolvendo ao Batch.
      if (diff > 0 && batchFull.status !== "disponivel") throw new Error("BATCH_UNAVAILABLE");
      if (diff > 0 && batchFull.current_quantity < diff) throw new Error("INSUFFICIENT_STOCK");

      const newBatchQty = batchFull.current_quantity - diff;
      const newBatchStatus = newBatchQty === 0 ? "esgotado" : "disponivel";

      await trx("batches").where("id", batchFull.id).update({
        current_quantity: newBatchQty,
        status: newBatchStatus
      });

      await trx("donation_items").where("id", item.id).update({ quantity_removed: new_quantity });

      const diffWeight = diff * batchFull.conversion_factor;
      await trx("donation_packets").where("id", packet.id).update({
        total_weight: packet.total_weight + diffWeight
      });

      await trx.commit();
      return reply.send({ message: "Quantidade alterada com sucesso." });
    } catch (error: any) {
      await trx.rollback();
      if (error instanceof z.ZodError) return reply.status(400).send({ message: "Dados inválidos.", errors: error.flatten() });
      if (error.message === "ITEM_NOT_FOUND") return reply.status(404).send({ message: "Item não encontrado." });
      if (error.message === "BATCH_UNAVAILABLE") return reply.status(403).send({ message: "O lote se encontra esgotado ou bloqueado para receber mais descontos." });
      if (error.message === "PACKET_LOCKED") return reply.status(403).send({ message: "Pacote já não está em etapa de preparacao." });
      if (error.message === "INSUFFICIENT_STOCK") return reply.status(409).send({ message: "Estoque atual não suporta esse aumento." });
      return reply.status(500).send({ message: "Erro de integridade." });
    }
  });

  // DELETE /donation-items/:id - Deletar item (Devolver estoques e pesos)
  app.delete("/:id", { 
    preHandler: [checkSessionIdExists] 
  }, async (request, reply) => {
    const paramSchema = z.object({ id: z.uuid() });

    const trx = await db.transaction();
    try {
      const { id } = paramSchema.parse(request.params);

      const item = await trx("donation_items").where({ id }).first();
      if (!item) throw new Error("ITEM_NOT_FOUND");

      const packet = await trx("donation_packets").where("id", item.donation_packet_id).first();
      if (packet.status !== "preparando") throw new Error("PACKET_LOCKED");

      const batchFull = await trx("batches")
        .join("item_types", "batches.item_type_id", "=", "item_types.id")
        .where("batches.id", item.batch_id)
        .select("batches.*", "item_types.conversion_factor")
        .first();

      await trx("batches").where("id", batchFull.id).update({
        current_quantity: batchFull.current_quantity + item.quantity_removed,
        status: "disponivel" 
      });

      const weightToSub = item.quantity_removed * batchFull.conversion_factor;
      await trx("donation_packets").where("id", packet.id).update({
        total_weight: packet.total_weight - weightToSub
      });

      await trx("donation_items").where("id", id).delete();

      await trx.commit();
      return reply.status(204).send();
    } catch (error: any) {
      await trx.rollback();
      if (error instanceof z.ZodError) return reply.status(400).send({ message: "ID inválido.", errors: error.flatten() });
      if (error.message === "ITEM_NOT_FOUND") return reply.status(404).send({ message: "Item não encontrado." });
      if (error.message === "PACKET_LOCKED") return reply.status(403).send({ message: "O pacote não está em preparação, itens não podem ser estornados manualmente ou apagados." });
      return reply.status(500).send({ message: "Falha final." });
    }
  });
}
import type { FastifyInstance } from "fastify";
import { db } from "../database.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export async function batchRoutes(app: FastifyInstance) {
  // POST /batches - Registro de Entrada de Doação
  app.post("/", async (request, reply) => {
    const createBatchSchema = z.object({
      item_type_id: z.uuid("Formato de ID de item_type inválido"),
      received_by: z.uuid("Formato de ID de usuário inválido"), // Posteriormente será extraído do token JWT
      initial_quantity: z.number().positive("A quantidade deve ser maior que zero"),
      expiration_date: z.iso.datetime({ message: "A data de validade deve ser uma string ISO válida" }),
    });

    try {
      const data = createBatchSchema.parse(request.body);
      const id = randomUUID();

      await db("batches").insert({
        id,
        item_type_id: data.item_type_id,
        received_by: data.received_by,
        initial_quantity: data.initial_quantity,
        current_quantity: data.initial_quantity, // Iguala a original no recebimento
        expiration_date: data.expiration_date,
        status: "disponivel",
      });

      return reply.status(201).send({ id, message: "Lote registrado com sucesso." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Erro de validação", errors: error.flatten() });
      }

      console.error(error);
      return reply.status(500).send({ message: "Erro interno no servidor ao registrar lote." });
    }
  });

  // GET /batches - Listar todos os lotes com o nome do item
  app.get("/", async (request, reply) => {
    try {
      const batches = await db("batches")
        .join("item_types", "batches.item_type_id", "=", "item_types.id")
        .select(
          "batches.*",
          "item_types.name as item_name"
        );
        
      return reply.send(batches);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: "Erro ao listar lotes." });
    }
  });

  // PATCH /batches/:id/quantity - Edição focada na Quantidade do Lote
  app.patch("/:id/quantity", async (request, reply) => {

    const paramSchema = z.object({ id: z.uuid("ID de lote inválido") });
    const updateQuantitySchema = z.object({
      current_quantity: z.number().nonnegative("A quantidade atual não pode estar negativa"),
    });

    try {
      const { id } = paramSchema.parse(request.params);
      const { current_quantity } = updateQuantitySchema.parse(request.body);

      const batch = await db("batches").where({ id }).first();
      if (!batch) {
        return reply.status(404).send({ message: "Lote não encontrado." });
      }

      if (batch.status === "esgotado" || batch.status === "vencido") {
        return reply.status(403).send({ message: "Não é possível alterar a quantidade de um lote esgotado ou vencido." });
      }

      const newStatus = current_quantity === 0 ? "esgotado" : batch.status;

      await db("batches").where({ id }).update({
        current_quantity,
        status: newStatus,
        updated_at: db.fn.now()
      });

      return reply.send({ message: "Quantidade atualizada com sucesso." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Valores inválidos", errors: error.format() });
      }
      return reply.status(500).send({ message: "Erro de processamento interno." });
    }
  });

  // PATCH /batches/:id/status - Edição focada no Status do Lote
  app.patch("/:id/status", async (request, reply) => {
    const paramSchema = z.object({ id: z.string().uuid("ID de lote inválido") });
    const updateStatusSchema = z.object({
      status: z.enum(["disponivel", "reservado", "esgotado", "vencido"], {
        message: "O status fornecido é inválido. Opções: disponivel, reservado, esgotado, vencido"
      }),
    });

    try {
      const { id } = paramSchema.parse(request.params);
      const { status } = updateStatusSchema.parse(request.body);

      const batch = await db("batches").where({ id }).first();
      if (!batch) {
        return reply.status(404).send({ message: "Lote não encontrado." });
      }

      if (batch.status === "esgotado" || batch.status === "vencido") {
        return reply.status(403).send({ message: "Lotes esgotados ou vencidos não podem ter o seu status modificado manualmente." });
      }

      await db("batches").where({ id }).update({
        status,
        updated_at: db.fn.now()
      });

      return reply.send({ message: `Status alterado para ${status} com sucesso.` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Status repassado inválido.", errors: error.format() });
      }
      return reply.status(500).send({ message: "Erro de processamento interno." });
    }
  });

  // DELETE /batches/:id - Remoção Completa com verificação de Foreign Key
  app.delete("/:id", async (request, reply) => {
    const paramSchema = z.object({ id: z.string().uuid("ID de lote inválido") });

    try {
      const { id } = paramSchema.parse(request.params);

      const batch = await db("batches").where({ id }).first();
      if (!batch) {
        return reply.status(404).send({ message: "Lote não encontrado ou já deletado." });
      }

      await db("batches").where({ id }).delete();

      return reply.status(204).send();
    } catch (error: any) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: "Payload ID de remoção inválido", errors: error.format() });

      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || error.message.includes('FOREIGN KEY constraint failed')) {
        return reply.status(409).send({
          message: "Este lote não pode ser deletado pois já está atrelado a registros de doações (donation_items). Delete a doação primeiro."
        });
      }

      return reply.status(500).send({ message: "Erro ao tentar deletar o lote." });
    }
  });
}
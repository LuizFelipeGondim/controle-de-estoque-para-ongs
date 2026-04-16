import type { FastifyInstance } from "fastify";
import { db } from "../database.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists.js";

export async function batchRoutes(app: FastifyInstance) {
  // POST /batches - Registro de Entrada de Doação
  app.post("/", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const createBatchSchema = z.object({
      item_type_id: z.uuid("Formato de ID de item_type inválido."),
      initial_quantity: z.number().positive("A quantidade deve ser maior que zero."),
      expiration_date: z.iso.datetime({ message: "A data de validade deve ser uma string ISO válida." }),
    });

    try {
      const data = createBatchSchema.parse(request.body);
      const id = randomUUID();
      const { sessionId } = request.cookies;

      await db("batches").insert({
        id,
        item_type_id: data.item_type_id,
        received_by: sessionId,
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

      return reply.status(500).send({ message: "Erro interno no servidor ao registrar lote." });
    }
  });

  // GET /batches - Listar todos os lotes com o nome do item (e suporte a filtros)
  app.get("/", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const filterQuerySchema = z.object({
      item_type_id: z.uuid("Formato de ID de item_type inválido.").optional(),
      expiration_from: z.coerce.date().optional(),
      expiration_to: z.coerce.date().optional(),
      status: z.enum(["disponivel", "esgotado"]).optional(),
      category: z.string().optional(),
      is_essential: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
      nutritional_info: z.string().optional(),
    });

    try {
      // 1. Validando a Query String
      const filters = filterQuerySchema.parse(request.query);
      // 2. Iniciando a construção da query no Knex
      let query = db("batches")
        .join("item_types", "batches.item_type_id", "=", "item_types.id")
        .select(
          "batches.*",
          "item_types.name as item_name",
          "item_types.category as item_category",
          "item_types.unit_of_measure as item_unit_of_measure",
          "item_types.is_essential as item_is_essential",
          "item_types.nutritional_info as item_nutritional_info",
          "item_types.conversion_factor as item_conversion_factor",
          "item_types.min_stock_level as item_min_stock_level",
        );

      // 3. Aplicando os filtros caso eles tenham sido repassados na URL
      if (filters.item_type_id) {
        query = query.where("batches.item_type_id", filters.item_type_id);
      }

      if (filters.status) {
        query = query.where("batches.status", filters.status);
      }

      if (filters.expiration_from) {
        query = query.where("batches.expiration_date", ">=", filters.expiration_from);
      }

      if (filters.expiration_to) {
        query = query.where("batches.expiration_date", "<=", filters.expiration_to);
      }

      if (filters.category) {
        query = query.where("item_types.category", filters.category);
      }

      if (filters.is_essential !== undefined) {
        query = query.where("item_types.is_essential", filters.is_essential);
      }

      if (filters.nutritional_info) {
        query = query.where("item_types.nutritional_info", "like", `%${filters.nutritional_info}%`);
      }

      // Opcional: ordenar pelos que vencem mais cedo primeiro por padrão
      query = query.orderBy("batches.expiration_date", "asc");

      // 4. Aguardando a resolução da query final montada
      const batches = await query;
        
      return reply.send(batches);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Parâmetros de filtro inválidos.", errors: error.flatten() });
      }
      console.error(error);
      return reply.status(500).send({ message: "Erro ao listar lotes." });
    }
  });

  // PATCH /batches/:id/quantity - Edição focada na Quantidade do Lote
  app.patch("/:id/quantity", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {

    const paramSchema = z.object({ id: z.uuid("ID de lote inválido.") });
    const updateQuantitySchema = z.object({
      current_quantity: z.number().nonnegative("A quantidade atual não pode estar negativa."),
    });

    try {
      const { id } = paramSchema.parse(request.params);
      const { current_quantity } = updateQuantitySchema.parse(request.body);

      const batch = await db("batches").where({ id }).first();
      if (!batch) {
        return reply.status(404).send({ message: "Lote não encontrado." });
      }

      if (batch.status === "esgotado") {
        return reply.status(403).send({ message: "Não é possível alterar a quantidade de um lote esgotado." });
      }

      const newStatus = current_quantity === 0 ? "esgotado" : "disponivel";

      await db("batches").where({ id }).update({
        current_quantity,
        status: newStatus,
        updated_at: db.fn.now()
      });

      return reply.send({ message: "Quantidade atualizada com sucesso." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Valores inválidos", errors: error.flatten() });
      }
      return reply.status(500).send({ message: "Erro de processamento interno." });
    }
  });

  // PATCH /batches/:id/status - Edição focada no Status do Lote
  app.patch("/:id/status", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const paramSchema = z.object({ id: z.uuid("ID de lote inválido.") });
    const updateStatusSchema = z.object({
      status: z.enum(["disponivel", "esgotado"], {
        message: "O status fornecido é inválido. Opções: disponivel, esgotado."
      }),
    });

    try {
      const { id } = paramSchema.parse(request.params);
      const { status } = updateStatusSchema.parse(request.body);

      const batch = await db("batches").where({ id }).first();
      if (!batch) {
        return reply.status(404).send({ message: "Lote não encontrado." });
      }

      if (batch.status === "esgotado") {
        return reply.status(403).send({ message: "Lotes esgotados não podem ter o seu status modificado." });
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
  app.delete("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const paramSchema = z.object({ id: z.uuid("ID de lote inválido.") });

    try {
      const { id } = paramSchema.parse(request.params);

      const batch = await db("batches").where({ id }).first();
      if (!batch) {
        return reply.status(404).send({ message: "Lote não encontrado ou já deletado." });
      }

      await db("batches").where({ id }).delete();

      return reply.status(204).send();
    } catch (error: any) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: "Payload ID de remoção inválido.", errors: error.format() });

      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || error.message.includes('FOREIGN KEY constraint failed')) {
        return reply.status(409).send({
          message: "Este lote não pode ser deletado pois já está atrelado a registros de doações (donation_items)."
        });
      }

      return reply.status(500).send({ message: "Erro ao tentar deletar o lote." });
    }
  });
}
import type { FastifyInstance } from "fastify";
import { db } from "../database.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists.js";

const itemTypeCategories = [
  "cereal",
  "grão",
  "massa",
  "óleo",
  "laticínio",
  "hortifrúti",
  "proteína",
  "enlatado",
  "bebida",
  "condimento",
  "outros"
] as const;

export async function itemTypeRoutes(app: FastifyInstance) {
  // POST /items - Criar novo tipo de item
  app.post("/", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const createItemTypeBodySchema = z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      category: z.enum(itemTypeCategories),
      unit_of_measure: z.enum(["kg", "litro", "unidade", "caixa"]),
      min_stock_level: z.number().min(0).default(0),
      is_essential: z.boolean().default(false),
      nutritional_info: z.string().optional(),
      conversion_factor: z.number().positive().default(1),
    });

    try {
      const {
        name,
        category,
        unit_of_measure,
        min_stock_level,
        is_essential,
        nutritional_info,
        conversion_factor,
      } = createItemTypeBodySchema.parse(request.body);

      const id = randomUUID();

      await db("item_types").insert({
        id,
        name,
        category,
        unit_of_measure,
        min_stock_level,
        is_essential,
        nutritional_info,
        conversion_factor,
      });

      return reply.status(201).send({ id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Erro de validação", errors: error.flatten() });
      }
      return reply.status(500).send({ message: "Erro interno no servidor ao criar item." });
    }
  });

  // GET /items - Listar todos os tipos de itens
  app.get("/", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    try {
      const items = await db("item_types").select("*");
      return reply.send(items);
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao listar itens." });
    }
  });

  // GET /items/:id - Buscar tipo de item por ID
  app.get("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const getItemTypeParamsSchema = z.object({
      id: z.uuid(),
    });

    try {
      const { id } = getItemTypeParamsSchema.parse(request.params);

      const item = await db("item_types").where({ id }).first();

      if (!item) {
        return reply.status(404).send({ message: "Item não encontrado." });
      }

      return reply.send(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "ID de item inválido.", errors: error.flatten() });
      }
      
      return reply.status(500).send({ message: "Erro interno no servidor." });
    }
  });

  // DELETE /items/:id - Remover tipo de item por ID
  app.delete("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const deleteItemTypeParamsSchema = z.object({
      id: z.uuid("Formato de ID de item_type inválido"),
    });

    try {
      const { id } = deleteItemTypeParamsSchema.parse(request.params);

      const item = await db("item_types").where({ id }).first();

      if (!item) {
        return reply.status(404).send({ message: "Item não encontrado." });
      }

      await db("item_types").where({ id }).delete();

      return reply.status(204).send();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "ID de item inválido.", errors: error.flatten() });
      }
      
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || error.message.includes('FOREIGN KEY constraint failed')) {
        return reply.status(409).send({
          message: "Este tipo de item não pode ser deletado pois existem lotes ativos vinculados a ele."
        });
      }

      return reply.status(500).send({ message: "Erro ao deletar o item." });
    }
  });

  // PUT /items/:id - Editar tipo de item por ID
  app.put("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const updateItemTypeParamsSchema = z.object({
      id: z.uuid(),
    });

    const updateItemTypeBodySchema = z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      category: z.enum(itemTypeCategories),
      unit_of_measure: z.enum(["kg", "litro", "unidade", "caixa"]),
      min_stock_level: z.number().min(0),
      is_essential: z.boolean(),
      nutritional_info: z.string(),
      conversion_factor: z.number().positive(),
    });

    try {
      const { id } = updateItemTypeParamsSchema.parse(request.params);
      const data = updateItemTypeBodySchema.parse(request.body);

      const item = await db("item_types").where({ id }).first();

      if (!item) {
        return reply.status(404).send({ message: "Item não encontrado." });
      }

      await db("item_types")
        .where({ id })
        .update(data);

      return reply.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Valores inválidos.", errors: error.flatten() });
      }
      return reply.status(500).send({ message: "Erro ao atualizar o item." });
    }
  });
}
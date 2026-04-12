import type { FastifyInstance } from "fastify";
import { db } from "../database.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export async function itemTypeRoutes(app: FastifyInstance) {
  // POST /items - Criar novo tipo de item
  app.post("/", async (request, reply) => {
    const createItemTypeBodySchema = z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      category: z.string().min(1, "Categoria é obrigatória"),
      unit_of_measure: z.enum(["kg", "litro", "unidade", "caixa", "pacote"]),
      min_stock_level: z.number().min(0).default(0),
      is_essential: z.boolean().default(false),
      nutritional_info: z.string().optional(),
      conversion_factor: z.number().positive().default(1),
    });

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
  });

  // GET /items - Listar todos os tipos de itens
  app.get("/", async (request, reply) => {
    const items = await db("item_types").select("*");
    return reply.send(items);
  });

  // GET /items/:id - Buscar tipo de item por ID
  app.get("/:id", async (request, reply) => {
    const getItemTypeParamsSchema = z.object({
      id: z.uuid(),
    });

    const { id } = getItemTypeParamsSchema.parse(request.params);

    const item = await db("item_types").where({ id }).first();

    if (!item) {
      return reply.status(404).send({ error: "Item não encontrado" });
    }

    return reply.send(item);
  });

  // DELETE /items/:id - Remover tipo de item por ID
  app.delete("/:id", async (request, reply) => {
    const deleteItemTypeParamsSchema = z.object({
      id: z.uuid(),
    });

    const { id } = deleteItemTypeParamsSchema.parse(request.params);

    const item = await db("item_types").where({ id }).first();

    if (!item) {
      return reply.status(404).send({ error: "Item não encontrado" });
    }

    await db("item_types").where({ id }).delete();

    return reply.status(204).send();
  });
}
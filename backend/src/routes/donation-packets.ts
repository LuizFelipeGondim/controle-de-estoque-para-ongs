import type { FastifyInstance } from "fastify";
import { db } from "../database.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists.js";

export async function donationPacketRoutes(app: FastifyInstance) {
  // POST /donation-packets - Criar novo pacote
  app.post("/", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const createPacketSchema = z.object({
      destination: z.string().min(1, "Destino é obrigatório"),
      destination_address: z.string().optional(),
      notes: z.string().optional(),
      donation_date: z.iso.datetime({ message: "A data de doação deve ser válida (ISO-8601)." }),
    });

    try {
      const data = createPacketSchema.parse(request.body);
      const id = randomUUID();
      const { sessionId } = request.cookies;

      await db("donation_packets").insert({
        id,
        destination: data.destination,
        destination_address: data.destination_address,
        notes: data.notes,
        donation_date: data.donation_date,
        created_by: sessionId,
        status: "preparando",
        total_weight: 0,
      });

      return reply.status(201).send({ id, message: "Pacote de doação criado com sucesso." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Erro de validação", errors: error.flatten() });
      }
      return reply.status(500).send({ message: "Erro interno ao registrar pacote de doação." });
    }
  });

  // GET /donation-packets - Listar pacotes com filtros opcionais
  app.get("/", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const filterQuerySchema = z.object({
      status: z.enum(["preparando", "finalizado", "cancelado"]).optional(),
      destination: z.string().optional(),
      donation_date_from: z.coerce.date().optional(),
      donation_date_to: z.coerce.date().optional(),
    });

    try {
      const filters = filterQuerySchema.parse(request.query);
      let query = db("donation_packets").select("*");

      if (filters.status) {
        query = query.where("status", filters.status);
      }
      
      if (filters.destination) {
        query = query.where("destination", "like", `%${filters.destination}%`);
      }

      const packets = await query.orderBy("created_at", "desc");
      return reply.send(packets);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Filtros inválidos.", errors: error.flatten() });
      }
      return reply.status(500).send({ message: "Erro interno ao listar pacotes de doação." });
    }
  });

  // GET /donation-packets/:id - Buscar detalhes do pacote
  app.get("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const paramSchema = z.object({ id: z.uuid() });
    
    try {
      const { id } = paramSchema.parse(request.params);
      const packet = await db("donation_packets").where({ id }).first();
      
      if (!packet) {
        return reply.status(404).send({ message: "Pacote de doação não encontrado." });
      }
      
      return reply.send(packet);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: "ID de pacote inválido" });
      return reply.status(500).send({ message: "Erro ao buscar detalhes do pacote." });
    }
  });

  // PATCH /donation-packets/:id/status - Alterar o status do pacote
  app.patch("/:id/status", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const paramSchema = z.object({ id: z.uuid("ID inválido.") });
    const updateSchema = z.object({
      status: z.enum(["finalizado", "cancelado"], {
        message: "Status deve ser 'finalizado' ou 'cancelado'."
      })
    });

    try {
      const { id } = paramSchema.parse(request.params);
      const { status } = updateSchema.parse(request.body);

      const packet = await db("donation_packets").where({ id }).first();
      
      if (!packet) {
        return reply.status(404).send({ message: "Pacote não encontrado." });
      }

      if (packet.status !== "preparando") {
        return reply.status(403).send({ 
          message: `Este pacote já está ${packet.status} e não pode mais ter o status alterado.` 
        });
      }

      await db("donation_packets").where({ id }).update({ status });
      return reply.send({ message: `Status alterado para ${status}.` });
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: "Dados inválidos", errors: error.flatten() });
      return reply.status(500).send({ message: "Erro interno." });
    }
  });

  // PUT /donation-packets/:id - Editar informações gerais
  app.put("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const paramSchema = z.object({ id: z.uuid("ID inválido.") });
    const updateSchema = z.object({
      destination: z.string().min(1, "Destino não pode ser vazio").optional(),
      destination_address: z.string().optional(),
      notes: z.string().optional(),
      donation_date: z.iso.datetime().optional(),
    });

    try {
      const { id } = paramSchema.parse(request.params);
      const data = updateSchema.parse(request.body);

      const packet = await db("donation_packets").where({ id }).first();
      if (!packet) return reply.status(404).send({ message: "Pacote não encontrado." });

      if (packet.status !== "preparando") {
         return reply.status(403).send({ message: "Apenas pacotes 'preparando' podem ter os dados editados." });
      }

      await db("donation_packets").where({ id }).update(data);
      return reply.send({ message: "Informações alteradas com sucesso." });
    } catch(error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: "Dados inválidos", errors: error.flatten() });
      return reply.status(500).send({ message: "Erro interno." });
    }
  });

  // DELETE /donation-packets/:id - Apagar o pacote
  app.delete("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const paramSchema = z.object({ id: z.uuid("ID inválido.") });

    try {
      const { id } = paramSchema.parse(request.params);
      const packet = await db("donation_packets").where({ id }).first();
      
      if (!packet) return reply.status(404).send({ message: "Pacote não encontrado." });

      if (packet.status === "finalizado" || packet.status === "cancelado") {
        return reply.status(403).send({ message: "Não é possível deletar um pacote que já foi finalizado ou cancelado." });
      }

      await db("donation_packets").where({ id }).delete();
      return reply.status(204).send();
    } catch(error: any) {
        if (error instanceof z.ZodError) return reply.status(400).send({ message: "ID inválido.", errors: error.flatten() });
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || error.message.includes('FOREIGN KEY constraint failed')) {
           return reply.status(409).send({ message: "Esse pacote não pode ser deletado pois possui itens atrelados a ele." });
        }
        return reply.status(500).send({ message: "Erro ao deletar pacote." });
    }
  });
}

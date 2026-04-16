import type { FastifyInstance } from "fastify";
import { db } from "../database.js";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists.js";

export async function donationRoutes(app: FastifyInstance) {
  app.get("/teste", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {

    await db("users").insert({
      name: "Luiz",
      email: "luiz@email.com"
    });

    return "Funcionou";
  });
}
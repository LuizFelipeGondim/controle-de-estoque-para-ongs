import type { FastifyInstance } from "fastify";
import { db } from "../database.js";

export async function authRoutes(app: FastifyInstance) {
  app.get("/teste", async (request, reply) => {

    await db("users").insert({
      name: "Luiz",
      email: "luiz@email.com"
    });

    return "Funcionou";
  });
}
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "../database.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string()
    });

    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await db("users").where({ email }).first();

      if (!user) {
        return reply.status(401).send({ message: "E-mail ou senha incorretos." });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return reply.status(401).send({ message: "E-mail ou senha incorretos." });
      }

      const sessionId = user.id;

      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
      });

      return reply.send({ message: "Login realizado com sucesso!" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Dados inválidos.", errors: error.format() });
      }
      return reply.status(500).send({ message: "Erro interno no servidor." });
    }
  });

  app.post("/logout", async (request, reply) => {
    reply.clearCookie("sessionId", { path: "/" });
    return reply.send({ message: "Logout finalizado com sucesso." });
  });
}
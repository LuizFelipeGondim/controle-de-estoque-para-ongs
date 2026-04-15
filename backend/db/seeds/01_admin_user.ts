import type { Knex } from "knex";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { env } from "../../src/env/index.js";

export async function seed(knex: Knex): Promise<void> {
    const existing = await knex("users")
        .where({ email: "admin@ong.com" })
        .first();

    const password = env.ADMIN_PASSWORD || "admin123";

    if (!existing) {
        const password_hash = await bcrypt.hash(password, 10);

        await knex("users").insert({
            id: randomUUID(),
            name: "Administrador ONG",
            email: "admin@ong.com",
            password_hash,
        });
    }
};

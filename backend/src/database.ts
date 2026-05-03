import knex from "knex";
import type { Knex } from "knex"; //Separacao para evitar erros em runtime
import { env } from "./env/index.js";

export const config: Knex.Config = {
  client: "better-sqlite3",
  connection: {
    filename: env.DATABASE_URL
  },
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: "./db/migrations"
  },
  seeds: {
    extension: "ts",
    directory: "./db/seeds"
  }
};

export const db = knex(config);
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("donation_packets", (table) => {
    table.uuid("id").primary();
    table.enu("status", ["preparando", "finalizado", "cancelado"]).notNullable().defaultTo("preparando");
    table.string("destination").notNullable();
    table.string("destination_address");
    table.text("notes");
    table.date("donation_date").notNullable();
    table.uuid("created_by").notNullable().references("id").inTable("users").onDelete("RESTRICT");
    table.float("total_weight").notNullable().defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("donation_packets");
}


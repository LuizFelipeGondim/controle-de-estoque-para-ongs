import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("batches", (table) => {
    table.uuid("id").primary();
    table.float("initial_quantity").notNullable();
    table.float("current_quantity").notNullable();
    table.timestamp("entry_date").notNullable().defaultTo(knex.fn.now());
    table.date("expiration_date");
    table.enu("status", ["disponivel", "reservado", "esgotado", "vencido"]).notNullable().defaultTo("disponivel");
    table.uuid("received_by").notNullable().references("id").inTable("users").onDelete("RESTRICT");
    table.uuid("item_type_id").notNullable().references("id").inTable("item_types").onDelete("RESTRICT");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now()); 
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("batches");
}


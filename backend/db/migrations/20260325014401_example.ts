import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary(); // PK auto-increment
    table.string("name").notNullable();
    table.string("email").unique().notNullable();
    table.timestamps(true, true); // created_at e updated_at
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("users");
}
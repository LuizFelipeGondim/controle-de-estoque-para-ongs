import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("batches", (table) => {
    table.increments("id").primary();
    table.integer("product_id").unsigned().notNullable()
      .references("id").inTable("products").onDelete("CASCADE");
    table.integer("quantity").notNullable();
    table.date("expiry_date").nullable();
    table.date("entry_date").notNullable().defaultTo(knex.fn.now());
    table.decimal("cost_price", 10, 2).nullable();
    table.timestamps(true, true);
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("batches");
}


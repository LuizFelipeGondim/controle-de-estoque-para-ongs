import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("item_types", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.string("category").notNullable();
    table.string("nutritional_info");
    table.float("min_stock_level").notNullable().defaultTo(0);
    table.boolean("is_essential").notNullable().defaultTo(false);
    table.enu("unit_of_measure", ["kg", "litro", "unidade", "caixa", "pacote"]).notNullable();
    table.float("conversion_factor").notNullable().defaultTo(1);
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("item_types");
}
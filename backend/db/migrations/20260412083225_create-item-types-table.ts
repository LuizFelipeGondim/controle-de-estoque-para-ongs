import type { Knex } from "knex";

const itemTypeCategories = [
  "cereal",
  "grão",
  "massa",
  "óleo",
  "laticínio",
  "hortifrúti",
  "proteína",
  "enlatado",
  "bebida",
  "condimento",
  "outros"
];

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("item_types", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.enu("category", itemTypeCategories).notNullable();
    table.string("nutritional_info");
    table.float("min_stock_level").notNullable().defaultTo(0);
    table.boolean("is_essential").notNullable().defaultTo(false);
    table.enu("unit_of_measure", ["kg", "litro", "unidade", "caixa"]).notNullable();
    table.float("conversion_factor").notNullable().defaultTo(1);
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("item_types");
}
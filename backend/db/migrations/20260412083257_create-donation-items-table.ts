import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("donation_items", (table) => {
    table.uuid("id").primary();
    table.uuid("donation_packet_id").notNullable().references("id").inTable("donation_packets").onDelete("RESTRICT"); // Evita que eu remova o item sem devolver o valor retirado do lote
    table.uuid("batch_id").notNullable().references("id").inTable("batches").onDelete("RESTRICT");
    table.float("quantity_removed").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("donation_items");
}
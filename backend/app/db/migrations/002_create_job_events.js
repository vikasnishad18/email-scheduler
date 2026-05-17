exports.up = function (knex) {
  return knex.schema.createTable("job_events", function (table) {
    table.increments("id").primary();
    table.string("job_id").notNullable();
    table.string("event_type").notNullable();
    table.jsonb("data");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("job_events");
};

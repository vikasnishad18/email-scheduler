exports.up = function (knex) {
  return knex.schema.createTable("jobs", function (table) {
    table.string("id").primary();
    table.string("type").notNullable();    
    table.string("to_email").notNullable();
    table.string("subject").notNullable();
    table.text("body").notNullable();

    table.string("status").notNullable(); 
    table.integer("attempts").defaultTo(0);
    table.text("failed_reason");

    table.timestamp("queued_at").defaultTo(knex.fn.now());
    table.timestamp("started_at");
    table.timestamp("completed_at");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("jobs");
};

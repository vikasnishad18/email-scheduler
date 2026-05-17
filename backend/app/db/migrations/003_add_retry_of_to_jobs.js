exports.up = function (knex) {
  return knex.schema.alterTable("jobs", function (table) {
    table.string("retry_of").nullable().index();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("jobs", function (table) {
    table.dropColumn("retry_of");
  });
};

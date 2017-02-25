/**
 * Documents migrations.
 */

exports.up = function( knex ) {
	return knex.schema.createTable( 'documents', table => {
		table.increments();
		table.date( 'date' ).index().notNullable();
		table.string( 'name' ).notNullable();
		table.string( 'description' );
	});
};

exports.down = function( knex ) {
	return knex.schema.dropTable( 'documents' );
};

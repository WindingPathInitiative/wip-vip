/**
 * Document category migrations.
 */

exports.up = function( knex ) {
	return knex.schema.createTable( 'document_categories', table => {
		table.increments();
		table.string( 'name' ).notNullable();
		table.string( 'parents' ).defaultTo( '0' ).index();
	});
};

exports.down = function( knex ) {
	return knex.schema.dropTable( 'document_categories' );
};

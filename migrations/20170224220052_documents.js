/**
 * Documents migrations.
 */

exports.up = function( knex ) {
	return knex.schema.createTable( 'documents', table => {
		table.increments();
		table.date( 'date' ).index().notNullable();
		table.string( 'name' ).notNullable();
		table.string( 'description' );
		table.integer( 'categoryId', 11 ).unsigned().index()
		.references( 'document_categories.id' ).onDelete( 'RESTRICT' ).onUpdate( 'CASCADE' );
	});
};

exports.down = function( knex ) {
	return knex.schema.dropTable( 'documents' );
};

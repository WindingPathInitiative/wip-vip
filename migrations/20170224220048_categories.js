/**
 * Membership Class migrations.
 */

exports.up = function( knex ) {
	return knex.schema.createTable( 'categories', table => {
		table.increments();
		table.string( 'name' ).notNullable();
		table.integer( 'totalLimit' );
		table.integer( 'entryLimit' );
		table.date( 'start' ).index().notNullable();
		table.date( 'end' ).index();
		table.enum( 'type', [ 'prestige', 'vip' ] ).index().notNullable().defaultTo( 'prestige' );
	});
};

exports.down = function( knex ) {
	return knex.schema.dropTable( 'categories' );
};

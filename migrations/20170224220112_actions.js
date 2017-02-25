/**
 * Actions migrations.
 */

exports.up = function( knex ) {
	return knex.schema.createTable( 'actions', table => {
		table.increments();
		table.integer( 'awardId' ).index();
		table.integer( 'mcId' ).index();
		table.integer( 'office' ).index().notNullable();
		table.integer( 'user' ).index().notNullable();
		table.enum( 'action', [ 'Nominated', 'Awarded', 'Modified', 'Revoked' ] ).notNullable();
		table.json( 'previous' );
		table.text( 'note' );
	});
};

exports.down = function( knex ) {
	return knex.schema.dropTable( 'actions' );
};

/**
 * Actions migrations.
 */

exports.up = function( knex ) {
	return knex.schema.createTable( 'actions', table => {
		table.increments();
		table.integer( 'awardId', 11 ).unsigned().index()
		.references( 'awards.id' ).onDelete( 'CASCADE' ).onUpdate( 'CASCADE' );
		table.integer( 'mcId', 11 ).unsigned().index()
		.references( 'mc.id' ).onDelete( 'CASCADE' ).onUpdate( 'CASCADE' );;
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
